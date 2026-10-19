use axum::{extract::State, http::StatusCode, Json};
use serde_json::{json, Value};

use crate::AppState;

pub async fn health(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    match sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.db)
        .await
    {
        Ok(_) => (StatusCode::OK, Json(json!({ "status": "ok", "db": true }))),
        Err(e) => {
            tracing::error!("health check failed: {e}");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({ "status": "degraded", "db": false })),
            )
        }
    }
}