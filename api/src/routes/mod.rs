use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::AppState;

mod health;
mod cases;
mod items;
mod evidence;
mod manage;
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
        .route("/locations", post(items::create_location))
        .route("/cases/{case_id}/evidence", post(evidence::add_evidence))
        .route("/evidence/{evidence_id}/custody", post(evidence::apply_custody_action))
        .route("/persons/{person_id}", patch(manage::update_person))
        .route("/cases/{case_id}/persons/{person_id}", delete(manage::remove_person))
        .route("/cases/{case_id}/vehicles/{vehicle_id}", delete(manage::remove_vehicle))
        .route("/cases/{case_id}/locations/{location_id}", delete(manage::remove_location))
        .route("/cases/{case_id}/persons", post(items::create_person_for_case))
        .route("/cases/{case_id}/persons/link", post(items::add_person_to_case))
        .route("/cases/{case_id}/incidents", post(items::add_incident))
        .route("/cases/{case_id}/visited-locations", post(items::add_visited_location))
        .route("/cases/{case_id}/vehicles", post(items::create_vehicle))
        .route("/cases/{case_id}/connections", post(items::add_connection))
        .route("/cases/{case_id}/witness-statements", post(items::add_witness_statement))
        .route("/cases/{case_id}/sightings", post(items::add_sighting))
        .route("/cases/{case_id}/phone-records", post(items::add_phone_record))
}