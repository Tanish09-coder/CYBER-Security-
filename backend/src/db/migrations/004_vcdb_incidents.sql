-- Owner: TANISH
-- Purpose: VCDB / VERIS public incident intelligence ingestion

-- 1. Register VERIS Community Database Data Source
INSERT INTO data_sources (name, provider, data_type, base_url, enabled)
VALUES (
    'VERIS Community Database',
    'vz-risk / VERIS Community',
    'PUBLIC_INCIDENT_INTELLIGENCE',
    'https://github.com/vz-risk/VCDB',
    TRUE
)
ON CONFLICT (name, provider) DO UPDATE SET
    data_type = EXCLUDED.data_type,
    base_url = EXCLUDED.base_url,
    updated_at = CURRENT_TIMESTAMP;

-- 2. Repository Revision & Ingestion Tracking
CREATE TABLE IF NOT EXISTS vcdb_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_url VARCHAR(255) NOT NULL DEFAULT 'https://github.com/vz-risk/VCDB',
    commit_sha VARCHAR(100),
    veris_version VARCHAR(50),
    bundle_hash VARCHAR(64) NOT NULL,
    total_incidents INTEGER NOT NULL DEFAULT 0,
    retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_releases_commit ON vcdb_releases(commit_sha);
CREATE INDEX IF NOT EXISTS idx_vcdb_releases_hash ON vcdb_releases(bundle_hash);

-- 3. Searchable Normalized VCDB Incidents Table
CREATE TABLE IF NOT EXISTS vcdb_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vcdb_id VARCHAR(100) UNIQUE NOT NULL,
    source_record_id UUID REFERENCES raw_source_records(id) ON DELETE SET NULL,
    source_file_path TEXT,
    incident_year INTEGER,
    security_incident VARCHAR(50),
    confidence VARCHAR(50),
    summary TEXT,
    victim_country VARCHAR(100),
    victim_industry VARCHAR(100),
    employee_count VARCHAR(100),
    data_disclosure VARCHAR(50),
    discovery_method VARCHAR(100),
    schema_version VARCHAR(50),
    raw_record JSONB,
    payload_hash VARCHAR(64) NOT NULL,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    removed_from_source_at TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_incidents_vcdb_id ON vcdb_incidents(vcdb_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_incidents_year ON vcdb_incidents(incident_year);
CREATE INDEX IF NOT EXISTS idx_vcdb_incidents_industry ON vcdb_incidents(victim_industry);
CREATE INDEX IF NOT EXISTS idx_vcdb_incidents_country ON vcdb_incidents(victim_country);
CREATE INDEX IF NOT EXISTS idx_vcdb_incidents_is_current ON vcdb_incidents(is_current);

-- 4. VERIS Actors (Who/What caused event)
CREATE TABLE IF NOT EXISTS vcdb_incident_actors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    actor_category VARCHAR(50) NOT NULL, -- External, Internal, Partner, Unknown
    actor_subtype TEXT,
    motive TEXT,
    country TEXT,
    source_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_actors_incident_id ON vcdb_incident_actors(incident_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_actors_category ON vcdb_incident_actors(actor_category);

-- 5. VERIS Actions (What happened)
CREATE TABLE IF NOT EXISTS vcdb_incident_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    action_category VARCHAR(50) NOT NULL, -- Hacking, Malware, Social, Misuse, Physical, Error, Environmental, Unknown
    action_subtype TEXT,
    vector TEXT,
    variety TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_actions_incident_id ON vcdb_incident_actions(incident_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_actions_category ON vcdb_incident_actions(action_category);

-- 6. VERIS Assets (What assets were affected in historical incident)
CREATE TABLE IF NOT EXISTS vcdb_incident_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    asset_category VARCHAR(50) NOT NULL, -- Server, Network, User Device, Media, Person, Unknown
    asset_variety TEXT,
    amount INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_assets_incident_id ON vcdb_incident_assets(incident_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_assets_category ON vcdb_incident_assets(asset_category);

-- 7. VERIS Attributes / Impact (Security properties impacted)
CREATE TABLE IF NOT EXISTS vcdb_incident_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    attribute_category VARCHAR(50) NOT NULL, -- Confidentiality, Integrity, Availability
    variety TEXT,
    data_variety TEXT,
    record_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vcdb_attributes_incident_id ON vcdb_incident_attributes(incident_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_attributes_category ON vcdb_incident_attributes(attribute_category);

-- 8. Incident Timeline
CREATE TABLE IF NOT EXISTS vcdb_incident_timeline (
    incident_id UUID PRIMARY KEY REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    incident_year INTEGER,
    incident_month INTEGER,
    incident_day INTEGER,
    compromise_unit VARCHAR(50),
    compromise_value NUMERIC,
    discovery_unit VARCHAR(50),
    discovery_value NUMERIC,
    containment_unit VARCHAR(50),
    containment_value NUMERIC,
    exfiltration_unit VARCHAR(50),
    exfiltration_value NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Authoritative Explicit Structured CVE References
CREATE TABLE IF NOT EXISTS vcdb_incident_cves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES vcdb_incidents(id) ON DELETE CASCADE,
    cve_id VARCHAR(50) NOT NULL,
    evidence_source VARCHAR(100) NOT NULL, -- e.g. action.hacking.cve, action.malware.cve
    source_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (incident_id, cve_id, evidence_source)
);

CREATE INDEX IF NOT EXISTS idx_vcdb_cves_incident_id ON vcdb_incident_cves(incident_id);
CREATE INDEX IF NOT EXISTS idx_vcdb_cves_cve_id ON vcdb_incident_cves(cve_id);
