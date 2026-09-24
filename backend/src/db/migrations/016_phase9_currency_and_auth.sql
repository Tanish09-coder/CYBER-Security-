-- =============================================================================
-- Migration 016: Phase 9 — Currency Enforcement & Authentication
-- Purpose:
--   1. Remove implicit USD default from organizations.currency so new orgs must
--      explicitly supply an ISO-4217 currency code.
--      Historical rows are left unchanged (they already have an explicit value).
--   2. Add ISO-4217 format CHECK constraint (3 uppercase alpha chars).
--   3. Create users table with bcrypt password_hash for JWT authentication.
--   4. Add request_audit_log table for correlation-ID tracing.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Remove implicit USD default from organizations.currency
--    New organizations must supply currency explicitly. Existing rows unchanged.
-- -----------------------------------------------------------------------------
ALTER TABLE organizations
  ALTER COLUMN currency DROP DEFAULT;

-- Add ISO-4217 format validation constraint (3 uppercase ASCII letters)
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS chk_organizations_currency_iso4217;

ALTER TABLE organizations
  ADD CONSTRAINT chk_organizations_currency_iso4217
    CHECK (currency ~ '^[A-Z]{3}$');

-- Index for currency-grouped financial queries
CREATE INDEX IF NOT EXISTS idx_organizations_currency
  ON organizations (currency);

-- -----------------------------------------------------------------------------
-- 2. Users table for JWT authentication (org-scoped)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'Security Analyst'
                    CHECK (role IN (
                      'Administrator',
                      'CISO',
                      'Security Analyst',
                      'Risk Officer',
                      'Auditor',
                      'Executive Viewer'
                    )),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id
  ON users (organization_id);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- -----------------------------------------------------------------------------
-- 3. Refresh tokens table for secure session management
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) UNIQUE NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
  ON refresh_tokens (token_hash);
