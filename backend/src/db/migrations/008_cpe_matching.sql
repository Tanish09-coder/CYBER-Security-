-- =============================================================================
-- Migration 008: CPE Matching & Asset Vulnerability Correlation
-- Owner: HARSH
-- Purpose: Correlating installed software with NVD vulnerability CPE criteria
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Asset Vulnerabilities — Identified potential CVE exposures per asset
-- =============================================================================
CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id          UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    software_id       UUID REFERENCES installed_software(id) ON DELETE SET NULL,
    vulnerability_id  UUID NOT NULL REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    cve_id            VARCHAR(50) NOT NULL,
    cpe_criteria_id   UUID REFERENCES vulnerability_cpes(id) ON DELETE SET NULL,
    match_confidence  NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (match_confidence >= 0.00 AND match_confidence <= 1.00),
    match_type        VARCHAR(50) NOT NULL DEFAULT 'CPE_VERSION_BOUND',
    match_reason      TEXT NOT NULL,
    status            VARCHAR(50) NOT NULL DEFAULT 'POTENTIAL_VULNERABILITY_MATCH'
                      CHECK (status IN ('POTENTIAL_VULNERABILITY_MATCH', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE')),
    matched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (asset_id, vulnerability_id, software_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_vulns_asset_id
    ON asset_vulnerabilities (asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_vulns_cve_id
    ON asset_vulnerabilities (cve_id);

CREATE INDEX IF NOT EXISTS idx_asset_vulns_status
    ON asset_vulnerabilities (status);

CREATE INDEX IF NOT EXISTS idx_asset_vulns_vulnerability_id
    ON asset_vulnerabilities (vulnerability_id);
