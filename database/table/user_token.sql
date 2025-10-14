-- Authentication tokens table (OAuth, API keys, etc.)
CREATE TABLE user_tokens (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "token_type" VARCHAR(50) NOT NULL,
    "token_value" TEXT NOT NULL,
    "expires_at" TIMESTAMP,
    "scopes" TEXT[],
    "is_revoked" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP,
    "revoked_reason" TEXT
);
