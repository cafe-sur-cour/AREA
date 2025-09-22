-- ===========================================
-- WEBHOOKS TABLES
-- ===========================================

-- Webhook configurations table (action -> reactions mappings)
CREATE TABLE webhook_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    reactions TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);