-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Webhook events table (incoming webhooks)
CREATE TABLE webhook_events (
    "id" SERIAL PRIMARY KEY,
    "action_type" VARCHAR(100) NOT NULL,
    "source" VARCHAR(100),
    "external_id" VARCHAR(255),
    "payload" JSONB NOT NULL,
    "processed_payload" JSONB,
    "status" VARCHAR(50) DEFAULT 'received',
    "processing_time_ms" INTEGER,
    "user_agent" TEXT,
    "signature_verified" BOOLEAN DEFAULT FALSE,
    "error_message" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP
);
