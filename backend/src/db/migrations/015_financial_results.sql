-- =============================================================================
-- Migration 015: Financial Exposure & Estimated Annualized Loss (EAL) Results
-- Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
-- Purpose: Storage of deterministic financial risk evaluations, modeled EAL,
--          Single Loss Expectancy (SLE), Annual Loss Event Frequency (ALEF),
--          auditability provenance, and caching.
-- Labeling: Strict MODELED / ESTIMATED financial figures (ISO 4217 currencies).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS financial_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE SET NULL,
    cve_id VARCHAR(50) NOT NULL,
    sle NUMERIC(15, 2) NULL CHECK (sle IS NULL OR sle >= 0.0),
    sle_status VARCHAR(20) NOT NULL DEFAULT 'CALCULATED',
    alef NUMERIC(8, 4) NULL CHECK (alef IS NULL OR alef >= 0.0),
    eal NUMERIC(15, 2) NULL CHECK (eal IS NULL OR eal >= 0.0),
    eal_status VARCHAR(20) NOT NULL DEFAULT 'CALCULATED',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    primary_loss NUMERIC(15, 2) NULL,
    secondary_loss NUMERIC(15, 2) NULL,
    estimated_outage_hours NUMERIC(6, 2) NULL,
    hourly_downtime_rate NUMERIC(12, 2) NULL,
    recovery_cost NUMERIC(12, 2) NULL,
    factors JSONB NOT NULL DEFAULT '[]',
    missing_data_warnings JSONB NOT NULL DEFAULT '[]',
    data_completeness NUMERIC(5, 4) NOT NULL DEFAULT 1.0 CHECK (data_completeness >= 0.0 AND data_completeness <= 1.0),
    model_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    input_provenance_hash VARCHAR(64) NOT NULL,
    is_estimated BOOLEAN NOT NULL DEFAULT true,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for deterministic asset-vulnerability financial caching:
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_results_asset_cve
    ON financial_results (asset_id, cve_id);

-- Lookup index for organization filtering
CREATE INDEX IF NOT EXISTS idx_financial_results_org_id
    ON financial_results (organization_id);

-- Lookup index for asset filtering and rollups
CREATE INDEX IF NOT EXISTS idx_financial_results_asset_id
    ON financial_results (asset_id);

-- Lookup index for CVE impact queries
CREATE INDEX IF NOT EXISTS idx_financial_results_cve_id
    ON financial_results (cve_id);

-- Range scan index for EAL sorting (top loss drivers)
CREATE INDEX IF NOT EXISTS idx_financial_results_eal
    ON financial_results (eal DESC);

-- Range scan index for SLE sorting
CREATE INDEX IF NOT EXISTS idx_financial_results_sle
    ON financial_results (sle DESC);

-- Cache provenance validation index
CREATE INDEX IF NOT EXISTS idx_financial_results_provenance
    ON financial_results (input_provenance_hash);

-- Model version index
CREATE INDEX IF NOT EXISTS idx_financial_results_model_version
    ON financial_results (model_version);
