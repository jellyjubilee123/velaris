use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::rngs::OsRng;
use uuid::Uuid;

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
    .verify_password(password.as_bytes(), &parsed)
    .is_ok()
}

pub fn generate_reset_token() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..32)
    .map(|_| {
        let idx = rng.gen_range(0..62);
        match idx {
            0..=9 => (b'0' + idx as u8) as char,
         10..=35 => (b'a' + (idx - 10) as u8) as char,
         _ => (b'A' + (idx - 36) as u8) as char,
        }
    })
    .collect()
}

pub fn hash_token(token: &str) -> Result<String, argon2::password_hash::Error> {
    hash_password(token)
}

pub fn create_token(user_id: Uuid) -> String {
    format!("{}:{}", user_id, generate_reset_token())
}

pub fn user_id_from_token(token: &str) -> Option<Uuid> {
    token.split(':').next()?.parse().ok()
}
