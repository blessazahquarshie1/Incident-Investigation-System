use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgConnection;

use crate::{
    db,
    error::{AppError, AppResult},
    extract::ActingOfficer,
    AppState,
};

const PRIORITIES: &[&str] = &["low", "medium", "high", "critical"];
const STATUSES: &[&str] = &["open", "investigating", "pending", "closed"];
const CASE_TYPES: &[&str] = &["theft", "fraud", "assault", "cybercrime", "other"];
const DOC_KINDS: &[&str] = &["report", "warrant", "statement", "court-order", "other"];

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCaseBody {
    title: String,
    description: String,
    #[serde(rename = "type")]
    case_type: String,
    priority: String,
    lead_investigator: String,
}

#[derive(Deserialize)]
pub struct DocumentBody {
    title: String,
    kind: String,
}

/// POST /api/cases  { title, description, type, priority, leadInvestigator }
pub async fn create_case(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Json(body): Json<CreateCaseBody>,
) -> AppResult<Json<Value>> {
    if body.title.trim().is_empty() {
        return Err(AppError::BadRequest("title is required".into()));
    }
    if !CASE_TYPES.contains(&body.case_type.as_str()) {
        return Err(AppError::BadRequest(format!("invalid type: {}", body.case_type)));
    }
    if !PRIORITIES.contains(&body.priority.as_str()) {
        return Err(AppError::BadRequest(format!("invalid priority: {}", body.priority)));
    }

    let mut tx = state.db.begin().await?;

    if officer_name(&mut *tx, &body.lead_investigator).await?.is_none() {
        return Err(AppError::BadRequest(format!(
            "officer {} does not exist",
            body.lead_investigator
        )));
    }

    let id = db::next_id(&mut *tx, "CASE", 5).await?;
    sqlx::query(
        "INSERT INTO cases (id, title, description, type, priority, status, lead_investigator, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'open', $6, now(), now())",
    )
    .bind(&id)
    .bind(&body.title)
    .bind(&body.description)
    .bind(&body.case_type)
    .bind(&body.priority)
    .bind(&body.lead_investigator)
    .execute(&mut *tx)
    .await?;

    let description = format!("Case {id} created: {}", body.title);
    let activity =
        db::log_activity(&mut *tx, Some(&id), &officer, "case-created", &description).await?;
    let case = db::case_json(&mut *tx, &id).await?;

    tx.commit().await?;
    Ok(Json(json!({ "case": case, "activity": activity })))
}

/// POST /api/cases/{case_id}/documents  { title, kind }
pub async fn add_document(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<DocumentBody>,
) -> AppResult<Json<Value>> {
    if body.title.trim().is_empty() {
        return Err(AppError::BadRequest("title is required".into()));
    }
    if !DOC_KINDS.contains(&body.kind.as_str()) {
        return Err(AppError::BadRequest(format!("invalid kind: {}", body.kind)));
    }

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "D", 3).await?;
    let document = sqlx::query_scalar::<_, Value>(
        "INSERT INTO documents AS d (id, case_id, title, kind, uploaded_at, uploaded_by) \
         VALUES ($1, $2, $3, $4, now(), $5) \
         RETURNING jsonb_build_object('id', d.id, 'caseId', d.case_id, 'title', d.title, \
           'kind', d.kind, 'uploadedAt', iso(d.uploaded_at), 'uploadedBy', d.uploaded_by)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&body.title)
    .bind(&body.kind)
    .bind(&officer)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(&case_id)
        .execute(&mut *tx)
        .await?;

    let description = format!("Document \"{}\" added", body.title);
    let activity =
        db::log_activity(&mut *tx, Some(&case_id), &officer, "document-added", &description).await?;
    let case = db::case_json(&mut *tx, &case_id).await?;

    tx.commit().await?;
    Ok(Json(json!({ "document": document, "case": case, "activity": activity })))
}

#[derive(Deserialize)]
pub struct PriorityBody {
    priority: String,
}

#[derive(Deserialize)]
pub struct StatusBody {
    status: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeadBody {
    officer_id: String,
}

#[derive(Deserialize)]
pub struct NoteBody {
    text: String,
}

/// PATCH /api/cases/{case_id}/priority  { "priority": "high" }
pub async fn change_priority(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<PriorityBody>,
) -> AppResult<Json<Value>> {
    set_case_field(&state, &officer, &case_id, "priority", &body.priority, PRIORITIES).await
}

/// PATCH /api/cases/{case_id}/status  { "status": "closed" }
pub async fn change_status(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<StatusBody>,
) -> AppResult<Json<Value>> {
    set_case_field(&state, &officer, &case_id, "status", &body.status, STATUSES).await
}

/// Shared by priority/status: update the column, bump updated_at, log "<column>-changed".
/// `column` is always a hard-coded literal, never user input.
async fn set_case_field(
    state: &AppState,
    officer: &str,
    case_id: &str,
    column: &'static str,
    value: &str,
    allowed: &[&str],
) -> AppResult<Json<Value>> {
    if !allowed.contains(&value) {
        return Err(AppError::BadRequest(format!("invalid {column}: {value}")));
    }

    let mut tx = state.db.begin().await?;

    let select_sql = format!("SELECT {column} FROM cases WHERE id = $1 FOR UPDATE");
    let old = sqlx::query_scalar::<_, String>(&select_sql)
        .bind(case_id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("case {case_id} not found")))?;

    let update_sql = format!("UPDATE cases SET {column} = $2, updated_at = now() WHERE id = $1");
    sqlx::query(&update_sql)
        .bind(case_id)
        .bind(value)
        .execute(&mut *tx)
        .await?;

    let description = format!(
        "Case {column} changed: {} → {}",
        old.to_uppercase(),
        value.to_uppercase()
    );
    let action = format!("{column}-changed");
    let activity = db::log_activity(&mut *tx, Some(case_id), officer, &action, &description).await?;
    let case = db::case_json(&mut *tx, case_id).await?;

    tx.commit().await?;
    Ok(Json(json!({ "case": case, "activity": activity })))
}

async fn officer_name(conn: &mut PgConnection, id: &str) -> AppResult<Option<String>> {
    Ok(
        sqlx::query_scalar::<_, String>("SELECT full_name FROM officers WHERE id = $1")
            .bind(id)
            .fetch_optional(&mut *conn)
            .await?,
    )
}

/// PATCH /api/cases/{case_id}/lead-investigator  { "officerId": "O-002" }
pub async fn change_lead(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<LeadBody>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;

    let old_officer_id = sqlx::query_scalar::<_, String>(
        "SELECT lead_investigator FROM cases WHERE id = $1 FOR UPDATE",
    )
    .bind(&case_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("case {case_id} not found")))?;

    let old_name = officer_name(&mut *tx, &old_officer_id)
        .await?
        .unwrap_or_else(|| old_officer_id.clone());
    let new_name = officer_name(&mut *tx, &body.officer_id)
        .await?
        .ok_or_else(|| AppError::BadRequest(format!("officer {} does not exist", body.officer_id)))?;

    sqlx::query("UPDATE cases SET lead_investigator = $2, updated_at = now() WHERE id = $1")
        .bind(&case_id)
        .bind(&body.officer_id)
        .execute(&mut *tx)
        .await?;

    let description = format!("Lead investigator changed: {old_name} → {new_name}");
    let activity =
        db::log_activity(&mut *tx, Some(&case_id), &officer, "lead-changed", &description).await?;
    let case = db::case_json(&mut *tx, &case_id).await?;

    tx.commit().await?;
    Ok(Json(json!({ "case": case, "activity": activity })))
}

/// POST /api/cases/{case_id}/notes  { "text": "..." }
pub async fn add_note(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<NoteBody>,
) -> AppResult<Json<Value>> {
    if body.text.trim().is_empty() {
        return Err(AppError::BadRequest("note text is required".into()));
    }

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "N", 3).await?;
    let note = sqlx::query_scalar::<_, Value>(
        "INSERT INTO notes AS n (id, case_id, author_id, created_at, text) \
         VALUES ($1, $2, $3, now(), $4) \
         RETURNING jsonb_build_object('id', n.id, 'caseId', n.case_id, 'authorId', n.author_id, \
           'createdAt', iso(n.created_at), 'text', n.text)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&officer)
    .bind(&body.text)
    .fetch_one(&mut *tx)
    .await?;

    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(&case_id)
        .execute(&mut *tx)
        .await?;

    let activity =
        db::log_activity(&mut *tx, Some(&case_id), &officer, "note-added", "Note added").await?;
    let case = db::case_json(&mut *tx, &case_id).await?;

    tx.commit().await?;
    Ok(Json(json!({ "note": note, "case": case, "activity": activity })))
}