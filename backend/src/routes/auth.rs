use axum::{
    routing::post,
    Router,
};
use crate::{handlers::auth, state::AppState};

pub fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(auth::register))
        .route("/verify-email", post(auth::verify_email))
        .route("/login", post(auth::login))
        .route("/refresh", post(auth::refresh_token))
        .route("/logout", post(auth::logout))
}
