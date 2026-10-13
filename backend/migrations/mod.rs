use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct Profile {
    pub values: Vec<String>,
    pub lifestyle: Vec<String>,
    pub interests: Vec<String>,
    pub honesty_score: f32,
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

pub fn compatibility(
    a: &Profile,
    b: &Profile,
    values_w: f32,
    lifestyle_w: f32,
    interests_w: f32,
) -> f32 {
    let values_sim = jaccard(&a.values, &b.values);
    let lifestyle_sim = jaccard(&a.lifestyle, &b.lifestyle);
    let interests_sim = jaccard(&a.interests, &b.interests);

    let raw = values_w * values_sim
        + lifestyle_w * lifestyle_sim
        + interests_w * interests_sim;

    let honesty_factor = 0.7 + 0.3 * ((a.honesty_score + b.honesty_score) / 2.0);
    (raw * honesty_factor).clamp(0.0, 1.0)
}

pub fn generate_kestrel_code() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    (0..8)
        .map(|_| {
            let idx = rng.gen_range(0..36);
            if idx < 10 {
                (b'0' + idx) as char
            } else {
                (b'a' + idx - 10) as char
            }
        })
        .collect()
}
