-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- External webhooks table (GitHub, etc.)
CREATE TABLE external_webhooks (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "service" VARCHAR(100) NOT NULL,
    "external_id" VARCHAR(255),
    "repository" VARCHAR(255),
    "url" VARCHAR(500) NOT NULL,
    "secret" VARCHAR(255),
    "events" TEXT[],
    "is_active" BOOLEAN DEFAULT TRUE,
    "last_triggered_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);