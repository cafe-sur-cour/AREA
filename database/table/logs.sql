-- ===========================================
-- LOGS TABLES
-- ===========================================

-- Create ENUM types
CREATE TYPE log_type AS ENUM ('info', 'succ', 'warn', 'error');
CREATE TYPE log_kind AS ENUM ('login', 'logout', 'register', 'user', 'github', 'google', 'other');

-- Logs table
CREATE TABLE logs (
    "id" SERIAL PRIMARY KEY,
    "type" log_type NOT NULL,
    "kind" log_kind NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);
