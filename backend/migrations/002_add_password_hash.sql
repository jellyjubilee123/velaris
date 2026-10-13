-- Add password hash support to users
ALTER TABLE users
    ADD COLUMN password_hash TEXT;

-- Optional: password reset token support (store hashed)
ALTER TABLE users
    ADD COLUMN reset_token_hash TEXT,
    ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

-- Optional index if you will look users up by handle frequently during login
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
