-- Activity logs table
CREATE TABLE user_activity_logs (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
