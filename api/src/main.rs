use std::net::SocketAddr;
use std::time::Duration;

use axum::{
    http::{header, HeaderName, HeaderValue, Method},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::EnvFilter;

mod db;
mod error;
mod extract;
mod routes;
mod seed;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
}

/// CORS is off unless CORS_ORIGINS="https://a.example,https://b.example" is set.
/// In dev the Vite proxy makes requests same-origin, so nothing is needed.
fn cors_layer() -> CorsLayer {
    let origins: Vec<HeaderValue> = std::env::var("CORS_ORIGINS")
        .unwrap_or_default()
        .split(',')
        .filter_map(|o| o.trim().parse().ok())
        .collect();
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, HeaderName::from_static("x-officer-id")])
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,tower_http=debug")),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL")?;
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let db = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(15))
        .connect(&database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&db).await?;
    tracing::info!("migrations applied");

    // `cargo run -- seed [path]` loads the mock-data JSON into the database, then exits.
    let args: Vec<String> = std::env::args().collect();
    if args.get(1).map(String::as_str) == Some("seed") {
        let path = args.get(2).map(String::as_str).unwrap_or("seed/mock_data.json");
        seed::run(&db, path).await?;
        return Ok(());
    }

    let app = Router::new()
        .nest("/api", routes::router())
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http())
        .with_state(AppState { db });

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("listening on {addr}");
    axum::serve(listener, app).await?;
    Ok(())
}