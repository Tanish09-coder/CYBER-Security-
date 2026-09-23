export interface VerisActorDimension {
  actorCategory: 'External' | 'Internal' | 'Partner' | 'Unknown';
  actorSubtype?: string;
  motive?: string;
  country?: string;
  sourcePath?: string;
}

export interface VerisActionDimension {
  actionCategory:
    | 'Hacking'
    | 'Malware'
    | 'Social'
    | 'Misuse'
    | 'Physical'
    | 'Error'
    | 'Environmental'
    | 'Unknown';
  actionSubtype?: string;
  vector?: string;
  variety?: string;
}

export interface VerisAssetDimension {
  assetCategory: 'Server' | 'Network' | 'User Device' | 'Media' | 'Person' | 'Unknown';
  assetVariety?: string;
  amount?: number;
}

export interface VerisAttributeDimension {
  attributeCategory: 'Confidentiality' | 'Integrity' | 'Availability';
  variety?: string;
  dataVariety?: string;
  recordCount?: number;
}

export interface VerisTimeline {
  incidentYear?: number;
  incidentMonth?: number;
  incidentDay?: number;
  compromiseUnit?: string;
  compromiseValue?: number;
  discoveryUnit?: string;
  discoveryValue?: number;
  containmentUnit?: string;
  containmentValue?: number;
  exfiltrationUnit?: string;
  exfiltrationValue?: number;
}

export interface VerisExplicitCve {
  cveId: string;
  evidenceSource: string; // e.g. action.hacking.cve, action.malware.cve
  sourcePath?: string;
}

export interface NormalizedVcdbIncident {
  vcdbId: string;
  sourceFilePath?: string;
  incidentYear?: number;
  securityIncident?: string;
  confidence?: string;
  summary?: string;
  victimCountry?: string;
  victimIndustry?: string;
  employeeCount?: string;
  dataDisclosure?: string;
  discoveryMethod?: string;
  schemaVersion?: string;
  rawRecord?: any;
  payloadHash: string;

  actors: VerisActorDimension[];
  actions: VerisActionDimension[];
  assets: VerisAssetDimension[];
  attributes: VerisAttributeDimension[];
  timeline?: VerisTimeline;
  explicitCves: VerisExplicitCve[];
}

export interface StoredVcdbIncident {
  id: string;
  vcdbId: string;
  sourceRecordId?: string;
  sourceFilePath?: string;
  incidentYear?: number;
  securityIncident?: string;
  confidence?: string;
  summary?: string;
  victimCountry?: string;
  victimIndustry?: string;
  employeeCount?: string;
  dataDisclosure?: string;
  discoveryMethod?: string;
  schemaVersion?: string;
  rawRecord?: any;
  payloadHash: string;
  firstSeenAt: string;
  lastSeenAt: string;
  removedFromSourceAt?: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredVcdbRelease {
  id: string;
  repositoryUrl: string;
  commitSha?: string;
  verisVersion?: string;
  bundleHash: string;
  totalIncidents: number;
  retrievedAt: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentsFilter {
  year?: number;
  country?: string;
  industry?: string;
  actor?: string;
  action?: string;
  asset?: string;
  attribute?: string;
  confidence?: string;
  securityIncident?: string;
  search?: string;
  page?: number;
  limit?: number;
  includeRemoved?: boolean;
}

export interface VcdbSyncResult {
  status: 'COMPLETED' | 'SKIPPED_IDENTICAL';
  runId: string;
  repositoryUrl: string;
  commitSha?: string;
  verisVersion?: string;
  bundleHash: string;
  totalDiscovered: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsRemovedFromSource: number;
  durationMs: number;
  counts: {
    incidents: number;
    actors: number;
    actions: number;
    assets: number;
    attributes: number;
    explicitCveLinks: number;
    unknownFields: number;
  };
  errorCount: number;
}

export interface VcdbStatus {
  enabled: boolean;
  provider: string;
  repositoryUrl: string;
  currentCommitSha?: string;
  currentVerisVersion?: string;
  lastSuccessfulSync?: string;
  dataAgeHours: number;
  staleThresholdHours: number;
  isStale: boolean;
  counts: {
    incidents: number;
    activeIncidents: number;
    actors: number;
    actions: number;
    assets: number;
    attributes: number;
    explicitCveLinks: number;
  };
}

export interface VcdbStatistics {
  byYear: Array<{ year: number; count: number }>;
  byActorCategory: Array<{ category: string; count: number }>;
  byActionCategory: Array<{ category: string; count: number }>;
  byAssetCategory: Array<{ category: string; count: number }>;
  byAttributeCategory: Array<{ category: string; count: number }>;
  byIndustry: Array<{ industry: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
}
