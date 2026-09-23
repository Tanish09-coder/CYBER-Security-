-- =============================================================================
-- LEGACY / DEPRECATED REFERENCE ONLY — DO NOT USE FOR RUNTIME INITIALIZATION
-- =============================================================================
-- Notice: This monolithic schema represents an early prototype design.
-- The authoritative evolving database schema for CyberRiskOS is maintained
-- exclusively via the numbered migration system in:
--   backend/src/db/migrations/
-- Runtime database setup and migrations are managed exclusively by the backend
-- migration runner (runMigrations() in backend/src/db/index.ts).
-- DO NOT mount or execute this file during container initialization or deployment.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Identity & Tenancy
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    base_currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'CISO', 'Security Analyst', 'Risk Officer', 'Auditor', 'Executive Viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Enterprise Asset Registry & Dependencies
-- -----------------------------------------------------------------------------
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    asset_identifier VARCHAR(100) NOT NULL, -- e.g., AST-00124
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,       -- Server, Database, Gateway, Endpoint, Cloud Storage
    business_unit VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL CHECK (environment IN ('Production', 'Staging', 'Development', 'DR')),
    owner VARCHAR(255),
    ip_address VARCHAR(45),
    is_internet_facing BOOLEAN DEFAULT FALSE,
    criticality_tier INT NOT NULL CHECK (criticality_tier BETWEEN 1 AND 5), -- 1: Low, 5: Mission Critical
    data_classification VARCHAR(50) CHECK (data_classification IN ('Public', 'Internal', 'Confidential', 'Restricted')),
    revenue_dependency_pct DECIMAL(5,2) DEFAULT 0.00,
    operational_importance_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    dependent_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    dependency_type VARCHAR(100), -- DataFlow, NetworkAccess, AuthenticationDependency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Vulnerability & Threat Intelligence
-- -----------------------------------------------------------------------------
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cve_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., CVE-2026-1234
    cvss_score DECIMAL(3,1) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    affected_technology VARCHAR(255) NOT NULL,
    is_kev BOOLEAN DEFAULT FALSE,       -- CISA Known Exploited Vulnerability flag
    exploit_status VARCHAR(50),         -- Weaponized, PoC, Unproven
    patch_available BOOLEAN DEFAULT TRUE,
    published_date DATE,
    remediation_guidance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    detection_source VARCHAR(100), -- Telemetry, Ingestion, Manual
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REMEDIATION', 'MITIGATED', 'ACCEPTED')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    remediated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE threat_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technique_id VARCHAR(50) NOT NULL, -- MITRE ATT&CK e.g. T1190
    technique_name VARCHAR(255) NOT NULL,
    tactic VARCHAR(100) NOT NULL,
    targeted_technology VARCHAR(255),
    threat_severity VARCHAR(50),
    first_observed TIMESTAMP WITH TIME ZONE,
    last_observed TIMESTAMP WITH TIME ZONE
);

CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- IAM_FAILED_LOGIN, EDR_ALERT, SIEM_CORRELATION
    source_feed VARCHAR(50) NOT NULL, -- CSV, JSON, REST
    severity VARCHAR(50),
    raw_payload JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. Controls & Posture Management
-- -----------------------------------------------------------------------------
CREATE TABLE controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., CTRL-MFA, CTRL-EDR, CTRL-SEG
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,   -- AccessControl, Endpoint, Network, Backup, Encryption
    description TEXT,
    default_mitigation_weight DECIMAL(3,2) NOT NULL -- Range 0.00 to 1.00
);

CREATE TABLE asset_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Implemented', 'Partially Implemented', 'Not Implemented')),
    effectiveness_score DECIMAL(3,2) NOT NULL CHECK (effectiveness_score BETWEEN 0.00 AND 1.00),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Financial Profiles & Assumptions
-- -----------------------------------------------------------------------------
CREATE TABLE financial_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    hourly_downtime_cost DECIMAL(15,2) NOT NULL,       -- In INR
    hourly_recovery_rate DECIMAL(10,2) NOT NULL,       -- In INR
    cost_per_sensitive_record DECIMAL(10,2) NOT NULL,  -- In INR
    regulatory_breach_penalty DECIMAL(15,2) NOT NULL,  -- In INR
    daily_transaction_volume DECIMAL(15,2) DEFAULT 0,  -- In INR
    is_active BOOLEAN DEFAULT TRUE,
    calibrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. Risk Snapshots & Factor Decomposition
-- -----------------------------------------------------------------------------
CREATE TABLE risk_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    incident_probability DECIMAL(5,4) NOT NULL,     -- 0.0000 to 1.0000
    single_loss_expectancy DECIMAL(15,2) NOT NULL,  -- Financial SLE in INR
    modeled_annual_exposure DECIMAL(15,2) NOT NULL, -- EAL in INR
    risk_tier VARCHAR(50) NOT NULL CHECK (risk_tier IN ('Low', 'Moderate', 'High', 'Critical')),
    snapshot_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE risk_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_snapshot_id UUID REFERENCES risk_snapshots(id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL, -- e.g. "Critical Unpatched CVE-2026-1234", "Direct Internet Exposure"
    weight_percentage DECIMAL(5,2) NOT NULL,
    impact_level VARCHAR(20) CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'VERY HIGH'))
);

-- -----------------------------------------------------------------------------
-- 7. What-If Simulation Scenarios
-- -----------------------------------------------------------------------------
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    baseline_exposure DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenario_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- ENABLE_CONTROL, PATCH_CVE, SEGMENT_NETWORK, DELAY_REMEDIATION
    target_asset_id UUID REFERENCES assets(id),
    target_control_id UUID REFERENCES controls(id),
    target_vulnerability_id UUID REFERENCES vulnerabilities(id),
    delay_days INT DEFAULT 0
);

CREATE TABLE scenario_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    simulated_exposure DECIMAL(15,2) NOT NULL,
    modeled_risk_reduction DECIMAL(15,2) NOT NULL,
    estimated_implementation_cost DECIMAL(15,2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. Security Investment Optimization
-- -----------------------------------------------------------------------------
CREATE TABLE mitigation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- e.g. "Enterprise MFA Rollout", "Network Microsegmentation"
    category VARCHAR(100) NOT NULL,
    description TEXT,
    implementation_time_weeks INT DEFAULT 4
);

CREATE TABLE mitigation_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mitigation_action_id UUID REFERENCES mitigation_actions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    estimated_cost DECIMAL(15,2) NOT NULL, -- In INR
    projected_risk_reduction DECIMAL(15,2) NOT NULL -- In INR
);

CREATE TABLE investment_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    allocated_budget DECIMAL(15,2) NOT NULL,
    executed_by UUID REFERENCES users(id),
    run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE investment_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_run_id UUID REFERENCES investment_runs(id) ON DELETE CASCADE,
    strategy_label VARCHAR(50) NOT NULL, -- "Strategy A (Balanced)", "Strategy B (Max Reduction)", "Strategy C (Targeted)"
    total_cost DECIMAL(15,2) NOT NULL,
    modeled_exposure_reduction DECIMAL(15,2) NOT NULL,
    residual_exposure DECIMAL(15,2) NOT NULL,
    rosi_percentage DECIMAL(8,2) NOT NULL,
    selected_actions JSONB NOT NULL
);

-- -----------------------------------------------------------------------------
-- 9. Compliance Frameworks & Control Mappings
-- -----------------------------------------------------------------------------
CREATE TABLE frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- NIST_CSF, ISO_27001, CIS_V8, RBI_CSF, SEBI_CSCRF
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL
);

CREATE TABLE framework_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
    identifier VARCHAR(50) NOT NULL, -- e.g. "PR.AC-1", "A.9.4.2", "Safeguard 6.1"
    title VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE control_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
    framework_control_id UUID REFERENCES framework_controls(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 10. Reports & Audit Logs
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL, -- EXECUTIVE_SUMMARY, TECHNICAL_ASSESSMENT, AUDIT_PACK
    generated_by UUID REFERENCES users(id),
    file_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- ASSET_CREATED, FINANCIAL_ASSUMPTION_CHANGED, WHATIF_EXECUTED
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
