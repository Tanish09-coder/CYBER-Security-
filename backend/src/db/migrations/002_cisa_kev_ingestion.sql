-- =============================================================================
-- Migration 002: CISA Known Exploited Vulnerabilities (KEV) Catalog & Linking
-- =============================================================================

-- 1. Register CISA KEV in data_sources registry
INSERT INTO data_sources (name, provider, base_url, data_type, enabled)
VALUES (
    'CISA Known Exploited Vulnerabilities Catalog',
    'CISA',
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    'KNOWN_EXPLOITED_VULNERABILITY',
    TRUE
)
ON CONFLICT (name, provider) DO NOTHING;

-- 2. Authoritative CISA KEV Entries Table
CREATE TABLE IF NOT EXISTS cisa_kev_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cve_id VARCHAR(50) NOT NULL,
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE SET NULL,
    vendor_project VARCHAR(255),
    product VARCHAR(255),
    vulnerability_name TEXT,
    date_added DATE,
    short_description TEXT,
    required_action TEXT,
    due_date DATE,
    known_ransomware_campaign_use VARCHAR(50),
    notes TEXT,
    source_record_id VARCHAR(100),
    raw_record_id UUID REFERENCES raw_source_records(id) ON DELETE SET NULL,
    is_current BOOLEAN DEFAULT TRUE,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    removed_from_catalog_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cisa_kev_cve_id ON cisa_kev_entries (cve_id);
CREATE INDEX IF NOT EXISTS idx_cisa_kev_vuln_id ON cisa_kev_entries (vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_cisa_kev_date_added ON cisa_kev_entries (date_added);
CREATE INDEX IF NOT EXISTS idx_cisa_kev_due_date ON cisa_kev_entries (due_date);
CREATE INDEX IF NOT EXISTS idx_cisa_kev_ransomware ON cisa_kev_entries (known_ransomware_campaign_use);
CREATE INDEX IF NOT EXISTS idx_cisa_kev_is_current ON cisa_kev_entries (is_current);

-- 3. Extend vulnerabilities with KEV denormalized convenience fields (if not already present)
ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS known_exploited BOOLEAN DEFAULT FALSE;
ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS kev_date_added DATE;
ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS kev_due_date DATE;
ALTER TABLE vulnerabilities ADD COLUMN IF NOT EXISTS kev_known_ransomware_campaign_use VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_known_exploited ON vulnerabilities (known_exploited);
