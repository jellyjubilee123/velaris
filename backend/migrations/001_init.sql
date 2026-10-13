-- Velaris initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle                  TEXT UNIQUE NOT NULL,
    password_hash           TEXT,
    created_at              TIMESTAMPTZ DEFAULT now(),
    last_active             TIMESTAMPTZ,
    honesty_score           FLOAT DEFAULT 0.5 CHECK (honesty_score BETWEEN 0 AND 1),
    premium                 BOOLEAN DEFAULT false,
    status                  TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
    reset_token_hash        TEXT,
    reset_token_expires_at  TIMESTAMPTZ
);

CREATE TABLE profile_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_key    TEXT NOT NULL,
    answer          JSONB NOT NULL,
    answered_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, question_key)
);

CREATE TABLE preferences (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age_min         INT,
    age_max         INT,
    gender_pref     TEXT[],
    values_weight   FLOAT DEFAULT 0.4,
    lifestyle_weight FLOAT DEFAULT 0.3,
    interests_weight FLOAT DEFAULT 0.3,
    max_distance_km INT,
    region          TEXT,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_interests (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    tag             TEXT NOT NULL,
    PRIMARY KEY (user_id, tag)
);

CREATE TABLE matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a          UUID NOT NULL REFERENCES users(id),
    user_b          UUID NOT NULL REFERENCES users(id),
    score           FLOAT NOT NULL,
    status          TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'mutual', 'declined', 'expired', 'chatting')),
    suggested_at    TIMESTAMPTZ DEFAULT now(),
    mutual_at       TIMESTAMPTZ,
    kestrel_code    TEXT,
    code_expires_at TIMESTAMPTZ,
    CHECK (user_a < user_b)
);

CREATE UNIQUE INDEX idx_matches_pair ON matches (user_a, user_b);
CREATE INDEX idx_matches_user_a ON matches(user_a);
CREATE INDEX idx_matches_user_b ON matches(user_b);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_profile_answers_user ON profile_answers(user_id);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_users_handle ON users(handle);
