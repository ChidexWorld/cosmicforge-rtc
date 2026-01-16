pub mod auth;

use axum::Router;
use crate::state::AppState;

pub fn create_routes(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1/auth", auth::auth_routes())
        .with_state(state)
}
