-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Users indexes
CREATE INDEX "idx_users_email" ON users("email");
CREATE INDEX "idx_users_active" ON users("is_active") WHERE "is_active" = true;
CREATE INDEX "idx_user_sessions_token" ON user_sessions("session_token");
CREATE INDEX "idx_user_sessions_user" ON user_sessions("user_id");
CREATE INDEX "idx_user_sessions_expires" ON user_sessions("expires_at");
CREATE INDEX "idx_user_tokens_value" ON user_tokens("token_value");
CREATE INDEX "idx_user_tokens_user" ON user_tokens("user_id");
CREATE INDEX "idx_activity_logs_user" ON user_activity_logs("user_id");
CREATE INDEX "idx_activity_logs_action" ON user_activity_logs("action");
