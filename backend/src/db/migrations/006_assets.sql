-- =============================================================================
-- Migration 006: Enterprise Asset Inventory
-- Owner: HARSH
-- Purpose: Assets table with network interfaces, dedup indexes, and filtering
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Assets — Enterprise asset inventory
-- =============================================================================
CREATE TABLE IF NOT EXISTS assets (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_unit_id      UUID REFERENCES business_units(id) ON DELETE SET NULL,
    asset_identifier      VARCHAR(128),
    name                  VARCHAR(255) NOT NULL,
    hostname              VARCHAR(255),
    ip_address            VARCHAR(45),
    mac_address           VARCHAR(17),
    asset_type            VARCHAR(64) NOT NULL DEFAULT 'server',
    operating_system      VARCHAR(128),
    environment           VARCHAR(32) NOT NULL DEFAULT 'Production',
    owner                 VARCHAR(255),
    is_internet_facing    BOOLEAN,
    business_criticality  INTEGER CHECK (business_criticality IS NULL OR (business_criticality BETWEEN 1 AND 5)),
    data_classification   VARCHAR(32) NOT NULL DEFAULT 'Internal',
    revenue_dependency_pct    NUMERIC(5, 2) DEFAULT 0 CHECK (revenue_dependency_pct >= 0 AND revenue_dependency_pct <= 100),
    operational_importance    NUMERIC(5, 2) DEFAULT 0 CHECK (operational_importance >= 0),
    metadata              JSONB DEFAULT '{}',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup indexes: hostname, MAC, IP within an organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_org_hostname
    ON assets (organization_id, hostname)
    WHERE hostname IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_org_mac
    ON assets (organization_id, mac_address)
    WHERE mac_address IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_org_ip
    ON assets (organization_id, ip_address)
    WHERE ip_address IS NOT NULL;

-- Filtering indexes
CREATE INDEX IF NOT EXISTS idx_assets_organization_id
    ON assets (organization_id);

CREATE INDEX IF NOT EXISTS idx_assets_business_unit_id
    ON assets (business_unit_id);

CREATE INDEX IF NOT EXISTS idx_assets_type
    ON assets (asset_type);

CREATE INDEX IF NOT EXISTS idx_assets_criticality
    ON assets (business_criticality);

CREATE INDEX IF NOT EXISTS idx_assets_internet_facing
    ON assets (is_internet_facing);

CREATE INDEX IF NOT EXISTS idx_assets_data_classification
    ON assets (data_classification);
