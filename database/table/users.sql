-- Users table
CREATE TABLE users (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_admin" BOOLEAN DEFAULT FALSE,
    "picture" VARCHAR(500),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Security fields
    "email_verified" BOOLEAN DEFAULT FALSE,
    "email_verification_token" VARCHAR(255),
    "email_verification_expires" TIMESTAMP,

    -- Password management
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMP,

    -- Security and authentication
    "failed_login_attempts" INTEGER DEFAULT 0,
    "locked_until" TIMESTAMP,
    "last_login_at" TIMESTAMP,
    "last_password_change" TIMESTAMP,

    -- User preferences
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "language" VARCHAR(10) DEFAULT 'en',
    "theme" VARCHAR(20) DEFAULT 'light',

    -- Metadata
    "is_active" BOOLEAN DEFAULT TRUE,
    "deleted_at" TIMESTAMP
);
