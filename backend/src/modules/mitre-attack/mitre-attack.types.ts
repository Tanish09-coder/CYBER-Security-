export interface StixExternalReference {
  source_name: string;
  external_id?: string;
  url?: string;
  description?: string;
}

export interface StixKillChainPhase {
  kill_chain_name: string;
  phase_name: string;
}

export interface StixBaseObject {
  type: string;
  id: string;
  created?: string;
  modified?: string;
  name?: string;
  description?: string;
  revoked?: boolean;
  x_mitre_deprecated?: boolean;
  external_references?: StixExternalReference[];
  created_by_ref?: string;
  [key: string]: any;
}

export interface StixBundle {
  type: 'bundle';
  id: string;
  spec_version?: string;
  objects: StixBaseObject[];
}

export interface MitreAttackIndexVersion {
  version: string;
  url: string;
  modified: string;
}

export interface MitreAttackIndexCollection {
  id: string;
  name?: string;
  description?: string;
  created?: string;
  modified?: string;
  versions: MitreAttackIndexVersion[];
}

export interface MitreAttackIndex {
  id: string;
  name: string;
  description?: string;
  created?: string;
  modified?: string;
  collections: MitreAttackIndexCollection[];
}

export interface DiscoveredEnterpriseRelease {
  version: string;
  url: string;
  modified: string;
  collectionId: string;
}

// Normalized input structures
export interface NormalizedMitreTactic {
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  shortName?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  sourceCreatedByRef?: string;
}

export interface NormalizedMitreTechnique {
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  isSubtechnique: boolean;
  parentAttackId?: string;
  parentStixId?: string;
  platforms: string[];
  killChainPhases: StixKillChainPhase[];
  permissionsRequired?: string[];
  effectivePermissions?: string[];
  defenseBypassed?: string[];
  dataSources?: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
}

export interface NormalizedMitreMitigation {
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
}

export interface NormalizedMitreGroup {
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  aliases: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
}

export interface NormalizedMitreSoftware {
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  softwareType: 'MALWARE' | 'TOOL' | 'OTHER';
  aliases: string[];
  platforms?: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
}

export interface NormalizedMitreRelationship {
  stixRelationshipId: string;
  relationshipType: string;
  sourceStixId: string;
  targetStixId: string;
  sourceType?: string;
  targetType?: string;
  description?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
}

export interface NormalizedTacticTechnique {
  tacticAttackId?: string;
  tacticShortName?: string;
  techniqueStixId: string;
  techniqueAttackId: string;
  source: string;
}

// Stored Database Entities
export interface StoredMitreRelease {
  id: string;
  domain: string;
  attackVersion: string;
  releaseDate?: string;
  sourceUrl: string;
  sourceRecordId?: string;
  bundleHash: string;
  isCurrent: boolean;
  firstIngestedAt: string;
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreTactic {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  shortName?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  sourceCreatedByRef?: string;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreTechnique {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  isSubtechnique: boolean;
  parentAttackId?: string;
  parentStixId?: string;
  platforms: string[];
  killChainPhases: StixKillChainPhase[];
  permissionsRequired?: string[];
  effectivePermissions?: string[];
  defenseBypassed?: string[];
  dataSources?: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreMitigation {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreGroup {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  aliases: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreSoftware {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description?: string;
  softwareType: 'MALWARE' | 'TOOL' | 'OTHER';
  aliases: string[];
  platforms?: string[];
  created?: string;
  modified?: string;
  revoked: boolean;
  deprecated: boolean;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredMitreRelationship {
  id: string;
  stixRelationshipId: string;
  relationshipType: string;
  sourceStixId: string;
  targetStixId: string;
  sourceType?: string;
  targetType?: string;
  description?: string;
  created?: string;
  modified?: string;
  revoked: boolean;
  currentReleaseId?: string;
  createdAt: string;
  updatedAt: string;
}

// Query Filters
export interface TacticsFilter {
  search?: string;
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface TechniquesFilter {
  search?: string;
  tactic?: string; // attack_id (e.g. TA0001) or short_name (e.g. initial-access)
  platform?: string;
  isSubtechnique?: boolean;
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface GroupsFilter {
  search?: string;
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface SoftwareFilter {
  search?: string;
  softwareType?: 'MALWARE' | 'TOOL' | 'OTHER';
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface MitigationsFilter {
  search?: string;
  includeRetired?: boolean;
  page?: number;
  limit?: number;
}

export interface MitreAttackStatusResponse {
  enabled: boolean;
  domain: string;
  currentVersion: string | null;
  releaseDate: string | null;
  lastSuccessfulSync: any;
  latestRun: any;
  bundleHash: string | null;
  dataAgeHours: number | null;
  isStale: boolean;
  staleThresholdHours: number;
  counts: {
    tactics: number;
    techniques: number;
    subtechniques: number;
    mitigations: number;
    groups: number;
    software: number;
    relationships: number;
    retired: number;
    deprecated: number;
  };
}

export interface MitreAttackSyncResult {
  runId: string;
  status: string;
  syncType: string;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorCount: number;
  errorMessage?: string;
  durationMs: number;
  version: string;
  releaseDate?: string;
  bundleHash: string;
  counts: {
    tactics: number;
    techniques: number;
    subtechniques: number;
    mitigations: number;
    groups: number;
    software: number;
    relationships: number;
    retired: number;
    unknownTypes: number;
  };
}
