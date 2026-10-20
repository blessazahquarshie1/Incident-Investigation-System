use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::Value;
use sqlx::PgConnection;

use crate::{
    db,
    error::{AppError, AppResult},
    extract::ActingOfficer,
    AppState,
};

const CASE_TYPES: &[&str] = &["theft", "fraud", "assault", "cybercrime", "other"];
const PERSON_TYPES: &[&str] = &["suspect", "witness", "victim", "person-of-interest"];
const INCIDENT_STATUSES: &[&str] = &["unresolved", "resolved"];
const SIGHTING_SOURCES: &[&str] = &["cctv", "patrol", "anpr", "informant"];
const SIGHTING_ACTIONS: &[&str] = &["entered", "left", "seen"];
const PHONE_KINDS: &[&str] = &["call", "sms", "cell-tower"];
const EDGE_KINDS: &[&str] = &["visited", "involved-in", "witnessed", "owns", "connected-to"];

// ---------------------------------------------------------------- helpers

fn require(ok: bool, msg: impl Into<String>) -> AppResult<()> {
    if ok {
        Ok(())
    } else {
        Err(AppError::BadRequest(msg.into()))
    }
}

fn not_future(t: &DateTime<Utc>, label: &str) -> AppResult<()> {
    require(*t <= Utc::now(), format!("{label} cannot be in the future"))
}

async fn touch_case(conn: &mut PgConnection, case_id: &str) -> AppResult<()> {
    sqlx::query("UPDATE cases SET updated_at = now() WHERE id = $1")
        .bind(case_id)
        .execute(&mut *conn)
        .await?;
    Ok(())
}

async fn row_exists(conn: &mut PgConnection, table: &'static str, id: &str) -> AppResult<bool> {
    let sql = format!("SELECT 1 FROM {table} WHERE id = $1");
    Ok(sqlx::query_scalar::<_, i32>(&sql)
        .bind(id)
        .fetch_optional(&mut *conn)
        .await?
        .is_some())
}

/// Fetches one text column for an id, or 400 "<what> <id> does not exist".
async fn lookup(conn: &mut PgConnection, sql: &'static str, id: &str, what: &str) -> AppResult<String> {
    sqlx::query_scalar::<_, String>(sql)
        .bind(id)
        .fetch_optional(&mut *conn)
        .await?
        .ok_or_else(|| AppError::BadRequest(format!("{what} {id} does not exist")))
}

/// Same labels as the frontend's getEntityLabel().
async fn entity_label(conn: &mut PgConnection, id: &str) -> AppResult<String> {
    let sql = if id.starts_with("P-") {
        "SELECT full_name FROM persons WHERE id = $1"
    } else if id.starts_with("L-") {
        "SELECT name FROM locations WHERE id = $1"
    } else if id.starts_with("V-") {
        "SELECT registration || ' (' || make || ' ' || model || ')' FROM vehicles WHERE id = $1"
    } else if id.starts_with("I-") {
        "SELECT title FROM incidents WHERE id = $1"
    } else if id.starts_with("E-") {
        "SELECT title FROM evidence WHERE id = $1"
    } else {
        return Ok(id.to_string());
    };
    let label = sqlx::query_scalar::<_, String>(sql)
        .bind(id)
        .fetch_optional(&mut *conn)
        .await?;
    Ok(label.unwrap_or_else(|| id.to_string()))
}

/// Current owner of a vehicle: an 'owns' edge wins, vehicles.owner_id is the fallback.
async fn vehicle_owner(
    conn: &mut PgConnection,
    vehicle_id: &str,
) -> AppResult<Option<(String, String)>> {
    let from_edge = sqlx::query_as::<_, (String, String)>(
        "SELECT p.id, p.full_name FROM relationships r \
         JOIN persons p ON p.id = CASE WHEN r.target = $1 THEN r.source ELSE r.target END \
         WHERE r.relationship = 'owns' AND (r.target = $1 OR r.source = $1) \
         ORDER BY r.id LIMIT 1",
    )
    .bind(vehicle_id)
    .fetch_optional(&mut *conn)
    .await?;
    if from_edge.is_some() {
        return Ok(from_edge);
    }
    Ok(sqlx::query_as::<_, (String, String)>(
        "SELECT p.id, p.full_name FROM vehicles v JOIN persons p ON p.id = v.owner_id WHERE v.id = $1",
    )
    .bind(vehicle_id)
    .fetch_optional(&mut *conn)
    .await?)
}

/// Owner-conflict rule: the previous owner is demoted to 'connected-to', and
/// vehicles.owner_id is kept in sync with the new owner.
async fn make_owner(
    conn: &mut PgConnection,
    case_id: &str,
    officer: &str,
    vehicle_id: &str,
    person_id: &str,
) -> AppResult<()> {
    let reg = sqlx::query_scalar::<_, String>("SELECT registration FROM vehicles WHERE id = $1")
        .bind(vehicle_id)
        .fetch_optional(&mut *conn)
        .await?;
    let new_name = sqlx::query_scalar::<_, String>("SELECT full_name FROM persons WHERE id = $1")
        .bind(person_id)
        .fetch_optional(&mut *conn)
        .await?;
    let (Some(reg), Some(new_name)) = (reg, new_name) else {
        return Ok(());
    };

    if let Some((old_id, old_name)) = vehicle_owner(&mut *conn, vehicle_id).await? {
        if old_id != person_id {
            sqlx::query(
                "INSERT INTO relationships (source, target, relationship) \
                 VALUES ($1, $2, 'connected-to') ON CONFLICT DO NOTHING",
            )
            .bind(&old_id)
            .bind(vehicle_id)
            .execute(&mut *conn)
            .await?;
            sqlx::query(
                "DELETE FROM relationships WHERE relationship = 'owns' \
                 AND ((source = $1 AND target = $2) OR (source = $2 AND target = $1))",
            )
            .bind(&old_id)
            .bind(vehicle_id)
            .execute(&mut *conn)
            .await?;
            let description = format!(
                "{reg} owner changed from {old_name} to {new_name}; {old_name} is now connected to the vehicle."
            );
            db::log_activity(&mut *conn, Some(case_id), officer, "vehicle-linked", &description)
                .await?;
        }
    }

    sqlx::query("UPDATE vehicles SET owner_id = $2 WHERE id = $1")
        .bind(vehicle_id)
        .bind(person_id)
        .execute(&mut *conn)
        .await?;
    Ok(())
}

// ---------------------------------------------------------------- persons

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LinkPersonBody {
    person_id: String,
}

/// POST /api/cases/{case_id}/persons/link  { personId }
pub async fn add_person_to_case(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<LinkPersonBody>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    let name = lookup(
        &mut *tx,
        "SELECT full_name FROM persons WHERE id = $1",
        &body.person_id,
        "person",
    )
    .await?;

    sqlx::query("INSERT INTO case_persons (case_id, person_id) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind(&case_id)
        .bind(&body.person_id)
        .execute(&mut *tx)
        .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "person-added",
        &format!("Added {name} to the case"),
    )
    .await?;
    db::finish(tx, Some(body.person_id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewPersonBody {
    full_name: String,
    #[serde(rename = "type")]
    person_type: String,
    phone: Option<String>,
    address: Option<String>,
}

/// POST /api/cases/{case_id}/persons  { fullName, type, phone?, address? }
pub async fn create_person_for_case(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<NewPersonBody>,
) -> AppResult<Json<Value>> {
    let name = body.full_name.trim().to_string();
    require(!name.is_empty(), "full name is required")?;
    require(
        PERSON_TYPES.contains(&body.person_type.as_str()),
        format!("invalid type: {}", body.person_type),
    )?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "P", 3).await?;
    sqlx::query("INSERT INTO persons (id, full_name, type, phone, address) VALUES ($1, $2, $3, $4, $5)")
        .bind(&id)
        .bind(&name)
        .bind(&body.person_type)
        .bind(&body.phone)
        .bind(&body.address)
        .execute(&mut *tx)
        .await?;
    sqlx::query("INSERT INTO case_persons (case_id, person_id) VALUES ($1, $2)")
        .bind(&case_id)
        .bind(&id)
        .execute(&mut *tx)
        .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "person-added",
        &format!("Added {name} to the case"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

// ---------------------------------------------------------------- incidents

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IncidentBody {
    title: String,
    description: String,
    #[serde(rename = "type")]
    incident_type: String,
    location_id: String,
    occurred_at: DateTime<Utc>,
    status: String,
}

/// POST /api/cases/{case_id}/incidents
pub async fn add_incident(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<IncidentBody>,
) -> AppResult<Json<Value>> {
    require(!body.title.trim().is_empty(), "incident title is required")?;
    require(!body.description.trim().is_empty(), "incident description is required")?;
    require(
        CASE_TYPES.contains(&body.incident_type.as_str()),
        format!("invalid type: {}", body.incident_type),
    )?;
    require(
        INCIDENT_STATUSES.contains(&body.status.as_str()),
        format!("invalid status: {}", body.status),
    )?;
    not_future(&body.occurred_at, "incident occurred time")?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "I", 3).await?;
    sqlx::query(
        "INSERT INTO incidents (id, case_id, title, description, type, location_id, occurred_at, status) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(body.title.trim())
    .bind(body.description.trim())
    .bind(&body.incident_type)
    .bind(&body.location_id)
    .bind(body.occurred_at)
    .bind(&body.status)
    .execute(&mut *tx)
    .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "incident-added",
        &format!("Incident {id} added: {}", body.title.trim()),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

// ---------------------------------------------------------------- locations

#[derive(Deserialize)]
pub struct LocationBody {
    name: String,
    city: String,
    region: String,
}

/// POST /api/locations  { name, city, region }. Re-uses an existing name+city match.
pub async fn create_location(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Json(body): Json<LocationBody>,
) -> AppResult<Json<Value>> {
    let (name, city, region) = (body.name.trim(), body.city.trim(), body.region.trim());
    require(
        !name.is_empty() && !city.is_empty() && !region.is_empty(),
        "name, city and region are required",
    )?;

    let mut tx = state.db.begin().await?;
    let existing = sqlx::query_scalar::<_, String>(
        "SELECT id FROM locations WHERE lower(btrim(name)) = lower($1) \
         AND lower(btrim(city)) = lower($2) ORDER BY seq LIMIT 1",
    )
    .bind(name)
    .bind(city)
    .fetch_optional(&mut *tx)
    .await?;
    if let Some(id) = existing {
        return db::finish(tx, Some(id)).await;
    }

    let id = db::next_id(&mut *tx, "L", 3).await?;
    sqlx::query("INSERT INTO locations (id, name, city, region) VALUES ($1, $2, $3, $4)")
        .bind(&id)
        .bind(name)
        .bind(city)
        .bind(region)
        .execute(&mut *tx)
        .await?;
    db::log_activity(
        &mut *tx,
        None,
        &officer,
        "location-added",
        &format!("Location {name} added"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VisitedBody {
    location_id: String,
    person_id: String,
}

/// POST /api/cases/{case_id}/visited-locations  { locationId, personId }
pub async fn add_visited_location(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<VisitedBody>,
) -> AppResult<Json<Value>> {
    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    let person_name = lookup(
        &mut *tx,
        "SELECT full_name FROM persons WHERE id = $1",
        &body.person_id,
        "person",
    )
    .await?;
    let location_name = lookup(
        &mut *tx,
        "SELECT name FROM locations WHERE id = $1",
        &body.location_id,
        "location",
    )
    .await?;

    let inserted = sqlx::query(
        "INSERT INTO relationships (source, target, relationship) VALUES ($1, $2, 'visited') \
         ON CONFLICT DO NOTHING",
    )
    .bind(&body.person_id)
    .bind(&body.location_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        > 0;
    if inserted {
        touch_case(&mut *tx, &case_id).await?;
    }
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "location-added",
        &format!("{person_name} linked to {location_name}: visited"),
    )
    .await?;
    db::finish(tx, Some(body.location_id)).await
}

// ---------------------------------------------------------------- vehicles & links

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VehicleConn {
    target_id: String,
    relationship: String,
}

#[derive(Deserialize)]
pub struct VehicleBody {
    registration: String,
    make: String,
    model: String,
    color: String,
    connections: Vec<VehicleConn>,
}

/// POST /api/cases/{case_id}/vehicles  { registration, make, model, color, connections[] }
pub async fn create_vehicle(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<VehicleBody>,
) -> AppResult<Json<Value>> {
    let reg = body.registration.trim().to_uppercase();
    let (make, model, color) = (body.make.trim(), body.model.trim(), body.color.trim());
    require(
        !reg.is_empty() && !make.is_empty() && !model.is_empty() && !color.is_empty(),
        "registration, make, model and colour are required",
    )?;
    require(
        !body.connections.is_empty(),
        "a vehicle must be connected to at least one person or incident of this case",
    )?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    for c in &body.connections {
        let ok = match c.relationship.as_str() {
            "owns" | "connected-to" => row_exists(&mut *tx, "persons", &c.target_id).await?,
            "involved-in" => row_exists(&mut *tx, "incidents", &c.target_id).await?,
            _ => false,
        };
        require(ok, format!("invalid {} connection to {}", c.relationship, c.target_id))?;
    }

    let duplicate = sqlx::query_scalar::<_, i32>(
        r"SELECT 1 FROM vehicles WHERE upper(regexp_replace(registration, '[\s-]', '', 'g')) = upper(regexp_replace($1, '[\s-]', '', 'g')) LIMIT 1",
    )
    .bind(&reg)
    .fetch_optional(&mut *tx)
    .await?;
    if duplicate.is_some() {
        return Err(AppError::Conflict(
            "a vehicle with this registration already exists".into(),
        ));
    }

    let id = db::next_id(&mut *tx, "V", 3).await?;
    let owner_id = body
        .connections
        .iter()
        .find(|c| c.relationship == "owns")
        .map(|c| c.target_id.clone());
    sqlx::query(
        "INSERT INTO vehicles (id, registration, make, model, color, owner_id) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(&reg)
    .bind(make)
    .bind(model)
    .bind(color)
    .bind(&owner_id)
    .execute(&mut *tx)
    .await?;

    for c in &body.connections {
        let (source, target) = if c.relationship == "involved-in" {
            (id.as_str(), c.target_id.as_str())
        } else {
            (c.target_id.as_str(), id.as_str())
        };
        sqlx::query(
            "INSERT INTO relationships (source, target, relationship) VALUES ($1, $2, $3) \
             ON CONFLICT DO NOTHING",
        )
        .bind(source)
        .bind(target)
        .bind(&c.relationship)
        .execute(&mut *tx)
        .await?;
    }

    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "vehicle-added",
        &format!("Vehicle {reg} added"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

#[derive(Deserialize)]
pub struct ConnectionBody {
    source: String,
    target: String,
    relationship: String,
}

/// POST /api/cases/{case_id}/connections  { source, target, relationship }
pub async fn add_connection(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<ConnectionBody>,
) -> AppResult<Json<Value>> {
    require(
        EDGE_KINDS.contains(&body.relationship.as_str()),
        format!("invalid relationship: {}", body.relationship),
    )?;
    require(body.source.starts_with("P-"), "a connection must start from a person")?;
    let (prefix, table) = match body.relationship.as_str() {
        "visited" => ("L-", "locations"),
        "involved-in" | "witnessed" => ("I-", "incidents"),
        _ => ("V-", "vehicles"),
    };
    require(
        body.target.starts_with(prefix),
        format!("a \"{}\" connection targets a different kind of record", body.relationship),
    )?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;
    require(
        row_exists(&mut *tx, "persons", &body.source).await?,
        format!("person {} does not exist", body.source),
    )?;
    require(
        row_exists(&mut *tx, table, &body.target).await?,
        format!("{} does not exist", body.target),
    )?;

    if body.relationship == "owns" {
        make_owner(&mut *tx, &case_id, &officer, &body.target, &body.source).await?;
    }

    sqlx::query(
        "INSERT INTO relationships (source, target, relationship) VALUES ($1, $2, $3) \
         ON CONFLICT DO NOTHING",
    )
    .bind(&body.source)
    .bind(&body.target)
    .bind(&body.relationship)
    .execute(&mut *tx)
    .await?;
    touch_case(&mut *tx, &case_id).await?;

    let source_label = entity_label(&mut *tx, &body.source).await?;
    let target_label = entity_label(&mut *tx, &body.target).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "link-added",
        &format!("{source_label} linked to {target_label}: {}", body.relationship),
    )
    .await?;
    db::finish(tx, Some(body.target)).await
}

// ---------------------------------------------------------------- timeline records

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WitnessBody {
    witness_id: String,
    subject_person_id: String,
    location_id: String,
    claimed_time: DateTime<Utc>,
    recorded_at: DateTime<Utc>,
    text: String,
}

/// POST /api/cases/{case_id}/witness-statements
pub async fn add_witness_statement(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<WitnessBody>,
) -> AppResult<Json<Value>> {
    require(!body.text.trim().is_empty(), "statement text is required")?;
    not_future(&body.claimed_time, "claimed presence time")?;
    not_future(&body.recorded_at, "recording time")?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "WS", 3).await?;
    sqlx::query(
        "INSERT INTO witness_statements \
         (id, case_id, witness_id, subject_person_id, location_id, claimed_time, recorded_at, text) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&body.witness_id)
    .bind(&body.subject_person_id)
    .bind(&body.location_id)
    .bind(body.claimed_time)
    .bind(body.recorded_at)
    .bind(body.text.trim())
    .execute(&mut *tx)
    .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "timeline-record-added",
        &format!("Witness statement {id} recorded"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SightingBody {
    source: String,
    action: String,
    location_id: String,
    timestamp: DateTime<Utc>,
    vehicle_id: Option<String>,
    person_id: Option<String>,
    description: String,
}

/// POST /api/cases/{case_id}/sightings
pub async fn add_sighting(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<SightingBody>,
) -> AppResult<Json<Value>> {
    require(
        SIGHTING_SOURCES.contains(&body.source.as_str()),
        format!("invalid source: {}", body.source),
    )?;
    require(
        SIGHTING_ACTIONS.contains(&body.action.as_str()),
        format!("invalid action: {}", body.action),
    )?;
    require(
        body.vehicle_id.is_some() || body.person_id.is_some(),
        "at least one vehicle or person must be specified for the sighting",
    )?;
    require(!body.description.trim().is_empty(), "description is required")?;
    not_future(&body.timestamp, "sighting time")?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "SG", 3).await?;
    sqlx::query(
        "INSERT INTO sightings \
         (id, case_id, source, action, location_id, timestamp, description, vehicle_id, person_id) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&body.source)
    .bind(&body.action)
    .bind(&body.location_id)
    .bind(body.timestamp)
    .bind(body.description.trim())
    .bind(&body.vehicle_id)
    .bind(&body.person_id)
    .execute(&mut *tx)
    .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "timeline-record-added",
        &format!("Sighting {id} recorded"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PhoneBody {
    person_id: String,
    phone_number: String,
    kind: String,
    timestamp: DateTime<Utc>,
    location_id: Option<String>,
    other_number: Option<String>,
}

/// POST /api/cases/{case_id}/phone-records
pub async fn add_phone_record(
    State(state): State<AppState>,
    ActingOfficer(officer): ActingOfficer,
    Path(case_id): Path<String>,
    Json(body): Json<PhoneBody>,
) -> AppResult<Json<Value>> {
    require(!body.phone_number.trim().is_empty(), "phone number is required")?;
    require(
        PHONE_KINDS.contains(&body.kind.as_str()),
        format!("invalid kind: {}", body.kind),
    )?;
    if body.kind == "cell-tower" {
        require(body.location_id.is_some(), "tower location is required for cell-tower records")?;
    } else {
        require(
            body.other_number.is_some(),
            "other party phone number is required for calls and SMS",
        )?;
    }
    not_future(&body.timestamp, "timestamp")?;

    let mut tx = state.db.begin().await?;
    db::lock_case(&mut *tx, &case_id).await?;

    let id = db::next_id(&mut *tx, "PR", 3).await?;
    sqlx::query(
        "INSERT INTO phone_records \
         (id, case_id, person_id, phone_number, kind, timestamp, location_id, other_number) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&id)
    .bind(&case_id)
    .bind(&body.person_id)
    .bind(body.phone_number.trim())
    .bind(&body.kind)
    .bind(body.timestamp)
    .bind(&body.location_id)
    .bind(&body.other_number)
    .execute(&mut *tx)
    .await?;
    touch_case(&mut *tx, &case_id).await?;
    db::log_activity(
        &mut *tx,
        Some(&case_id),
        &officer,
        "timeline-record-added",
        &format!("Phone record {id} recorded"),
    )
    .await?;
    db::finish(tx, Some(id)).await
}