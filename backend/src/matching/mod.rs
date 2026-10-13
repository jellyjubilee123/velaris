use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct Profile {
    pub handle: String,
    pub values: Vec<String>,
    pub lifestyle: Vec<String>,
    pub interests: Vec<String>,
    pub honesty_score: f32,
    pub sex: Option<String>,
    pub sex_pref: Vec<String>,
    pub personality: serde_json::Value,
    pub cognitive_score: Option<i32>,
    pub cognitive_band: Option<String>,
}

pub fn jaccard(a: &[String], b: &[String]) -> f32 {
    if a.is_empty() && b.is_empty() {
        return 1.0;
    }
    let set_a: HashSet<_> = a.iter().collect();
    let set_b: HashSet<_> = b.iter().collect();
    let intersection = set_a.intersection(&set_b).count() as f32;
    let union = set_a.union(&set_b).count() as f32;
    if union == 0.0 { 0.0 } else { intersection / union }
}

/// Compatibility with ≥80% personality / cognitive similarity treated as full match.
/// Sex preference is a hard filter.
pub fn compatibility(
    me: &Profile,
    other: &Profile,
    values_w: f32,
    lifestyle_w: f32,
    interests_w: f32,
) -> f32 {
    // Hard sex filter
    if !sex_compatible(me, other) {
        return 0.0;
    }

    let values_sim = jaccard(&me.values, &other.values);
    let lifestyle_sim = jaccard(&me.lifestyle, &other.lifestyle);
    let interests_sim = jaccard(&me.interests, &other.interests);

    let personality_sim = personality_similarity(&me.personality, &other.personality);
    let personality_score = if personality_sim >= 0.80 { 1.0 } else { personality_sim };

    let cognitive_score = cognitive_similarity(me, other);

    let raw =
    values_w * values_sim
    + lifestyle_w * lifestyle_sim
    + interests_w * interests_sim
    + 0.30 * personality_score
    + 0.25 * cognitive_score;

    let honesty_factor = 0.7 + 0.3 * ((me.honesty_score + other.honesty_score) / 2.0);
    (raw * honesty_factor).clamp(0.0, 1.0)
}

fn personality_similarity(a: &serde_json::Value, b: &serde_json::Value) -> f32 {
    let Some(ao) = a.as_object() else { return 0.5 };
    let Some(bo) = b.as_object() else { return 0.5 };

    let mut sum = 0.0f32;
    let mut count = 0;

    for (k, va) in ao {
        if let (Some(na), Some(nb)) = (va.as_f64(), bo.get(k).and_then(|v| v.as_f64())) {
            let diff = ((na - nb).abs() / 4.0) as f32; // 1–5 scale
            sum += 1.0 - diff;
            count += 1;
        }
    }

    if count == 0 {
        0.5
    } else {
        sum / count as f32
    }
}

fn cognitive_similarity(me: &Profile, other: &Profile) -> f32 {
    if let (Some(ms), Some(os)) = (me.cognitive_score, other.cognitive_score) {
        let diff = (ms as f32 - os as f32).abs();
        let sim = 1.0 - (diff / 100.0);
        return if sim >= 0.80 { 1.0 } else { sim };
    }

    match (&me.cognitive_band, &other.cognitive_band) {
        (Some(a), Some(b)) if a == b => 1.0,
        (Some(_), Some(_)) => 0.4,
        _ => 0.6,
    }
}

fn sex_compatible(a: &Profile, b: &Profile) -> bool {
    let a_ok = a.sex_pref.is_empty()
    || b.sex.as_ref().map(|s| a.sex_pref.contains(s)).unwrap_or(true);
    let b_ok = b.sex_pref.is_empty()
    || a.sex.as_ref().map(|s| b.sex_pref.contains(s)).unwrap_or(true);
    a_ok && b_ok
}

pub fn generate_kestrel_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..8)
    .map(|_| {
        let idx = rng.gen_range(0..36);
        if idx < 10 {
            (b'0' + idx as u8) as char
        } else {
            (b'a' + (idx - 10) as u8) as char
        }
    })
    .collect()
}
