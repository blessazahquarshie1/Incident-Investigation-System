//! Shared database helpers for the mutation endpoints.
use serde_json::Value;
use sqlx::PgConnection;

use crate::error::{AppError, AppResult};

/// JSON for one case row (table alias `c`), same shape as the frontend's `Case` type.
const CASE_JSON: &str = "jsonb_build_object(\
  'id', c.id, 'title', c.title, 'description', c.description, 'type', c.type, \
  'priority', c.priority, 'status', c.status, 'leadInvestigator', c.lead_investigator, \
  'createdAt', iso(c.created_at), 'updatedAt', iso(c.updated_at))";

/// The case as frontend-shaped JSON, or 404.
pub async fn case_json(conn: &mut PgConnection, case_id: &str) -> AppResult<Value> {
    let sql = format!("SELECT {CASE_JSON} FROM cases c WHERE c.id = $1");
    sqlx::query_scalar::<_, Value>(&sql)
        .bind(case_id)
        .fetch_optional(&mut *conn)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("case {case_id} not found")))
}

/// Locks the case row for the rest of the transaction; 404 if it doesn't exist.
pub async fn lock_case(conn: &mut PgConnection, case_id: &str) -> AppResult<()> {
    sqlx::query_scalar::<_, i32>("SELECT 1 FROM cases WHERE id = $1 FOR UPDATE")
        .bind(case_id)
        .fetch_optional(&mut *conn)
        .await?
        .map(|_| ())
        .ok_or_else(|| AppError::NotFound(format!("case {case_id} not found")))
}

/// Atomically allocates the next ID for a prefix, e.g. ("N", 3) -> "N-016".
pub async fn next_id(conn: &mut PgConnection, prefix: &str, width: usize) -> AppResult<String> {
    let n = sqlx::query_scalar::<_, i32>(
        "INSERT INTO id_counters (prefix, last_value) VALUES ($1, 1) \
         ON CONFLICT (prefix) DO UPDATE SET last_value = id_counters.last_value + 1 \
         RETURNING last_value",
    )
    .bind(prefix)
    .fetch_one(&mut *conn)
    .await?;
    Ok(format!("{}-{:0w$}", prefix, n, w = width))
}

/// Appends an activity-log entry and returns it as frontend-shaped JSON.
pub async fn log_activity(
    conn: &mut PgConnection,
    case_id: Option<&str>,
    officer_id: &str,
    action: &str,
    description: &str,
) -> AppResult<Value> {
    let id = next_id(&mut *conn, "A", 3).await?;
    let entry = sqlx::query_scalar::<_, Value>(
        "INSERT INTO activity_log AS a (id, case_id, officer_id, timestamp, action, description) \
         VALUES ($1, $2, $3, now(), $4, $5) \
         RETURNING jsonb_build_object('id', a.id, 'caseId', COALESCE(a.case_id, ''), \
           'officerId', a.officer_id, 'timestamp', iso(a.timestamp), \
           'action', a.action, 'description', a.description)",
    )
    .bind(&id)
    .bind(case_id)
    .bind(officer_id)
    .bind(action)
    .bind(description)
    .fetch_one(&mut *conn)
    .await?;
    Ok(entry)
}