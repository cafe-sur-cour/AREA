CREATE TABLE sessions (
    "id" varchar PRIMARY KEY,
    "expiredAt" timestamp NOT NULL,
    "json" text NOT NULL
);
