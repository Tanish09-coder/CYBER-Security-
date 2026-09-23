-- =============================================================================
-- Migration 001: NVD CVE Ingestion & Provenance Tables
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Data Sources Registry
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_data_sources_name_provider ON data_sources (name, provider);

-- Seed official NIST NVD source metadata (real metadata record, not synthetic data)
INSERT INTO data_sources (name, provider, base_url, data_type, enabled)
VALUES ('National Vulnerability Database', 'NIST', 'https://services.nvd.nist.gov/rest/json/cves/2.0', 'VULNERABILITY', TRUE)
ON CONFLICT (name, provider) DO NOTHING;

-- 2. Data Ingestion Runs Audit Tracking
CREATE TABLE IF NOT EXISTS data_ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL')),
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN ('MANUAL', 'INCREMENTAL', 'DATE_RANGE', 'CVE_LOOKUP', 'FULL_CATALOG')),
    records_received INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_message TEXT,
    request_parameters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Raw Source Records (Immutable Payload Preservation & Provenance)
CREATE TABLE IF NOT EXISTS raw_source_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    ingestion_run_id UUID REFERENCES data_ingestion_runs(id) ON DELETE SET NULL,
    external_id VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    source_published_at TIMESTAMP WITH TIME ZONE,
    source_modified_at TIMESTAMP WITH TIME ZONE,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_raw_source_record ON raw_source_records (source_id, external_id, payload_hash);
CREATE INDEX IF NOT EXISTS idx_raw_source_lookup ON raw_source_records(source_id, external_id);

-- 4. Normalized Vulnerabilities Table
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cve_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    source_identifier VARCHAR(255),
    vuln_status VARCHAR(100),
    cvss_version VARCHAR(20),
    cvss_base_score NUMERIC(4,1),
    cvss_base_severity VARCHAR(50),
    attack_vector VARCHAR(50),
    attack_complexity VARCHAR(50),
    privileges_required VARCHAR(50),
    user_interaction VARCHAR(50),
    scope VARCHAR(50),
    confidentiality_impact VARCHAR(50),
    integrity_impact VARCHAR(50),
    availability_impact VARCHAR(50),
    published_at TIMESTAMP WITH TIME ZONE,
    modified_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'NVD',
    source_record_id VARCHAR(100),
    raw_record_id UUID REFERENCES raw_source_records(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cve_id ON vulnerabilities(cve_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_modified_at ON vulnerabilities(modified_at);

-- 5. All Preserved CVSS Assessments (NVD/NIST, CNA, ADP)
CREATE TABLE IF NOT EXISTS vulnerability_cvss_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    vector_string TEXT,
    base_score NUMERIC(4,1),
    base_severity VARCHAR(50),
    attack_vector VARCHAR(50),
    attack_complexity VARCHAR(50),
    privileges_required VARCHAR(50),
    user_interaction VARCHAR(50),
    scope VARCHAR(50),
    confidentiality_impact VARCHAR(50),
    integrity_impact VARCHAR(50),
    availability_impact VARCHAR(50),
    raw_metric_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cvss_metrics_vuln_id ON vulnerability_cvss_metrics(vulnerability_id);

-- 6. Vulnerability Weaknesses (CWE)
CREATE TABLE IF NOT EXISTS vulnerability_weaknesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    cwe_id VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_weaknesses_vuln_id ON vulnerability_weaknesses(vulnerability_id);

-- 7. Vulnerability References
CREATE TABLE IF NOT EXISTS vulnerability_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    source VARCHAR(255),
    tags JSONB
);

CREATE INDEX IF NOT EXISTS idx_references_vuln_id ON vulnerability_references(vulnerability_id);

-- 8. Vulnerability Affected CPEs
CREATE TABLE IF NOT EXISTS vulnerability_cpes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
    criteria TEXT NOT NULL,
    vulnerable BOOLEAN DEFAULT TRUE,
    version_start_including VARCHAR(100),
    version_start_excluding VARCHAR(100),
    version_end_including VARCHAR(100),
    version_end_excluding VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_cpes_vuln_id ON vulnerability_cpes(vulnerability_id);
