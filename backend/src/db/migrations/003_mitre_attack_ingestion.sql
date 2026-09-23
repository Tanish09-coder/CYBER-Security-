-- =============================================================================
-- Migration 003: MITRE ATT&CK Enterprise STIX 2.1 Ingestion & Graph Model
-- Owner: TANISH
-- Purpose: MITRE ATT&CK Enterprise STIX ingestion
-- =============================================================================

-- 1. Register MITRE ATT&CK Enterprise in data_sources registry
INSERT INTO data_sources (name, provider, base_url, data_type, enabled)
VALUES (
    'MITRE ATT&CK Enterprise',
    'MITRE',
    'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
    'THREAT_KNOWLEDGE_BASE',
    TRUE
)
ON CONFLICT (name, provider) DO NOTHING;

-- 2. Releases Table (Multi-Release Auditing & Version History)
CREATE TABLE IF NOT EXISTS mitre_attack_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(50) NOT NULL,
    attack_version VARCHAR(50) NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE,
    source_url TEXT NOT NULL,
    source_record_id UUID REFERENCES raw_source_records(id) ON DELETE SET NULL,
    bundle_hash VARCHAR(64) NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    first_ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_releases_version ON mitre_attack_releases(attack_version);
CREATE INDEX IF NOT EXISTS idx_mitre_releases_is_current ON mitre_attack_releases(is_current);
CREATE INDEX IF NOT EXISTS idx_mitre_releases_bundle_hash ON mitre_attack_releases(bundle_hash);

-- 3. Normalized Tactics Table (x-mitre-tactic)
CREATE TABLE IF NOT EXISTS mitre_attack_tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_id VARCHAR(100) UNIQUE NOT NULL,
    attack_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    short_name VARCHAR(100),
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    deprecated BOOLEAN DEFAULT FALSE,
    source_created_by_ref VARCHAR(100),
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_tactics_attack_id ON mitre_attack_tactics(attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_tactics_stix_id ON mitre_attack_tactics(stix_id);
CREATE INDEX IF NOT EXISTS idx_mitre_tactics_short_name ON mitre_attack_tactics(short_name);
CREATE INDEX IF NOT EXISTS idx_mitre_tactics_revoked ON mitre_attack_tactics(revoked);
CREATE INDEX IF NOT EXISTS idx_mitre_tactics_deprecated ON mitre_attack_tactics(deprecated);

-- 4. Normalized Techniques Table (attack-pattern: Techniques & Sub-techniques)
CREATE TABLE IF NOT EXISTS mitre_attack_techniques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_id VARCHAR(100) UNIQUE NOT NULL,
    attack_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_subtechnique BOOLEAN DEFAULT FALSE,
    parent_attack_id VARCHAR(50),
    parent_stix_id VARCHAR(100),
    platforms JSONB,
    kill_chain_phases JSONB,
    permissions_required JSONB,
    effective_permissions JSONB,
    defense_bypassed JSONB,
    data_sources JSONB,
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    deprecated BOOLEAN DEFAULT FALSE,
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_techniques_attack_id ON mitre_attack_techniques(attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_stix_id ON mitre_attack_techniques(stix_id);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_parent_attack_id ON mitre_attack_techniques(parent_attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_is_subtechnique ON mitre_attack_techniques(is_subtechnique);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_revoked ON mitre_attack_techniques(revoked);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_deprecated ON mitre_attack_techniques(deprecated);

-- 5. Normalized Mitigations Table (course-of-action)
CREATE TABLE IF NOT EXISTS mitre_attack_mitigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_id VARCHAR(100) UNIQUE NOT NULL,
    attack_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    deprecated BOOLEAN DEFAULT FALSE,
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_mitigations_attack_id ON mitre_attack_mitigations(attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_mitigations_stix_id ON mitre_attack_mitigations(stix_id);

-- 6. Normalized Threat Groups Table (intrusion-set)
CREATE TABLE IF NOT EXISTS mitre_attack_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_id VARCHAR(100) UNIQUE NOT NULL,
    attack_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    aliases JSONB,
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    deprecated BOOLEAN DEFAULT FALSE,
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_groups_attack_id ON mitre_attack_groups(attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_groups_stix_id ON mitre_attack_groups(stix_id);

-- 7. Normalized Software Table (malware and tool)
CREATE TABLE IF NOT EXISTS mitre_attack_software (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_id VARCHAR(100) UNIQUE NOT NULL,
    attack_id VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    software_type VARCHAR(50) NOT NULL CHECK (software_type IN ('MALWARE', 'TOOL', 'OTHER')),
    aliases JSONB,
    platforms JSONB,
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    deprecated BOOLEAN DEFAULT FALSE,
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_software_attack_id ON mitre_attack_software(attack_id);
CREATE INDEX IF NOT EXISTS idx_mitre_software_stix_id ON mitre_attack_software(stix_id);
CREATE INDEX IF NOT EXISTS idx_mitre_software_type ON mitre_attack_software(software_type);

-- 8. Authoritative STIX Relationships Table (Graph Preservation)
CREATE TABLE IF NOT EXISTS mitre_attack_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stix_relationship_id VARCHAR(100) UNIQUE NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    source_stix_id VARCHAR(100) NOT NULL,
    target_stix_id VARCHAR(100) NOT NULL,
    source_type VARCHAR(100),
    target_type VARCHAR(100),
    description TEXT,
    created TIMESTAMP WITH TIME ZONE,
    modified TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE,
    current_release_id UUID REFERENCES mitre_attack_releases(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitre_rel_source ON mitre_attack_relationships(source_stix_id);
CREATE INDEX IF NOT EXISTS idx_mitre_rel_target ON mitre_attack_relationships(target_stix_id);
CREATE INDEX IF NOT EXISTS idx_mitre_rel_type ON mitre_attack_relationships(relationship_type);

-- 9. Tactic <-> Technique Junction Table (from official kill-chain phases)
CREATE TABLE IF NOT EXISTS mitre_attack_tactic_techniques (
    tactic_id UUID REFERENCES mitre_attack_tactics(id) ON DELETE CASCADE,
    technique_id UUID REFERENCES mitre_attack_techniques(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'STIX_KILL_CHAIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tactic_id, technique_id)
);

CREATE INDEX IF NOT EXISTS idx_mitre_tt_technique_id ON mitre_attack_tactic_techniques(technique_id);
