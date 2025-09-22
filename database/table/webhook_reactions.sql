-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Executed reactions table
CREATE TABLE webhook_reactions (
    "id" SERIAL PRIMARY KEY,
    "webhook_event_id" INTEGER NOT NULL,
    "reaction_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "execution_time_ms" INTEGER,
    "error_message" TEXT,
    "output_data" JSONB,
    "executed_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
