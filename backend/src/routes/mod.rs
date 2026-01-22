pub mod auth;
pub mod meetings;
pub mod participants;

use crate::state::AppState;
use axum::Router;

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1/auth", auth::auth_routes())
        .nest("/api/v1/meetings", meetings::meeting_routes(state.clone()))
        .nest(
            "/api/v1/participants",
            participants::participant_routes(state.clone()),
        )
        .with_state(state)
}
