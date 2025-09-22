-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Failed webhook attempts table (for debug)
CREATE TABLE webhook_failures (
    "id" SERIAL PRIMARY KEY,
    "action_type" VARCHAR(100),
    "payload" JSONB,
    "error_message" TEXT NOT NULL,
    "error_code" VARCHAR(100),
    "user_agent" TEXT,
    "retry_count" INTEGER DEFAULT 0,
    "last_retry_at" TIMESTAMP,
    "resolved" BOOLEAN DEFAULT FALSE,
    "resolved_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
