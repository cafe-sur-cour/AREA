-- OAuth providers linked to users (multiple providers per user)
CREATE TABLE user_oauth_providers (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "provider" VARCHAR(50) NOT NULL,
    "connection_type" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "provider_email" VARCHAR(255),
    "provider_username" VARCHAR(255),
    "provider_profile_data" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP,
    UNIQUE("user_id", "provider", "connection_type"),
    UNIQUE("provider", "provider_id")
);
