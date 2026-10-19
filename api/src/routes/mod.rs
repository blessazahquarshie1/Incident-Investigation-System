use axum::{routing::get, Router};

use crate::AppState;

mod health;
mod investigation;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::health))
        .route("/investigation", get(investigation::snapshot))
}