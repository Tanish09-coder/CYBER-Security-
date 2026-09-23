-- =============================================================================
-- Migration 005: Organizations and Business Units Hierarchy
-- Owner: HARSH
-- Purpose: Organizations and business units hierarchy
-- Tables: organizations, business_units
-- Indexes: business_units(organization_id), organizations(industry)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Organizations — Multi-tenant enterprise profile
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    industry        VARCHAR(128),
    employee_count  INTEGER CHECK (employee_count >= 0),
    annual_revenue  NUMERIC(18, 2) CHECK (annual_revenue >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_industry
    ON organizations (industry);

CREATE INDEX IF NOT EXISTS idx_organizations_name
    ON organizations (name);

-- =============================================================================
-- Business Units — Departmental hierarchy within an organization
-- =============================================================================
CREATE TABLE IF NOT EXISTS business_units (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    criticality_tier  INTEGER NOT NULL DEFAULT 3 CHECK (criticality_tier BETWEEN 1 AND 5),
    budget            NUMERIC(18, 2) CHECK (budget >= 0),
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_business_units_organization_id
    ON business_units (organization_id);

CREATE INDEX IF NOT EXISTS idx_business_units_criticality
    ON business_units (criticality_tier);
