CREATE TABLE IF NOT EXISTS user_service_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    service VARCHAR(50) NOT NULL,
    subscribed BOOLEAN DEFAULT false,
    subscribed_at TIMESTAMP NULL,
    unsubscribed_at TIMESTAMP NULL,
    state_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, service),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_service_subscriptions_user_service
ON user_service_subscriptions(user_id, service);

CREATE OR REPLACE FUNCTION update_user_service_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_service_subscriptions_updated_at
    BEFORE UPDATE ON user_service_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_service_subscriptions_updated_at();