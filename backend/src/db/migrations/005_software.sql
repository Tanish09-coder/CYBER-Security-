-- =============================================================================
-- Migration 005: Installed Software Inventory & Versioning
-- Owner: HARSH
-- Purpose: Installed software packages, version tracking, and asset-software relations
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Installed Software — Per-asset software package inventory
-- =============================================================================
CREATE TABLE IF NOT EXISTS installed_software (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id          UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    vendor            VARCHAR(128) NOT NULL,
    product           VARCHAR(128) NOT NULL,
    version           VARCHAR(64) NOT NULL,
    release           VARCHAR(64),
    cpe23             VARCHAR(255),
    install_path      TEXT,
    last_observed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (asset_id, vendor, product, version)
);

CREATE INDEX IF NOT EXISTS idx_installed_software_asset_id
    ON installed_software (asset_id);

CREATE INDEX IF NOT EXISTS idx_installed_software_vendor_product
    ON installed_software (vendor, product);

CREATE INDEX IF NOT EXISTS idx_installed_software_product
    ON installed_software (product);
