use axum::{
    extract::{Path, State},
    http::{StatusCode, HeaderMap},
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{Utc, Duration};

use crate::models::{
    OptInRequest, Suggestion, MatchRecord, RegisterRequest, LoginRequest, AuthResponse,
    SetAnswerRequest, InterestRequest, ProfileAnswer, FullProfile,
    RequestReset, ConfirmReset, ResetTokenResponse,
    SetPreferences, Preferences, SetPremium,
};
use crate::matching::{compatibility, Profile, generate_kestrel_code};
use crate::auth::{hash_password, verify_password, generate_reset_token, hash_token, create_token, user_id_from_token};

// ---------- Helpers ----------

fn require_user(headers: &HeaderMap) -> Result<Uuid, StatusCode> {
    let auth = headers
    .get("Authorization")
    .and_then(|v| v.to_str().ok())
    .ok_or(StatusCode::UNAUTHORIZED)?;
    let token = auth.strip_prefix("Bearer ").ok_or(StatusCode::UNAUTHORIZED)?;
    user_id_from_token(token).ok_or(StatusCode::UNAUTHORIZED)
}

// ---------- Auth ----------

pub async fn register(
    State(pool): State<PgPool>,
                      Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let password_hash = hash_password(&payload.password)
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let user = sqlx::query_as::<_, (Uuid, String)>(
        r#"
        INSERT INTO users (handle, password_hash)
    VALUES ($1, $2)
    RETURNING id, handle
    "#,
    )
    .bind(&payload.handle)
    .bind(&password_hash)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::CONFLICT)?;

    let token = create_token(user.0);
    Ok(Json(AuthResponse {
        user_id: user.0,
        handle: user.1,
        token: Some(token),
    }))
}

pub async fn login(
    State(pool): State<PgPool>,
                   Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, StatusCode> {
    let row = sqlx::query_as::<_, (Uuid, String, Option<String>)>(
        r#"
        SELECT id, handle, password_hash
        FROM users
        WHERE handle = $1 AND status = 'active'
    "#,
    )
    .bind(&payload.handle)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    let (user_id, handle, hash_opt) = row;
    let hash = hash_opt.ok_or(StatusCode::UNAUTHORIZED)?;

    if !verify_password(&payload.password, &hash) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = create_token(user_id);
    Ok(Json(AuthResponse {
        user_id,
        handle,
        token: Some(token),
    }))
}

// ---------- Password reset ----------

pub async fn request_reset(
    State(pool): State<PgPool>,
                           Json(payload): Json<RequestReset>,
) -> Result<Json<ResetTokenResponse>, StatusCode> {
    let token = generate_reset_token();
    let token_hash = hash_token(&token).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let expires = Utc::now() + Duration::hours(1);

    let updated = sqlx::query(
        r#"
        UPDATE users
        SET reset_token_hash = $1, reset_token_expires_at = $2
        WHERE handle = $3 AND status = 'active'
    "#,
    )
    .bind(&token_hash)
    .bind(expires)
    .bind(&payload.handle)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if updated.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(ResetTokenResponse { token, expires_at: expires }))
}

pub async fn confirm_reset(
    State(pool): State<PgPool>,
                           Json(payload): Json<ConfirmReset>,
) -> Result<StatusCode, StatusCode> {
    let row = sqlx::query_as::<_, (Option<String>, Option<chrono::DateTime<Utc>>)>(
        "SELECT reset_token_hash, reset_token_expires_at FROM users WHERE handle = $1 AND status = 'active'",
    )
    .bind(&payload.handle)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let (hash_opt, expires_opt) = row;
    let stored_hash = hash_opt.ok_or(StatusCode::UNAUTHORIZED)?;
    let expires = expires_opt.ok_or(StatusCode::UNAUTHORIZED)?;

    if Utc::now() > expires || !verify_password(&payload.token, &stored_hash) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let new_hash = hash_password(&payload.new_password)
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    sqlx::query(
        "UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE handle = $2",
    )
    .bind(&new_hash)
    .bind(&payload.handle)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

// ---------- Profile & interests ----------

pub async fn set_answer(
    State(pool): State<PgPool>,
                        headers: HeaderMap,
                        Json(payload): Json<SetAnswerRequest>,
) -> Result<StatusCode, StatusCode> {
    let caller = require_user(&headers)?;
    if caller != payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query(
        r#"
        INSERT INTO profile_answers (user_id, question_key, answer)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, question_key)
    DO UPDATE SET answer = EXCLUDED.answer, answered_at = now()
    "#,
    )
    .bind(payload.user_id)
    .bind(&payload.question_key)
    .bind(&payload.answer)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn add_interest(
    State(pool): State<PgPool>,
                          headers: HeaderMap,
                          Json(payload): Json<InterestRequest>,
) -> Result<StatusCode, StatusCode> {
    let caller = require_user(&headers)?;
    if caller != payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query(
        "INSERT INTO user_interests (user_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(payload.user_id)
    .bind(&payload.tag)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn remove_interest(
    State(pool): State<PgPool>,
                             headers: HeaderMap,
                             Json(payload): Json<InterestRequest>,
) -> Result<StatusCode, StatusCode> {
    let caller = require_user(&headers)?;
    if caller != payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query("DELETE FROM user_interests WHERE user_id = $1 AND tag = $2")
    .bind(payload.user_id)
    .bind(&payload.tag)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn get_profile(
    State(pool): State<PgPool>,
                         Path(user_id): Path<Uuid>,
) -> Result<Json<FullProfile>, StatusCode> {
    let user = sqlx::query_as::<_, (String, f64)>(
        "SELECT handle, honesty_score FROM users WHERE id = $1 AND status = 'active'",
    )
    .bind(user_id)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    let answers = sqlx::query_as::<_, ProfileAnswer>(
        "SELECT question_key, answer, answered_at FROM profile_answers WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let interests = sqlx::query_scalar::<_, String>(
        "SELECT tag FROM user_interests WHERE user_id = $1 ORDER BY tag",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(FullProfile {
        handle: user.0,
        honesty_score: user.1 as f32,
        answers,
        interests,
    }))
}

// ---------- Preferences ----------

pub async fn set_preferences(
    State(pool): State<PgPool>,
                             headers: HeaderMap,
                             Json(payload): Json<SetPreferences>,
) -> Result<StatusCode, StatusCode> {
    let caller = require_user(&headers)?;
    if caller != payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    sqlx::query(
        r#"
        INSERT INTO preferences (user_id, age_min, age_max, gender_pref, values_weight, lifestyle_weight, interests_weight, max_distance_km, region)
    VALUES ($1, $2, $3, $4, COALESCE($5, 0.4), COALESCE($6, 0.3), COALESCE($7, 0.3), $8, $9)
    ON CONFLICT (user_id) DO UPDATE SET
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    gender_pref = EXCLUDED.gender_pref,
    values_weight = EXCLUDED.values_weight,
    lifestyle_weight = EXCLUDED.lifestyle_weight,
    interests_weight = EXCLUDED.interests_weight,
    max_distance_km = EXCLUDED.max_distance_km,
    region = EXCLUDED.region,
    updated_at = now()
    "#,
    )
    .bind(payload.user_id)
    .bind(payload.age_min)
    .bind(payload.age_max)
    .bind(&payload.gender_pref)
    .bind(payload.values_weight)
    .bind(payload.lifestyle_weight)
    .bind(payload.interests_weight)
    .bind(payload.max_distance_km)
    .bind(&payload.region)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn get_preferences(
    State(pool): State<PgPool>,
                             Path(user_id): Path<Uuid>,
) -> Result<Json<Preferences>, StatusCode> {
    let prefs = sqlx::query_as::<_, Preferences>(
        "SELECT age_min, age_max, gender_pref, values_weight, lifestyle_weight, interests_weight, max_distance_km, region FROM preferences WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(prefs))
}

// ---------- Matching ----------

pub async fn suggest(
    State(pool): State<PgPool>,
                     Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<Suggestion>>, StatusCode> {
    println!("=== suggest called for {} ===", user_id);

    let me = match load_profile(&pool, user_id).await {
        Ok(p) => {
            println!("Loaded my profile: handle={}", p.handle);
            p
        }
        Err(e) => {
            println!("ERROR loading my profile: {:?}", e);
            return Err(e);
        }
    };

    let my_prefs = match load_preferences(&pool, user_id).await {
        Ok(p) => {
            println!("Loaded preferences");
            p
        }
        Err(e) => {
            println!("ERROR loading preferences: {:?}", e);
            return Err(e);
        }
    };

    println!("Querying candidates...");
    let candidates = match sqlx::query_scalar::<_, Uuid>(
        r#"
        SELECT id FROM users
        WHERE id != $1 AND status = 'active'
    LIMIT 50
    "#,
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    {
        Ok(c) => {
            println!("Found {} candidates", c.len());
            c
        }
        Err(e) => {
            println!("ERROR querying candidates: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let mut scored = Vec::new();
    for other_id in candidates {
        match load_profile(&pool, other_id).await {
            Ok(other) => {
                let score = compatibility(
                    &me,
                    &other,
                    my_prefs.values_weight,
                    my_prefs.lifestyle_weight,
                    my_prefs.interests_weight,
                );
                println!("Score vs {}: {}", other.handle, score);
                if score > 0.0 {
                    scored.push((other_id, score, other.handle.clone()));
                }
            }
            Err(e) => {
                println!("ERROR loading profile for {}: {:?}", other_id, e);
            }
        }
    }

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    scored.truncate(5);

    let mut suggestions = Vec::new();
    for (other_id, score, other_handle) in scored {
        let (user_a, user_b) = if user_id < other_id {
            (user_id, other_id)
        } else {
            (other_id, user_id)
        };

        println!("Attempting insert {} <-> {} (score {})", user_a, user_b, score);

        let result = sqlx::query_scalar::<_, Uuid>(
            r#"
            INSERT INTO matches (user_a, user_b, score, status)
        VALUES ($1, $2, $3, 'suggested')
        ON CONFLICT (user_a, user_b) DO NOTHING
        RETURNING id
        "#,
        )
        .bind(user_a)
        .bind(user_b)
        .bind(score)
        .fetch_optional(&pool)
        .await;

        match result {
            Ok(Some(id)) => {
                println!("SUCCESS inserted match {}", id);
                suggestions.push(Suggestion {
                    match_id: id,
                    other_handle,
                    score,
                });
            }
            Ok(None) => println!("Conflict — match already exists"),
            Err(e) => println!("INSERT ERROR: {:?}", e),
        }
    }

    println!("Returning {} suggestions", suggestions.len());
    Ok(Json(suggestions))
}

pub async fn opt_in(
    State(pool): State<PgPool>,
                    headers: HeaderMap,
                    Json(payload): Json<OptInRequest>,
) -> Result<Json<MatchRecord>, StatusCode> {
    let caller = require_user(&headers)?;
    if caller != payload.user_id {
        return Err(StatusCode::FORBIDDEN);
    }

    let code = generate_kestrel_code();
    let expires = Utc::now() + Duration::hours(24);

    let record = sqlx::query_as::<_, MatchRecord>(
        r#"
        UPDATE matches
        SET status = 'mutual', mutual_at = now(), kestrel_code = $1, code_expires_at = $2
        WHERE id = $3 AND (user_a = $4 OR user_b = $4) AND status = 'suggested'
    RETURNING *
    "#,
    )
    .bind(&code)
    .bind(expires)
    .bind(payload.match_id)
    .bind(payload.user_id)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(record))
}

pub async fn list_matches(
    State(pool): State<PgPool>,
                          Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<MatchRecord>>, StatusCode> {
    let matches = sqlx::query_as::<_, MatchRecord>(
        "SELECT * FROM matches WHERE user_a = $1 OR user_b = $1 ORDER BY suggested_at DESC",
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(matches))
}

// ---------- Chat ----------

pub async fn send_message(
    State(pool): State<PgPool>,
                          headers: HeaderMap,
                          Path(code): Path<String>,
                          Json(payload): Json<serde_json::Value>,
) -> Result<StatusCode, StatusCode> {
    let user_id = require_user(&headers)?;
    let body = payload["body"].as_str().ok_or(StatusCode::BAD_REQUEST)?;

    sqlx::query(
        "INSERT INTO messages (code, sender_id, body, expires_at) VALUES ($1, $2, $3, now() + interval '24 hours')",
    )
    .bind(&code)
    .bind(user_id)
    .bind(body)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::OK)
}

pub async fn get_messages(
    State(pool): State<PgPool>,
                          Path(code): Path<String>,
) -> Result<Json<Vec<serde_json::Value>>, StatusCode> {
    let rows = sqlx::query_as::<_, (String, String, chrono::DateTime<Utc>)>(
        "SELECT body, sender_id::text, created_at FROM messages WHERE code = $1 AND expires_at > now() ORDER BY created_at",
    )
    .bind(&code)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let messages: Vec<_> = rows
    .into_iter()
    .map(|(body, sender, created)| {
        serde_json::json!({ "body": body, "sender": sender, "created_at": created })
    })
    .collect();

    Ok(Json(messages))
}

// ---------- Premium ----------

pub async fn set_premium(
    State(pool): State<PgPool>,
                         Json(payload): Json<SetPremium>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("UPDATE users SET premium = $1 WHERE id = $2")
    .bind(payload.premium)
    .bind(payload.user_id)
    .execute(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::OK)
}

// ---------- Seed ----------

pub async fn seed(State(pool): State<PgPool>) -> Result<Json<serde_json::Value>, StatusCode> {
    let handles = ["alice", "bob", "charlie"];
    let mut ids = Vec::new();

    for handle in handles {
        let hash = hash_password("password123").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        let id = sqlx::query_scalar::<_, Uuid>(
            "INSERT INTO users (handle, password_hash) VALUES ($1, $2) ON CONFLICT (handle) DO UPDATE SET handle = EXCLUDED.handle RETURNING id",
        )
        .bind(handle)
        .bind(&hash)
        .fetch_one(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        ids.push(id);

        let _ = sqlx::query(
            "INSERT INTO profile_answers (user_id, question_key, answer) VALUES ($1, 'values', $2) ON CONFLICT DO NOTHING",
        )
        .bind(id)
        .bind(serde_json::json!(["honesty", "adventure"]))
        .execute(&pool)
        .await;
    }

    Ok(Json(serde_json::json!({ "seeded_users": ids })))
}

// ---------- Internal loaders ----------

#[derive(Debug)]
struct Prefs {
    values_weight: f32,
    lifestyle_weight: f32,
    interests_weight: f32,
}

async fn load_preferences(pool: &PgPool, user_id: Uuid) -> Result<Prefs, StatusCode> {
    println!("load_preferences for {}", user_id);
    let row = sqlx::query_as::<_, (f32, f32, f32)>(
        "SELECT values_weight, lifestyle_weight, interests_weight FROM preferences WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        println!("load_preferences DB error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(match row {
        Some((v, l, i)) => Prefs {
            values_weight: v,
            lifestyle_weight: l,
            interests_weight: i,
        },
       None => Prefs {
           values_weight: 0.4,
           lifestyle_weight: 0.3,
           interests_weight: 0.3,
       },
    })
}

async fn load_profile(pool: &PgPool, user_id: Uuid) -> Result<Profile, StatusCode> {
    println!("load_profile for {}", user_id);
    let (handle, honesty) = sqlx::query_as::<_, (String, f64)>(
        "SELECT handle, honesty_score FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        println!("load_profile user query error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let answers = sqlx::query_as::<_, (String, serde_json::Value)>(
        "SELECT question_key, answer FROM profile_answers WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        println!("load_profile answers error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let interests = sqlx::query_scalar::<_, String>(
        "SELECT tag FROM user_interests WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        println!("load_profile interests error: {:?}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let mut values = Vec::new();
    let mut lifestyle = Vec::new();
    let mut sex: Option<String> = None;
    let mut sex_pref: Vec<String> = Vec::new();
    let mut personality = serde_json::Value::Null;
    let mut cognitive_score: Option<i32> = None;
    let mut cognitive_band: Option<String> = None;

    for (key, val) in answers {
        match key.as_str() {
            "values" => {
                if let Some(arr) = val.as_array() {
                    values = arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect();
                }
            }
            "lifestyle" => {
                if let Some(arr) = val.as_array() {
                    lifestyle = arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect();
                }
            }
            "sex" => {
                if let Some(s) = val.as_str() {
                    sex = Some(s.to_string());
                }
            }
            "sex_pref" => {
                if let Some(arr) = val.as_array() {
                    sex_pref = arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect();
                }
            }
            "personality" => {
                personality = val;
            }
            "cognitive_score" => {
                if let Some(n) = val.as_i64() {
                    cognitive_score = Some(n as i32);
                }
            }
            "cognitive_band" => {
                if let Some(s) = val.as_str() {
                    cognitive_band = Some(s.to_string());
                }
            }
            _ => {}
        }
    }

    println!("load_profile success for {} ({} interests)", handle, interests.len());
    Ok(Profile {
        handle,
       values,
       lifestyle,
       interests,
       honesty_score: honesty as f32,
       sex,
       sex_pref,
       personality,
       cognitive_score,
       cognitive_band,
    })
}
