-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Webhooks indexes
CREATE INDEX "idx_webhook_events_action" ON webhook_events("action_type");
CREATE INDEX "idx_webhook_events_status" ON webhook_events("status");
CREATE INDEX "idx_webhook_events_created" ON webhook_events("created_at");
CREATE INDEX "idx_webhook_reactions_webhook" ON webhook_reactions("webhook_event_id");
CREATE INDEX "idx_webhook_reactions_status" ON webhook_reactions("status");
CREATE INDEX "idx_webhook_configs_active" ON webhook_configs("is_active");
CREATE INDEX "idx_webhook_stats_date" ON webhook_stats("date");
CREATE INDEX "idx_webhook_failures_resolved" ON webhook_failures("resolved");
CREATE INDEX "idx_external_webhooks_user" ON external_webhooks("user_id");
CREATE INDEX "idx_external_webhooks_active" ON external_webhooks("is_active");
