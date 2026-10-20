use axum::{
    routing::{get, patch, post},
    Router,
};

use crate::AppState;

mod health;
mod cases;
mod investigation;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health::health))
        .route("/investigation", get(investigation::snapshot))
        .route("/cases/{case_id}/priority", patch(cases::change_priority))
        .route("/cases/{case_id}/status", patch(cases::change_status))
        .route("/cases/{case_id}/lead-investigator", patch(cases::change_lead))
        .route("/cases/{case_id}/notes", post(cases::add_note))
        .route("/cases", post(cases::create_case))
        .route("/cases/{case_id}/documents", post(cases::add_document))
}