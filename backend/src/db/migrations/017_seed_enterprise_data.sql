-- =============================================================================
-- Migration 017: Seed Enterprise Topology, Assets, Controls & Risk Results Data
-- Purpose: Populates authentic Indian Enterprise assets, network dependencies,
--          security control postures, and evaluated risk scores for Bharat Digital Financial Services (Demo)
-- =============================================================================

-- 1. Ensure default Organizations exist
INSERT INTO organizations (id, name, industry, employee_count, annual_revenue, currency, metadata)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Bharat Digital Financial Services (Demo)',
    'Banking & Financial Services',
    24500,
    185000000000.00,
    'INR',
    '{"is_demo": true, "demo_tag": "Official Indian Enterprise Workspace (INR ₹)"}'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    currency = 'INR',
    annual_revenue = EXCLUDED.annual_revenue,
    metadata = EXCLUDED.metadata;

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
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'mumbai-edge-api-gateway', 'gw-mumbai.bharatfin.in', '103.21.244.10', 'gateway', 'Linux RHEL 9.2', 'Production', 'InfraSec Ops', true, 3, 'Public', 45.00, 80.00),
('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'delhi-public-banking-portal', 'netbanking.bharatfin.in', '103.21.244.15', 'web_server', 'Ubuntu 22.04 LTS', 'Production', 'Retail Banking Team', true, 4, 'Confidential', 65.00, 85.00),
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bengaluru-auth-microservice', 'auth-app.internal.bharatfin.in', '10.0.1.50', 'application_server', 'Linux K8s Cluster', 'Production', 'IAM Engineering', false, 4, 'Restricted', 75.00, 90.00),
('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'pune-swift-integration-gateway', 'swift-choke.internal.bharatfin.in', '10.0.4.12', 'middleware', 'Windows Server 2022', 'Production', 'Treasury & SWIFT Ops', false, 5, 'Highly Confidential', 88.00, 95.00),
('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'chennai-core-payment-switch', 'pay-switch.internal.bharatfin.in', '10.0.2.100', 'payment_gateway', 'Solaris 11 Enterprise', 'Production', 'Core Banking Ops', false, 5, 'Crown Jewels', 95.00, 99.00),
('a6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'hyderabad-customer-db-cluster', 'cust-db-01.internal.bharatfin.in', '10.0.3.200', 'database', 'Oracle Enterprise Linux', 'Production', 'Database Platform Team', false, 5, 'Crown Jewels', 98.00, 99.00)
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

-- 5. Seed Security Controls Catalog if missing
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

-- 6. Seed Asset Control Posture Assignments
INSERT INTO asset_controls (asset_id, control_id, control_code, status, effectiveness_score, source)
SELECT 
    a.id,
    sc.id,
    sc.code,
    CASE 
        WHEN sc.code = 'ENCRYPTION' THEN 'IMPLEMENTED'
        WHEN sc.code = 'EDR' AND a.is_internet_facing = true THEN 'IMPLEMENTED'
        WHEN sc.code = 'MFA' AND a.business_criticality >= 4 THEN 'IMPLEMENTED'
        WHEN sc.code = 'BACKUP' AND a.business_criticality = 5 THEN 'IMPLEMENTED'
        WHEN sc.code = 'MONITORING' THEN 'PARTIAL'
        WHEN sc.code = 'SEGMENTATION' AND a.is_internet_facing = false THEN 'PARTIAL'
        WHEN sc.code = 'PAM' AND a.business_criticality >= 4 THEN 'PARTIAL'
        ELSE 'NOT_IMPLEMENTED'
    END,
    CASE 
        WHEN sc.code = 'ENCRYPTION' THEN 0.85
        WHEN sc.code = 'EDR' AND a.is_internet_facing = true THEN 0.80
        WHEN sc.code = 'MFA' AND a.business_criticality >= 4 THEN 0.85
        WHEN sc.code = 'BACKUP' AND a.business_criticality = 5 THEN 0.75
        WHEN sc.code = 'MONITORING' THEN 0.40
        WHEN sc.code = 'SEGMENTATION' AND a.is_internet_facing = false THEN 0.35
        WHEN sc.code = 'PAM' AND a.business_criticality >= 4 THEN 0.40
        ELSE 0.00
    END,
    'AUDIT_VERIFIED'
FROM assets a
CROSS JOIN security_controls sc
ON CONFLICT (asset_id, control_id) DO NOTHING;

-- 7. Seed Risk Results Evaluations
INSERT INTO risk_results (
    id, organization_id, asset_id, cve_id, score, level, base_cvss, model_version, input_provenance_hash, data_completeness, factors, missing_data_warnings, risk_flags, evaluated_at
) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', 'CVE-2021-44228', 96.5, 'CRITICAL', 10.0, '1.0.0', 'hash-log4j-pay-switch', 0.95, '[{"factor": "Technical Severity", "value": "10.0"}, {"factor": "Business Criticality", "value": "Level 5 (Crown Jewel)"}, {"factor": "CISA KEV Exploitation", "value": "Known Active Threat Actor Targeting"}]', '[]', '["CISA_KEV_EXPLOITED", "HIGH_CRITICALITY_TARGET"]', NOW()),
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', 'CVE-2023-34362', 94.2, 'CRITICAL', 9.8, '1.0.0', 'hash-moveit-cust-db', 0.90, '[{"factor": "Technical Severity", "value": "9.8"}, {"factor": "Business Criticality", "value": "Level 5 (Customer DB)"}]', '[]', '["DATA_EXFILTRATION_RISK"]', NOW()),
('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', 'CVE-2023-22515', 91.8, 'CRITICAL', 9.8, '1.0.0', 'hash-swift-auth-bypass', 0.90, '[{"factor": "Technical Severity", "value": "9.8"}, {"factor": "Structural Choke Point", "value": "SWIFT Integration Gateway"}]', '[]', '["CHOKE_POINT_INTERCEPT"]', NOW()),
('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'CVE-2023-4966', 88.5, 'HIGH', 9.4, '1.0.0', 'hash-citrix-delhi-portal', 0.85, '[{"factor": "Technical Severity", "value": "9.4"}, {"factor": "Internet Exposure", "value": "Public Edge Banking Portal"}]', '[]', '["PERIMETER_EXPOSED"]', NOW()),
('b5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'CVE-2023-23397', 82.4, 'HIGH', 9.8, '1.0.0', 'hash-outlook-mumbai-gw', 0.80, '[{"factor": "Technical Severity", "value": "9.8"}, {"factor": "Internet Exposure", "value": "Mumbai API Gateway"}]', '[]', '["PERIMETER_EXPOSED"]', NOW()),
('b6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'CVE-2023-38606', 68.0, 'MEDIUM', 7.8, '1.0.0', 'hash-kernel-bengaluru-auth', 0.85, '[{"factor": "Technical Severity", "value": "7.8"}, {"factor": "Internal Scope", "value": "Bengaluru Auth Microservice"}]', '[]', '[]', NOW())
ON CONFLICT (id) DO NOTHING;
