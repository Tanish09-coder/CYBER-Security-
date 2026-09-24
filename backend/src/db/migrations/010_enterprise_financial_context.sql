-- =============================================================================
-- Migration 010: Enterprise Financial Context, Remediation Catalog, Asset Dependencies & Compliance
-- Owner: HARSH
-- Purpose: Tables for organization financial parameters, remediation action catalog, asset dependencies, and compliance frameworks/evidence
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Organization Financial Parameters — Input assumptions for financial exposure
-- =============================================================================
CREATE TABLE IF NOT EXISTS organization_financial_parameters (
    id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id               UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hourly_downtime_cost          NUMERIC(18, 2) CHECK (hourly_downtime_cost >= 0),
    hourly_recovery_rate          NUMERIC(18, 2) CHECK (hourly_recovery_rate >= 0),
    cost_per_sensitive_record     NUMERIC(18, 2) CHECK (cost_per_sensitive_record >= 0),
    regulatory_breach_penalty     NUMERIC(18, 2) CHECK (regulatory_breach_penalty >= 0),
    daily_transaction_volume      NUMERIC(18, 2) CHECK (daily_transaction_volume >= 0),
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_fin_params_org_id
    ON organization_financial_parameters (organization_id);

-- =============================================================================
-- Remediation Actions Catalog — Candidate investment initiatives & action costs
-- =============================================================================
CREATE TABLE IF NOT EXISTS remediation_actions (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title                     VARCHAR(255) NOT NULL,
    description               TEXT,
    action_type               VARCHAR(64) NOT NULL CHECK (action_type IN ('ENABLE_CONTROL', 'PATCH_CVE', 'SEGMENT_NETWORK', 'REMEDIATE_VULNERABILITY')),
    remediation_cost          NUMERIC(18, 2) NOT NULL CHECK (remediation_cost >= 0),
    estimated_effort_hours    NUMERIC(8, 2) CHECK (estimated_effort_hours >= 0),
    target_control_code       VARCHAR(32),
    target_cve_id              VARCHAR(50),
    affected_asset_ids        JSONB DEFAULT '[]'::jsonb,
    status                    VARCHAR(32) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_org_id
    ON remediation_actions (organization_id);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_type
    ON remediation_actions (action_type);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_status
    ON remediation_actions (status);

-- =============================================================================
-- Asset Dependencies — Graph topology for lateral attack-path blast radius
-- =============================================================================
CREATE TABLE IF NOT EXISTS asset_dependencies (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_asset_id       UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    target_asset_id       UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    dependency_type       VARCHAR(32) NOT NULL DEFAULT 'API' CHECK (dependency_type IN ('IDENTITY', 'DATABASE', 'NETWORK_PATH', 'API', 'PIPELINE')),
    propagation_weight    NUMERIC(3, 2) NOT NULL DEFAULT 0.20 CHECK (propagation_weight >= 0.00 AND propagation_weight <= 1.00),
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (source_asset_id, target_asset_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_deps_source
    ON asset_dependencies (source_asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_deps_target
    ON asset_dependencies (target_asset_id);

-- =============================================================================
-- Compliance Frameworks & Controls Catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code          VARCHAR(32) UNIQUE NOT NULL,
    name          VARCHAR(128) NOT NULL,
    version       VARCHAR(32) NOT NULL,
    description   TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_controls (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id        UUID NOT NULL REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    requirement_code    VARCHAR(64) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,

    UNIQUE (framework_id, requirement_code)
);

CREATE TABLE IF NOT EXISTS control_compliance_mappings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_control_code   VARCHAR(32) NOT NULL REFERENCES security_controls(code) ON DELETE CASCADE,
    compliance_control_id   UUID NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,

    UNIQUE (security_control_code, compliance_control_id)
);

CREATE TABLE IF NOT EXISTS compliance_evidence (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    compliance_control_id   UUID NOT NULL REFERENCES compliance_controls(id) ON DELETE CASCADE,
    asset_id                UUID REFERENCES assets(id) ON DELETE CASCADE,
    evidence_uri            TEXT NOT NULL,
    evidence_type           VARCHAR(64) NOT NULL DEFAULT 'DOCUMENT',
    status                  VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('VERIFIED', 'EXPIRED', 'PENDING', 'REJECTED')),
    verified_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comp_evidence_org
    ON compliance_evidence (organization_id);

-- Seed Baseline Compliance Frameworks
INSERT INTO compliance_frameworks (code, name, version, description)
VALUES
    ('NIST_CSF', 'NIST Cybersecurity Framework', 'v2.0', 'National Institute of Standards and Technology Cybersecurity Framework'),
    ('ISO_27001', 'ISO/IEC 27001', '2022', 'Information Security Management System Standard'),
    ('CIS_V8', 'CIS Critical Security Controls', 'v8', 'Center for Internet Security Controls'),
    ('RBI_CSF', 'RBI Cyber Security Framework for Banks', '2016', 'Reserve Bank of India Cybersecurity Guidelines'),
    ('SEBI_CS', 'SEBI Cybersecurity Framework', '2023', 'Securities and Exchange Board of India Cyber Resilience Framework')
ON CONFLICT (code) DO NOTHING;
