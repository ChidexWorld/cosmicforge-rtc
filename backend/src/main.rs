use axum::Router;
use dotenvy::dotenv;
use sea_orm::Database;
use std::env;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use backend::{routes, state::AppState, swagger};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Get configuration from environment
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "your-secret-key-change-this-in-production".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());

    // Connect to database
    tracing::info!("Connecting to database...");
    let db = Database::connect(&database_url).await?;
    tracing::info!("✅ Database connected successfully");

    // Create application state
    let state = AppState::new(db, jwt_secret);

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build application with routes
    let app = Router::new()
        .merge(routes::create_routes(state))
        .merge(swagger::swagger_router())
        .layer(cors)
        .layer(tower_http::trace::TraceLayer::new_for_http());

    // Start server
    let addr = format!("{}:{}", host, port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    
    tracing::info!("🚀 Server running on http://{}", addr);
    tracing::info!("📚 Swagger UI: http://{}/swagger-ui", addr);
    tracing::info!("📖 API Docs: http://{}/api-docs/openapi.json", addr);
    
    axum::serve(listener, app).await?;

    Ok(())
}
