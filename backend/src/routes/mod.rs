pub mod api;
pub mod api_keys;
pub mod auth;
pub mod meetings;
pub mod participants;

use crate::{handlers, state::AppState};
use axum::{routing::get, Router};

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(handlers::root::get_app_info))
        .nest("/api/v1/auth", auth::auth_routes())
        .nest("/api/v1/meetings", meetings::meeting_routes(state.clone()))
        .nest(
            "/api/v1/participants",
            participants::participant_routes(state.clone()),
        )
        .nest(
            "/api/v1/api-keys",
            api_keys::api_key_routes(state.clone()),
        )
        .nest("/api/v1/api", api::api_routes(state.clone()))
        .with_state(state)
}
