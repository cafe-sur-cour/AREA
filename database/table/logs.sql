-- ===========================================
-- LOGS TABLES
-- ===========================================

-- Logs table
CREATE TABLE logs (
    "id" SERIAL PRIMARY KEY,
    "type" ENUM('info', 'warn', 'error') NOT NULL,
    "kind" ENUM('login', 'logout', 'other') NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);
