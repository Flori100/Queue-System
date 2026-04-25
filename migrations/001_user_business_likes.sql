-- Pivot: liked businesses per user (user_id, business_id).
-- Add foreign keys to your real `users` and `businesses` tables when wiring the backend.

CREATE TABLE IF NOT EXISTS user_business_likes (
    user_id BIGINT NOT NULL,
    business_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    PRIMARY KEY (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_business_likes_user_id ON user_business_likes (user_id);

CREATE INDEX IF NOT EXISTS idx_user_business_likes_business_id ON user_business_likes (business_id);
