use axum::{extract::FromRequestParts, http::request::Parts};

use crate::error::AppError;

/// The officer performing the request, taken from the `X-Officer-Id` header.
/// (No real auth yet; the frontend sends its currentOfficerId.)
pub struct ActingOfficer(pub String);

impl<S: Send + Sync> FromRequestParts<S> for ActingOfficer {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .headers
            .get("x-officer-id")
            .and_then(|v| v.to_str().ok())
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(|s| ActingOfficer(s.to_string()))
            .ok_or_else(|| AppError::BadRequest("missing X-Officer-Id header".into()))
    }
}