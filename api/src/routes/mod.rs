use axum::{routing::get, Router};

use crate::AppState;

mod health;

pub fn router() -> Router<AppState> {
    Router::new().route("/health", get(health::health))
}