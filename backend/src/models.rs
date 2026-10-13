use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub handle: String,
    pub honesty_score: f64,  // changed to f64
    pub premium: bool,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OptInRequest {
    pub user_id: Uuid,
    pub match_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct Suggestion {
    pub match_id: Uuid,
    pub other_handle: String,
    pub score: f32,
}

#[derive(Debug, Serialize, FromRow)]
pub struct MatchRecord {
    pub id: Uuid,
    pub user_a: Uuid,
    pub user_b: Uuid,
    pub score: f64,  // changed to f64 to match FLOAT8
    pub status: String,
    pub kestrel_code: Option<String>,
    pub code_expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub handle: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub handle: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user_id: Uuid,
    pub handle: String,
    pub token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetAnswerRequest {
    pub user_id: Uuid,
    pub question_key: String,
    pub answer: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct InterestRequest {
    pub user_id: Uuid,
    pub tag: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ProfileAnswer {
    pub question_key: String,
    pub answer: serde_json::Value,
    pub answered_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FullProfile {
    pub handle: String,
    pub honesty_score: f32,
    pub answers: Vec<ProfileAnswer>,
    pub interests: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct RequestReset {
    pub handle: String,
}

#[derive(Debug, Deserialize)]
pub struct ConfirmReset {
    pub handle: String,
    pub token: String,
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct ResetTokenResponse {
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SetPreferences {
    pub user_id: Uuid,
    pub age_min: Option<i32>,
    pub age_max: Option<i32>,
    pub gender_pref: Option<Vec<String>>,
    pub values_weight: Option<f32>,
    pub lifestyle_weight: Option<f32>,
    pub interests_weight: Option<f32>,
    pub max_distance_km: Option<i32>,
    pub region: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Preferences {
    pub age_min: Option<i32>,
    pub age_max: Option<i32>,
    pub gender_pref: Option<Vec<String>>,
    pub values_weight: f32,
    pub lifestyle_weight: f32,
    pub interests_weight: f32,
    pub max_distance_km: Option<i32>,
    pub region: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetPremium {
    pub user_id: Uuid,
    pub premium: bool,
}
