-- schema.sql
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_slug TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    email_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_page_slug ON contacts (page_slug);
CREATE INDEX IF NOT EXISTS idx_secret_key ON contacts (secret_key);
