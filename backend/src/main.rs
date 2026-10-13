use axum::{routing::{get, post}, Router};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod matching;
mod routes;
mod models;
mod auth;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL")
    .unwrap_or_else(|_| "postgres://velaris:velaris@127.0.0.1:5432/velaris".to_string());

    let pool = PgPoolOptions::new()
    .max_connections(5)
    .acquire_timeout(std::time::Duration::from_secs(10))
    .connect(&database_url)
    .await?;

    let app = Router::new()
    .route("/health", get(|| async { "ok" }))
    // Auth
    .route("/register", post(routes::register))
    .route("/login", post(routes::login))
    // Password reset
    .route("/reset/request", post(routes::request_reset))
    .route("/reset/confirm", post(routes::confirm_reset))
    // Profile & interests
    .route("/profile/answer", post(routes::set_answer))
    .route("/profile/:user_id", get(routes::get_profile))
    .route("/interests", post(routes::add_interest))
    .route("/interests/remove", post(routes::remove_interest))
    // Preferences
    .route("/preferences", post(routes::set_preferences))
    .route("/preferences/:user_id", get(routes::get_preferences))
    // Matching
    .route("/suggest/:user_id", get(routes::suggest))
    .route("/opt-in", post(routes::opt_in))
    .route("/matches/:user_id", get(routes::list_matches))
    // Premium & seed
    .route("/premium", post(routes::set_premium))
    .route("/seed", post(routes::seed))
    .layer(CorsLayer::permissive())
    .with_state(pool);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Velaris listening on {}", addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;

    Ok(())
}
