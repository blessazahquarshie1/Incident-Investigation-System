//! Evidence upload + custody state machine (port of client/web/src/lib/custody.ts).
use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::Value;

use crate::{
    db,
    error::{AppError, AppResult},
    extract::ActingOfficer,
    AppState,
};

const EVIDENCE_TYPES: &[&str] = &["document", "photo", "video", "device", "vehicle", "digital"];
const CUSTODY_ACTIONS: &[&str] = &[
    "collected",
    "transferred",
    "submitted-to-evidence-room",
    "analysis-started",
    "analysis-completed",
    "released",
    "destroyed",
];

fn bad(ok: bool, msg: impl Into<String>) -> AppResult<()> {
    if ok {
        Ok(())
    } else {
        Err(AppError::BadRequest(msg.into()))
    }
}

/// Status is always derived from the last custody action (never stored independently).
fn derive_status(last_action: Option<&str>) -> &'static str {
    match last_action {
        None | Some("collected") => "collected",
        Some("transferred") => "with-officer",
        Some("submitted-to-evidence-room") => "in-evidence-room",
        Some("analysis-started") => "under-analysis",
        Some("analysis-completed") => "analysed",
        Some("released") => "released",
        Some("destroyed") => "destroyed",
        _ => "collected",
    }
}

fn allowed_actions(status: &str) -> &'static [&'static str] {
    match status {
        "collected" | "with-officer" => &["transferred", "submitted-to-evidence-room"],
        "in-evidence-room" => &["transferred", "analysis-started", "released", "destroyed"],
        "under-analysis" => &["analysis-completed"],
        "analysed" => &["transferred", "submitted-to-evidence-room", "released", "destroyed"],
        _ => &[],
    }
}

// ---------------------------------------------------------------- upload

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewEvidenceBody {
    title: String,
    #[serde(rename = "type")]
    evidence_type: String,
    description: String,
    location_id: Option<String>,
    #[serde(default)]
    linked_persons: Vec<String>,
}

/// POST /api/cases/{case_id}/evidence
pub async fn add_evidence(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<NewEvidenceBody>,
) -> AppResult<Json<Value>> {
    let title = body.title.trim();
    let description = body.description.trim();
    bad(!title.is_empty(), "evidence title is required")?;
    bad(!description.is_empty(), "evidence description is required")?;
    bad(
        EVIDENCE_TYPES.contains(&body.evidence_type.as_str()),
        format!("invalid type: {}", body.evidence_type),
    )?;
    let location_id = body.location_id.as_deref().filter(|s| !s.is_empty());

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "E", 3).await?;
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO evidence \
         (id, case_id, type, title, description, collected_at, collected_by, location_id, status) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'collected')",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&body.evidence_type)
    .bind(title)
    .bind(description)
    .bind(now)
    .bind(&officer)
    .bind(location_id)
    .execute(&mut *tx)
    .await?;

    for person_id in &body.linked_persons {
        sqlx::query(
            "INSERT INTO evidence_persons (evidence_id, person_id) VALUES ($1, $2) \
             ON CONFLICT DO NOTHING",
        )
        .bind(&id)
        .bind(person_id)
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query(
        "INSERT INTO custody_entries (id, evidence_id, seq, action, timestamp, officer_id) \
         VALUES ($1, $2, 1, 'collected', $3, $4)",
    )
    .bind(format!("CE-{id}-1"))
    .bind(&id)
    .bind(now)
    .bind(&officer)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(&case_id)
        .execute(&mut *tx)
        .await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "evidence-uploaded",
        &format!("Evidence {id} uploaded: {title}"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

// ---------------------------------------------------------------- custody

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustodyBody {
    action: String,
    to_officer_id: Option<String>,
    note: Option<String>,
}

/// POST /api/evidence/{evidence_id}/custody  { action, toOfficerId?, note? }
/// Validation failures come back as 400 with the same wording as lib/custody.ts.
pub async fn apply_custody_action(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(evidence_id): Path<String>,
    Json(body): Json<CustodyBody>,
) -> AppResult<Json<Value>> {
    let action = body.action.as_str();
    bad(CUSTODY_ACTIONS.contains(&action), format!("invalid action: {action}"))?;

    let mut tx = state.db.begin().await?;
    let (case_id, collected_by) = sqlx::query_as::<_, (String, String)>(
        "SELECT case_id, collected_by FROM evidence WHERE id = $1 FOR UPDATE",
    )
    .bind(&evidence_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("evidence {evidence_id} not found")))?;

    // (action, timestamp, officer_id, to_officer_id), oldest first
    let history = sqlx::query_as::<_, (String, DateTime<Utc>, String, Option<String>)>(
        "SELECT action, timestamp, officer_id, to_officer_id \
         FROM custody_entries WHERE evidence_id = $1 ORDER BY seq",
    )
    .bind(&evidence_id)
    .fetch_all(&mut *tx)
    .await?;
    let last = history.last();

    let status = derive_status(last.map(|h| h.0.as_str()));
    let permitted = allowed_actions(status);

    // 1. Is the action allowed from the current status?
    if !permitted.contains(&action) {
        let reason = match status {
            "destroyed" => format!(
                "Evidence {evidence_id} cannot be {action}: it has already been marked destroyed."
            ),
            "released" => format!(
                "Evidence {evidence_id} cannot be {action}: it has already been released."
            ),
            _ => format!(
                "Evidence {evidence_id} currently has status '{status}', which does not allow '{action}'. Allowed actions: {}.",
                if permitted.is_empty() { "none".to_string() } else { permitted.join(", ") }
            ),
        };
        return Err(AppError::BadRequest(reason));
    }

    // Current custodian: recipient of the last transfer, else the last entry's officer.
    let holder = match last {
        None => collected_by.clone(),
        Some(h) => match (&h.3, h.0.as_str()) {
            (Some(to), "transferred") => to.clone(),
            _ => h.2.clone(),
        },
    };

    // 2. Transfer-specific checks
    let to_officer = body.to_officer_id.as_deref().filter(|s| !s.is_empty());
    if action == "transferred" {
        let Some(to) = to_officer else {
            return Err(AppError::BadRequest(
                "A recipient officer must be specified when transferring custody.".into(),
            ));
        };
        if to == holder {
            return Err(AppError::BadRequest(
                "Cannot transfer evidence to the current custodian.".into(),
            ));
        }
    }

    // 3. Chronological order
    let now = Utc::now();
    if let Some(h) = last {
        if now < h.1 {
            return Err(AppError::BadRequest(format!(
                "Action timestamp cannot be earlier than the previous custody entry ({}).",
                h.1.to_rfc3339()
            )));
        }
    }

    // 4. Custodian authority (not required while it sits in the evidence room)
    if status != "in-evidence-room"
        && matches!(action, "transferred" | "submitted-to-evidence-room" | "analysis-started")
        && officer != holder
    {
        return Err(AppError::BadRequest(format!(
            "Only the current custodian ({holder}) can perform this action, but officer {officer} was provided."
        )));
    }

    // Append the entry, update derived status, touch the case, log activity.
    let seq = sqlx::query_scalar::<_, i32>(
        "SELECT COALESCE(MAX(seq), 0) + 1 FROM custody_entries WHERE evidence_id = $1",
    )
    .bind(&evidence_id)
    .fetch_one(&mut *tx)
    .await?;
    let to_store = if action == "transferred" { to_officer } else { None };
    let note = body.note.as_deref().map(str::trim).filter(|s| !s.is_empty());

    sqlx::query(
        "INSERT INTO custody_entries \
         (id, evidence_id, seq, action, timestamp, officer_id, to_officer_id, note) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(format!("CE-{evidence_id}-{}", history.len() + 1))
    .bind(&evidence_id)
    .bind(seq)
    .bind(action)
    .bind(now)
    .bind(&officer)
    .bind(to_store)
    .bind(note)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE evidence SET status = $2 WHERE id = $1")
        .bind(&evidence_id)
        .bind(derive_status(Some(action)))
        .execute(&mut *tx)
        .await?;
    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(&case_id)
        .execute(&mut *tx)
        .await?;

    let description = match action {
        "collected" => format!("Evidence {evidence_id} collected"),
        "transferred" => {
            let to = to_officer.unwrap_or_default();
            let name = sqlx::query_scalar::<_, String>("SELECT full_name FROM officers WHERE id = $1")
                .bind(to)
                .fetch_optional(&mut *tx)
                .await?
                .unwrap_or_else(|| to.to_string());
            format!("Evidence {evidence_id} transferred to {name}")
        }
        "submitted-to-evidence-room" => format!("Evidence {evidence_id} submitted to evidence room"),
        "analysis-started" => format!("Evidence {evidence_id} analysis started"),
        "analysis-completed" => format!("Evidence {evidence_id} analysis completed"),
        "released" => format!("Evidence {evidence_id} released"),
        _ => format!("Evidence {evidence_id} destroyed"),
    };
    db::log_activity(&mut *tx, Some(&case_id), &officer, "custody-action", &description).await?;
    db::finish(tx, Some(evidence_id)).await
}
