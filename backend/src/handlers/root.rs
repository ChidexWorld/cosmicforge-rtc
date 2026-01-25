use axum::{http::StatusCode, response::IntoResponse, Json};
use serde_json::json;

use chrono::Utc;

/// Root endpoint - Application information
///
/// Returns a brief description of the CosmicForge RTC application,
/// including its purpose, key features, and available endpoints.
#[utoipa::path(
    get,
    path = "/",
    tag = "General",
    responses(
        (status = 200, description = "Application information", body = serde_json::Value)
    )
)]
pub async fn get_app_info() -> impl IntoResponse {
    let info = json!({
        "name": "CosmicForge RTC",
        "version": env!("CARGO_PKG_VERSION"),
        "description": "Enterprise-grade, self-hosted real-time video communication platform powering CosmicForge products and external integrations.",
        "features": [
            "Real-time video/audio conferencing via LiveKit WebRTC SFU",
            "Meeting lifecycle management (create, schedule, join, end)",
            "Participant management with roles and permissions",
            "Waiting room for private meetings",
            "Media control (audio, video, screen sharing)",
            "In-meeting chat with persistence",
            "Email notifications and verification",
            "Session logging and audit trail",
            "API key management with usage tracking",
            "Webhook support for event notifications",
            "Dual authentication (local + Google OAuth)",
            "Guest support for anonymous users"
        ],
        "architecture": {
            "backend": "Rust (Axum framework)",
            "database": "PostgreSQL with SeaORM",
            "real_time": "LiveKit (WebRTC SFU)",
            "authentication": "JWT + OAuth2"
        },
        "endpoints": {
            "api_docs": "/api-docs/openapi.json",
            "swagger_ui": "/swagger-ui",
            "auth": "/api/v1/auth",
            "meetings": "/api/v1/meetings",
            "participants": "/api/v1/participants"
        },
        "documentation": {
            "quick_start": "See backend/docs/QUICK_START.md",
            "database_schema": "See backend/docs/DATABASE_SCHEMA.md",
            "meetings": "See backend/docs/MEETINGS.md",
            "participants": "See backend/docs/PARTICIPANTS.md",
            "livekit": "See backend/docs/LIVEKIT.md",
            "chat": "See backend/docs/CHAT.md"
        },
        "status": "operational",
        "timestamp": Utc::now().to_rfc3339()
    });

    (StatusCode::OK, Json(info))
}
