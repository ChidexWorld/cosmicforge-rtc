use axum::{
    middleware,
    routing::{get, post, put, delete},
    Router,
};
use crate::{handlers::meetings, middleware::auth_middleware, state::AppState};

pub fn meeting_routes() -> Router<AppState> {
    Router::new()
        // Protected routes (require authentication)
        .route("/", get(meetings::list_meetings).post(meetings::create_meeting))
        .route("/:id", get(meetings::get_meeting).put(meetings::update_meeting).delete(meetings::delete_meeting))
        .route("/:id/start", post(meetings::start_meeting))
        .route("/:id/end", post(meetings::end_meeting))
        .layer(middleware::from_fn(auth_middleware))
        // Public route (no auth required)
        .route("/:id/join", post(meetings::join_meeting))
}
