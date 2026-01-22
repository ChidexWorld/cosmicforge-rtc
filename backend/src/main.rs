use axum::Router;
use backend::config::logging;
use dotenvy::dotenv;
use sea_orm::{ConnectOptions, Database};
use tower_http::cors::{Any, CorsLayer};

use backend::{
    config::{AppConfig, EmailConfig, LiveKitConfig},
    routes,
    state::AppState,
    swagger,
    workers::{spawn_email_worker, spawn_meeting_auto_end_worker},
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenv().ok();

    // Initialize logging (terminal + file)
    let _guard = logging::init_logging();

    // Load app configuration
    let app_config = AppConfig::from_env().expect("Failed to load app configuration");

    // Connect to database with connection pool settings
    tracing::info!("Connecting to database...");
    let mut db_opts = ConnectOptions::new(&app_config.database_url);
    db_opts
        .max_connections(10)
        .min_connections(2)
        .connect_timeout(std::time::Duration::from_secs(30))
        .acquire_timeout(std::time::Duration::from_secs(30))
        .idle_timeout(std::time::Duration::from_secs(300))
        .max_lifetime(std::time::Duration::from_secs(1800))
        .sqlx_logging(false);
    let db = Database::connect(db_opts).await?;
    tracing::info!("✅ Database connected successfully");

    // Load email configuration
    let email_config = match EmailConfig::from_env() {
        Ok(config) => {
            tracing::info!("✅ Email configuration loaded");
            config
        }
        Err(e) => {
            tracing::warn!(
                "⚠️ Email not configured: {}. Using defaults (emails will queue but not send).",
                e
            );
            EmailConfig::default()
        }
    };

    // Load LiveKit configuration
    let livekit_config = LiveKitConfig::from_env()
        .expect("Failed to load LiveKit configuration. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.");
    tracing::info!("✅ LiveKit configuration loaded ({})", livekit_config.url);

    // Create application state
    let state = AppState::new(
        db.clone(),
        app_config.jwt_secret.clone(),
        &email_config,
        &livekit_config,
    );

    // Start email worker (only if SMTP is configured)
    let _email_worker = if !email_config.smtp_host.is_empty() {
        match spawn_email_worker(db.clone(), &email_config) {
            Some(handle) => {
                tracing::info!("✅ Email worker started");
                Some(handle)
            }
            None => {
                tracing::warn!("⚠️ Failed to start email worker");
                None
            }
        }
    } else {
        tracing::info!("ℹ️ Email worker not started (SMTP not configured)");
        None
    };

    // Start meeting auto-end worker (always runs)
    let _meeting_auto_end_worker = spawn_meeting_auto_end_worker(db.clone());
    tracing::info!("✅ Meeting auto-end worker started");

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
    let addr = app_config.server_addr();
    let listener = tokio::net::TcpListener::bind(&addr).await?;

    tracing::info!("🚀 Server running on http://{}", addr);
    tracing::info!("📚 Swagger UI: http://{}/swagger-ui", addr);
    tracing::info!("📖 API Docs: http://{}/api-docs/openapi.json", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
