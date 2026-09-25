export interface NvdStatusResponse {
  enabled: boolean;
  sourceUrl?: string;
  lastSyncAt: string | null;
  lastSuccessfulRun?: {
    status: string;
    recordsInserted?: number;
    recordsReceived?: number;
  } | null;
  latestRun?: {
    status: string;
  } | null;
  dataAgeHours?: number | null;
  isStale?: boolean;
  staleThresholdHours?: number;
}

export interface CisaKevStatusResponse {
  enabled: boolean;
  sourceUrl: string;
  lastSyncAt: string | null;
  lastSuccessfulRun?: any;
  latestRun?: any;
  totalActiveKevCount?: number;
  dataAgeHours?: number | null;
  isStale?: boolean;
  staleThresholdHours?: number;
}

export interface CisaKevSyncResponse {
  runId: string;
  status: string;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  durationMs: number;
  catalogTitle: string;
  catalogVersion: string;
  dateReleased: string;
  officialCount: number;
}

export interface VulnerabilityListItem {
  cveId: string;
  description: string | null;
  publishedAt: string | null;
  lastModifiedAt: string | null;
  cvss: {
    baseScore: number;
    severity: string | null;
    version: string | null;
    attackVector: string | null;
  } | null;
  knownExploited: boolean;
  ransomwareCampaignUse: string | null;
  source: {
    identifier: string | null;
    provider: string | null;
  };
  kev: {
    dateAdded: string | null;
    dueDate: string | null;
    requiredAction: string | null;
  } | null;
}

export interface VulnerabilityListResponse {
  data: VulnerabilityListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface VulnerabilityDetailResponse {
  id: string;
  cveId: string;
  description?: string;
  sourceIdentifier?: string;
  vulnStatus?: string;
  cvssVersion?: string;
  cvssBaseScore?: number;
  cvssBaseSeverity?: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  publishedAt?: string;
  modifiedAt?: string;
  source: string;
  sourceRecordId: string;
  rawRecordId?: string;
  createdAt: string;
  updatedAt: string;

  knownExploited: boolean;
  kevDateAdded?: string | null;
  kevDueDate?: string | null;
  kevKnownRansomwareCampaignUse?: string | null;
  kevDetails?: {
    vendorProject?: string | null;
    product?: string | null;
    vulnerabilityName?: string | null;
    dateAdded?: string | null;
    dueDate?: string | null;
    requiredAction?: string | null;
    knownRansomwareCampaignUse?: string | null;
    notes?: string | null;
    isCurrent: boolean;
  } | null;
  kevProvenance?: {
    sourceName: string;
    sourceProvider: string;
    rawPayloadHash?: string;
    ingestedAt?: string;
  } | null;

  cvssAssessments?: any[];
  weaknesses?: { cweId: string; description?: string }[];
  references?: { url: string; source?: string; tags?: string[] }[];
  cpes?: {
    criteria: string;
    vulnerable: boolean;
    versionStartIncluding?: string;
    versionStartExcluding?: string;
    versionEndIncluding?: string;
    versionEndExcluding?: string;
  }[];
  provenance?: {
    sourceName: string;
    sourceProvider: string;
    rawPayloadHash?: string;
    ingestedAt?: string;
  };
}

export interface AssetResponse {
  id: string;
  organizationId: string;
  businessUnitId: string | null;
  assetIdentifier: string | null;
  name: string;
  hostname: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  assetType: string;
  operatingSystem: string | null;
  environment: string;
  owner: string | null;
  isInternetFacing: boolean;
  businessCriticality: number;
  dataClassification: string;
  revenueDependencyPct: number | null;
  operationalImportance: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AssetListResponse {
  data: AssetResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface ControlCoverageItem {
  code: string;
  name: string;
  category: string;
  defaultMitigationWeight: number;
  totalAssetsAssigned: number;
  implementedCount: number;
  partialCount: number;
  notImplementedCount: number;
  unknownCount: number;
  coveragePercentage: number;
}

export interface ControlsSummaryResponse {
  totalCatalogControls: number;
  controls: ControlCoverageItem[];
}

export interface ThreatIntelSummaryResponse {
  cisaKev: {
    activeCount: number;
    knownRansomwareCount: number;
    overdueCount: number;
    lastSyncAt: string | null;
    lastSuccessfulRun?: any;
  };
  mitreAttack: {
    domain: string;
    releaseVersion: string | null;
    releaseId: string | null;
    tacticsCount: number;
    techniquesCount: number;
    groupsCount: number;
    softwareCount: number;
    mitigationsCount: number;
    lastSyncAt: string | null;
  };
  generatedAt: string;
}

export interface ThreatIntelKevItem {
  id: string;
  cveId: string;
  vulnerabilityId: string | null;
  vendorProject: string | null;
  product: string | null;
  vulnerabilityName: string | null;
  dateAdded: string | null;
  shortDescription: string | null;
  requiredAction: string | null;
  dueDate: string | null;
  knownRansomwareCampaignUse: string | null;
  notes: string | null;
  sourceRecordId: string;
  rawRecordId: string;
  isCurrent: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  removedFromCatalogAt: string | null;
  createdAt: string;
  updatedAt: string;
  linkedNvdVulnerability: string | null;
  provenance: {
    sourceName: string;
    sourceProvider: string;
    rawPayloadHash: string | null;
    ingestedAt: string | null;
  };
}

export interface ThreatIntelKevResponse {
  data: ThreatIntelKevItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface MitreTactic {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description: string;
  shortName: string;
  created: string;
  modified: string;
  revoked: boolean;
  deprecated: boolean;
  sourceCreatedByRef: string;
  currentReleaseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MitreTacticsResponse {
  tactics: MitreTactic[];
  total: number;
}

export interface MitreTechnique {
  id: string;
  stixId: string;
  attackId: string;
  name: string;
  description: string;
  isSubtechnique: boolean;
  parentTechniqueId: string | null;
  platforms: string[];
  systemRequirements: string[];
  networkRequirements: boolean;
  permissionsRequired: string[];
  detectionRules: string | null;
  created: string;
  modified: string;
  revoked: boolean;
  deprecated: boolean;
  sourceCreatedByRef: string;
  currentReleaseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MitreTechniquesResponse {
  techniques: MitreTechnique[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

