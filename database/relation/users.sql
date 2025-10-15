-- ===========================================
-- FOREIGN KEY CONSTRAINTS
-- ===========================================

-- User-related foreign keys
ALTER TABLE user_tokens ADD CONSTRAINT fk_user_tokens_user FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE CASCADE;
ALTER TABLE user_activity_logs ADD CONSTRAINT fk_user_activity_logs_user FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE CASCADE;
ALTER TABLE external_webhooks ADD CONSTRAINT fk_external_webhooks_user FOREIGN KEY ("user_id") REFERENCES users("id") ON DELETE CASCADE;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Users indexes
CREATE INDEX "idx_users_email" ON users("email");
CREATE INDEX "idx_users_active" ON users("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_user_tokens_value" ON user_tokens("token_value");
CREATE INDEX "idx_user_tokens_user" ON user_tokens("user_id");
CREATE INDEX "idx_activity_logs_user" ON user_activity_logs("user_id");
CREATE INDEX "idx_activity_logs_action" ON user_activity_logs("action");
