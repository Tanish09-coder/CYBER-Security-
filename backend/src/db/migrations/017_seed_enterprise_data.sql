-- =============================================================================
-- Migration 017: Seed Enterprise Topology and Asset Inventory Data
-- Purpose: Populates authentic Indian Enterprise assets & network dependencies for
--          Bharat Digital Financial Services (Demo) so Attack Path Analysis and
--          Asset Management always display realistic topological graph structures.
-- =============================================================================

-- 1. Ensure default Organization exists
INSERT INTO organizations (id, name, industry, employee_count, annual_revenue, currency, metadata)
VALUES (
    'demo-bharat-digital-01',
    'Bharat Digital Financial Services (Demo)',
    'Banking & Financial Services',
    24500,
    185000000000.00,
    'INR',
    '{"is_demo": true, "demo_tag": "Official Indian Enterprise Workspace (INR ₹)"}'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    currency = 'INR',
    annual_revenue = EXCLUDED.annual_revenue;

-- Also seed 11111111-1111-1111-1111-111111111111 as fallback org
INSERT INTO organizations (id, name, industry, employee_count, annual_revenue, currency, metadata)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Bharat Digital Financial Services',
    'Banking & Financial Services',
    24500,
    185000000000.00,
    'INR',
    '{"is_demo": true}'
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure Asset Dependencies table exists
CREATE TABLE IF NOT EXISTS asset_dependencies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_asset_id     UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    target_asset_id     UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    dependency_type     VARCHAR(64) NOT NULL DEFAULT 'NETWORK_PATH',
    propagation_weight  NUMERIC(5, 2) DEFAULT 0.50,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_dep_source ON asset_dependencies (source_asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_dep_target ON asset_dependencies (target_asset_id);

-- 3. Populate authentic enterprise assets
INSERT INTO assets (
    id, organization_id, name, hostname, ip_address, asset_type, operating_system, environment, owner, is_internet_facing, business_criticality, data_classification, revenue_dependency_pct, operational_importance
) VALUES
('a1111111-1111-1111-1111-111111111111', 'demo-bharat-digital-01', 'mumbai-edge-api-gateway', 'gw-mumbai.bharatfin.in', '103.21.244.10', 'gateway', 'Linux RHEL 9.2', 'Production', 'InfraSec Ops', true, 3, 'Public', 45.00, 80.00),
('a2222222-2222-2222-2222-222222222222', 'demo-bharat-digital-01', 'delhi-public-banking-portal', 'netbanking.bharatfin.in', '103.21.244.15', 'web_server', 'Ubuntu 22.04 LTS', 'Production', 'Retail Banking Team', true, 4, 'Confidential', 65.00, 85.00),
('a3333333-3333-3333-3333-333333333333', 'demo-bharat-digital-01', 'bengaluru-auth-microservice', 'auth-app.internal.bharatfin.in', '10.0.1.50', 'application_server', 'Linux K8s Cluster', 'Production', 'IAM Engineering', false, 4, 'Restricted', 75.00, 90.00),
('a4444444-4444-4444-4444-444444444444', 'demo-bharat-digital-01', 'pune-swift-integration-gateway', 'swift-choke.internal.bharatfin.in', '10.0.4.12', 'middleware', 'Windows Server 2022', 'Production', 'Treasury & SWIFT Ops', false, 5, 'Highly Confidential', 88.00, 95.00),
('a5555555-5555-5555-5555-555555555555', 'demo-bharat-digital-01', 'chennai-core-payment-switch', 'pay-switch.internal.bharatfin.in', '10.0.2.100', 'payment_gateway', 'Solaris 11 Enterprise', 'Production', 'Core Banking Ops', false, 5, 'Crown Jewels', 95.00, 99.00),
('a6666666-6666-6666-6666-666666666666', 'demo-bharat-digital-01', 'hyderabad-customer-db-cluster', 'cust-db-01.internal.bharatfin.in', '10.0.3.200', 'database', 'Oracle Enterprise Linux', 'Production', 'Database Platform Team', false, 5, 'Crown Jewels', 98.00, 99.00)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    ip_address = EXCLUDED.ip_address,
    is_internet_facing = EXCLUDED.is_internet_facing,
    business_criticality = EXCLUDED.business_criticality;

-- 4. Populate topology network paths (Attack Path Hops)
INSERT INTO asset_dependencies (id, source_asset_id, target_asset_id, dependency_type, propagation_weight) VALUES
('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'NETWORK_PATH', 0.85),
('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'NETWORK_PATH', 0.75),
('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 'TRUST_RELATIONSHIP', 0.90),
('d4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'NETWORK_PATH', 0.95),
('d5555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 'a6666666-6666-6666-6666-666666666666', 'TRUST_RELATIONSHIP', 0.92)
ON CONFLICT (id) DO NOTHING;
