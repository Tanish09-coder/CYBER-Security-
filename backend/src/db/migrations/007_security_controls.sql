-- =============================================================================
-- Migration 007: Security Controls Catalog & Asset Posture Mapping
-- Owner: HARSH
-- Purpose: Defensive controls catalog and per-asset implementation posture
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Security Controls Catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS security_controls (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                      VARCHAR(32) UNIQUE NOT NULL,
    name                      VARCHAR(128) NOT NULL,
    category                  VARCHAR(64) NOT NULL,
    description               TEXT NOT NULL,
    default_mitigation_weight NUMERIC(4, 2) NOT NULL DEFAULT 0.50 CHECK (default_mitigation_weight >= 0.00 AND default_mitigation_weight <= 1.00),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_controls_code
    ON security_controls (code);

CREATE INDEX IF NOT EXISTS idx_security_controls_category
    ON security_controls (category);

-- Seed authoritative defensive controls catalog
INSERT INTO security_controls (code, name, category, description, default_mitigation_weight)
VALUES
    ('MFA', 'Multi-Factor Authentication', 'Identity & Access', 'Multi-Factor Authentication enforcement across privileged and administrative access pathways.', 0.85),
    ('EDR', 'Endpoint Detection & Response', 'Endpoint Security', 'Active sensor coverage with behavioral anomaly detection, process monitoring, and automated containment capabilities.', 0.80),
    ('BACKUP', 'Immutable & Offline Backups', 'Data Protection & Resilience', 'Ransomware-resilient, offline or immutable backup snapshots with verified restoration testing.', 0.75),
    ('SEGMENTATION', 'Network Micro-segmentation', 'Network Security', 'Zero-trust network micro-segmentation restricting lateral movement and blast radius.', 0.70),
    ('PAM', 'Privileged Access Management', 'Identity & Access', 'Vaulting, just-in-time access, credential rotation, and session recording for privileged credentials.', 0.80),
    ('ENCRYPTION', 'Data Encryption (Rest & Transit)', 'Data Protection', 'FIPS-compliant cryptographic protection for all sensitive records at rest and in transit.', 0.65),
    ('MONITORING', '24/7 SIEM & SOC Monitoring', 'Detection & Monitoring', 'Continuous security telemetry ingestion, correlation rules, and active incident response operations.', 0.75)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- Asset Control Posture — Per-asset control implementation state
-- =============================================================================
CREATE TABLE IF NOT EXISTS asset_controls (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id              UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    control_id            UUID NOT NULL REFERENCES security_controls(id) ON DELETE CASCADE,
    control_code          VARCHAR(32) NOT NULL,
    status                VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN'
                          CHECK (status IN ('IMPLEMENTED', 'PARTIAL', 'NOT_IMPLEMENTED', 'UNKNOWN')),
    effectiveness_score   NUMERIC(3, 2) NOT NULL DEFAULT 0.00
                          CHECK (effectiveness_score >= 0.00 AND effectiveness_score <= 1.00),
    source                VARCHAR(64) NOT NULL DEFAULT 'USER_CONFIG'
                          CHECK (source IN ('USER_CONFIG', 'SCANNER_IMPORT', 'AUDIT_VERIFIED')),
    notes                 TEXT,
    last_verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (asset_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_controls_asset_id
    ON asset_controls (asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_controls_code
    ON asset_controls (control_code);

CREATE INDEX IF NOT EXISTS idx_asset_controls_status
    ON asset_controls (status);
