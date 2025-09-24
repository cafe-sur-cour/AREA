-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Webhook configurations table (action -> reactions mappings)
CREATE TABLE webhook_configs (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "action" JSONB NOT NULL,
    "reactions" JSONB[] NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE,
    "description" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);