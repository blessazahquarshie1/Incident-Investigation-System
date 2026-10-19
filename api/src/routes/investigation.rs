use axum::{extract::State, Json};
use serde_json::Value;

use crate::{error::AppResult, AppState};

const SNAPSHOT_SQL: &str = include_str!("../sql/snapshot.sql");

/// GET /api/investigation - the whole dataset, same shape as the frontend's InvestigationData.
pub async fn snapshot(State(state): State<AppState>) -> AppResult<Json<Value>> {
    let data = sqlx::query_scalar::<_, Value>(SNAPSHOT_SQL)
        .fetch_one(&state.db)
        .await?;
    Ok(Json(data))
}