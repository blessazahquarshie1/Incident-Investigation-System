//! Person edit + "remove from case" cascades (ports of the old in-memory store actions).
use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;
use serde_json::Value;
use sqlx::PgConnection;

use crate::{
    db,
    error::{AppError, AppResult},
    extract::ActingOfficer,
    AppState,
};

const PERSON_TYPES: &[&str] = &["suspect", "witness", "victim", "person-of-interest"];

async fn name_of(
    conn: &mut PgConnection,
    sql: &'static str,
    id: &str,
    what: &str,
) -> AppResult<String> {
    sqlx::query_scalar::<_, String>(sql)
        .bind(id)
        .fetch_optional(&mut *conn)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("{what} {id} not found")))
}

async fn touch_case(conn: &mut PgConnection, case_id: &str) -> AppResult<()> {
    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(case_id)
        .execute(&mut *conn)
        .await?;
    Ok(())
}

// ---------------------------------------------------------------- update person

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePersonBody {
    full_name: String,
    #[serde(rename = "type")]
    person_type: String,
    phone: Option<String>,
    address: Option<String>,
    known_aliases: Option<Vec<String>>,
}

/// PATCH /api/persons/{person_id}  (full replace of the editable fields; missing = cleared)
pub async fn update_person(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(person_id): Path<String>,
    Json(body): Json<UpdatePersonBody>,
) -> AppResult<Json<Value>> {
    let name = body.full_name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("full name is required".into()));
    }
    if !PERSON_TYPES.contains(&body.person_type.as_str()) {
        return Err(AppError::BadRequest(format!("invalid type: {}", body.person_type)));
    }
    let phone = body.phone.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let address = body.address.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let aliases: Vec<String> = body
        .known_aliases
        .unwrap_or_default()
        .into_iter()
        .map(|a| a.trim().to_string())
        .filter(|a| !a.is_empty())
        .collect();

    let mut tx = state.db.begin().await?;
    let changed = sqlx::query(
        "UPDATE persons SET full_name = $2, type = $3, phone = $4, address = $5, known_aliases = $6 \
         WHERE id = $1",
    )
    .bind(&person_id)
    .bind(name)
    .bind(&body.person_type)
    .bind(phone)
    .bind(address)
    .bind(&aliases)
    .execute(&mut *tx)
    .await?
    .rows_affected();
    if changed == 0 {
        return Err(AppError::NotFound(format!("person {person_id} not found")));
    }

    let case_ids = sqlx::query_scalar::<_, String>(
        "SELECT case_id FROM case_persons WHERE person_id = $1 ORDER BY case_id",
    )
    .bind(&person_id)
    .fetch_all(&mut *tx)
    .await?;
    for cid in &case_ids {
        touch_case(&mut *tx, cid).await?;
        db::log_activity(
            &mut *tx,
            Some(cid),
            &officer,
            "status-changed",
            &format!("Updated details for {name}"),
        )
        .await?;
    }
    db::finish(tx, Some(person_id)).await
}

// ---------------------------------------------------------------- remove person

/// DELETE /api/cases/{case_id}/persons/{person_id}
/// Unlinks the person from the case; the person record and other cases stay.
pub async fn remove_person(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path((case_id, person_id)): Path<(String, String)>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    let name = name_of(&mut *tx, "SELECT full_name FROM persons WHERE id = $1", &person_id, "person").await?;

    sqlx::query("DELETE FROM case_persons WHERE case_id = $1 AND person_id = $2")
        .bind(&case_id)
        .bind(&person_id)
        .execute(&mut *tx)
        .await?;

    // Edges between this person and this case's incidents / evidence
    sqlx::query(
        "DELETE FROM relationships WHERE \
         (source = $2 AND (target IN (SELECT id FROM incidents WHERE case_id = $1) \
                        OR target IN (SELECT id FROM evidence WHERE case_id = $1))) \
         OR (target = $2 AND (source IN (SELECT id FROM incidents WHERE case_id = $1) \
                           OR source IN (SELECT id FROM evidence WHERE case_id = $1)))",
    )
    .bind(&case_id)
    .bind(&person_id)
    .execute(&mut *tx)
    .await?;

    // Evidence.linkedPersons for this case's evidence
    sqlx::query(
        "DELETE FROM evidence_persons WHERE person_id = $2 \
         AND evidence_id IN (SELECT id FROM evidence WHERE case_id = $1)",
    )
    .bind(&case_id)
    .bind(&person_id)
    .execute(&mut *tx)
    .await?;

    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "status-changed",
        &format!("Removed person {name} from case"),
    )
    .await?;
    db::finish(tx, Some(person_id)).await
}

// ---------------------------------------------------------------- remove vehicle

/// DELETE /api/cases/{case_id}/vehicles/{vehicle_id}
pub async fn remove_vehicle(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path((case_id, vehicle_id)): Path<(String, String)>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    let reg = name_of(&mut *tx, "SELECT registration FROM vehicles WHERE id = $1", &vehicle_id, "vehicle").await?;

    // Edges between the vehicle and this case's people / incidents
    sqlx::query(
        "DELETE FROM relationships WHERE \
         (source = $2 AND (target IN (SELECT person_id FROM case_persons WHERE case_id = $1) \
                        OR target IN (SELECT id FROM incidents WHERE case_id = $1))) \
         OR (target = $2 AND (source IN (SELECT person_id FROM case_persons WHERE case_id = $1) \
                           OR source IN (SELECT id FROM incidents WHERE case_id = $1)))",
    )
    .bind(&case_id)
    .bind(&vehicle_id)
    .execute(&mut *tx)
    .await?;

    // Detach owner if the owner belongs to this case
    sqlx::query(
        "UPDATE vehicles SET owner_id = NULL WHERE id = $2 \
         AND owner_id IN (SELECT person_id FROM case_persons WHERE case_id = $1)",
    )
    .bind(&case_id)
    .bind(&vehicle_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query("DELETE FROM sightings WHERE case_id = $1 AND vehicle_id = $2")
        .bind(&case_id)
        .bind(&vehicle_id)
        .execute(&mut *tx)
        .await?;

    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "status-changed",
        &format!("Removed vehicle {reg} from case"),
    )
    .await?;
    db::finish(tx, Some(vehicle_id)).await
}

// ---------------------------------------------------------------- remove location

/// DELETE /api/cases/{case_id}/locations/{location_id}
pub async fn remove_location(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path((case_id, location_id)): Path<(String, String)>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    let name = name_of(&mut *tx, "SELECT name FROM locations WHERE id = $1", &location_id, "location").await?;

    // 'visited' edges from this case's people
    sqlx::query(
        "DELETE FROM relationships WHERE relationship = 'visited' AND target = $2 \
         AND source IN (SELECT person_id FROM case_persons WHERE case_id = $1)",
    )
    .bind(&case_id)
    .bind(&location_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query("DELETE FROM sightings WHERE case_id = $1 AND location_id = $2")
        .bind(&case_id)
        .bind(&location_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query("UPDATE evidence SET location_id = NULL WHERE case_id = $1 AND location_id = $2")
        .bind(&case_id)
        .bind(&location_id)
        .execute(&mut *tx)
        .await?;

    // Incidents need a location (NOT NULL): move them to another location, same as the old store did.
    let affected = sqlx::query_scalar::<_, i64>(
        "SELECT count(*) FROM incidents WHERE case_id = $1 AND location_id = $2",
    )
    .bind(&case_id)
    .bind(&location_id)
    .fetch_one(&mut *tx)
    .await?;
    if affected > 0 {
        let other = sqlx::query_scalar::<_, String>(
            "SELECT id FROM locations WHERE id <> $1 ORDER BY seq LIMIT 1",
        )
        .bind(&location_id)
        .fetch_optional(&mut *tx)
        .await?;
        let Some(other) = other else {
            return Err(AppError::BadRequest(
                "cannot remove the only location while incidents use it".into(),
            ));
        };
        sqlx::query("UPDATE incidents SET location_id = $3 WHERE case_id = $1 AND location_id = $2")
            .bind(&case_id)
            .bind(&location_id)
            .bind(&other)
            .execute(&mut *tx)
            .await?;
    }

    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "status-changed",
        &format!("Removed location {name} from case"),
    )
    .await?;
    db::finish(tx, Some(location_id)).await
}
