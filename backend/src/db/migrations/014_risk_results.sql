-- =============================================================================
-- Migration 014: Risk Results Persistence & Cache Store
-- Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
-- Purpose: Deterministic risk quantification results persistence,
--          auditability, caching, and model-version traceability.
-- Schedule: Preserves frozen migration schedule (010-013 HARSH, 014 TANISH)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS risk_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE SET NULL,
    cve_id VARCHAR(50) NOT NULL,
    score NUMERIC(5, 2) CHECK (score IS NULL OR (score >= 0.0 AND score <= 100.0)),
    level VARCHAR(20) NOT NULL CHECK (level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN')),
    evaluation_status VARCHAR(30) NOT NULL DEFAULT 'CALCULATED',
    base_cvss NUMERIC(4, 1),
    model_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    input_provenance_hash VARCHAR(64) NOT NULL,
    data_completeness NUMERIC(5, 4) NOT NULL DEFAULT 1.0 CHECK (data_completeness >= 0.0 AND data_completeness <= 1.0),
    factors JSONB NOT NULL DEFAULT '[]',
    missing_data_warnings JSONB NOT NULL DEFAULT '[]',
    risk_flags JSONB NOT NULL DEFAULT '[]',
    snapshot_metadata JSONB DEFAULT '{}',
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for deterministic asset-vulnerability caching:
-- Exactly one active evaluated risk result per (asset_id, cve_id) pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_risk_results_asset_cve
    ON risk_results (asset_id, cve_id);

-- Lookup index for organization filtering
CREATE INDEX IF NOT EXISTS idx_risk_results_org_id
    ON risk_results (organization_id);

-- Lookup index for asset filtering and rollups
CREATE INDEX IF NOT EXISTS idx_risk_results_asset_id
    ON risk_results (asset_id);

-- Lookup index for CVE impact queries
CREATE INDEX IF NOT EXISTS idx_risk_results_cve_id
    ON risk_results (cve_id);

-- Filter index for risk level triage
CREATE INDEX IF NOT EXISTS idx_risk_results_level
    ON risk_results (level);

-- Range scan index for score sorting/filtering
CREATE INDEX IF NOT EXISTS idx_risk_results_score
    ON risk_results (score DESC);

-- Cache provenance validation index
CREATE INDEX IF NOT EXISTS idx_risk_results_provenance
    ON risk_results (input_provenance_hash);

-- Model version index
CREATE INDEX IF NOT EXISTS idx_risk_results_model_version
    ON risk_results (model_version);
