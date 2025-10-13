-- ===========================================
-- LOGS TABLES
-- ===========================================

-- Create ENUM types
CREATE TYPE log_type AS ENUM ('info', 'succ', 'warn', 'err');

-- Logs table
CREATE TABLE logs (
    "id" SERIAL PRIMARY KEY,
    "type" log_type NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);
