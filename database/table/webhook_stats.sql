-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Webhook statistics table (for metrics)
CREATE TABLE webhook_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    reaction_name VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    total_processing_time_ms INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    UNIQUE(date, action_type, reaction_name)
);
