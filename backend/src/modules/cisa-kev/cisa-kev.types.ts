// =============================================================================
// CISA Known Exploited Vulnerabilities (KEV) TypeScript Definitions
// Official Catalog Feed: https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
// =============================================================================

export interface CisaKevItem {
  cveID: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
}

export interface CisaKevCatalogResponse {
  title?: string;
  catalogVersion?: string;
  dateReleased?: string;
  count?: number;
  vulnerabilities: CisaKevItem[];
}

export interface CisaKevSyncResult {
  runId: string;
  status: string;
  syncType: any;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorCount: number;
  errorMessage?: string;
  durationMs: number;
  catalogTitle?: string;
  catalogVersion?: string;
  dateReleased?: string;
  officialCount?: number;
}

export interface NormalizedCisaKevEntry {
  cveId: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
  notes?: string;
  sourceRecordId: string;
}

export interface StoredCisaKevEntry {
  id: string;
  cveId: string;
  vulnerabilityId?: string | null;
  vendorProject?: string | null;
  product?: string | null;
  vulnerabilityName?: string | null;
  dateAdded?: string | null;
  shortDescription?: string | null;
  requiredAction?: string | null;
  dueDate?: string | null;
  knownRansomwareCampaignUse?: string | null;
  notes?: string | null;
  sourceRecordId: string;
  rawRecordId?: string | null;
  isCurrent: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  removedFromCatalogAt?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedNvdVulnerability?: any;
  provenance?: {
    sourceName: string;
    sourceProvider: string;
    rawPayloadHash?: string;
    ingestedAt?: string;
  };
}

export interface CisaKevStatusResponse {
  enabled: boolean;
  sourceUrl: string;
  lastSyncAt: string | null;
  lastSuccessfulRun: any;
  latestRun: any;
  totalActiveKevCount: number;
  dataAgeHours: number | null;
  isStale: boolean;
  staleThresholdHours: number;
}

// =============================================================================
// Safe Domain Error Classes
// =============================================================================

export class CisaKevUnavailableError extends Error {
  constructor(message: string = 'CISA KEV Source Unavailable') {
    super(message);
    this.name = 'CisaKevUnavailableError';
  }
}

export class CisaKevInvalidPayloadError extends Error {
  constructor(message: string = 'Invalid CISA KEV Payload Received') {
    super(message);
    this.name = 'CisaKevInvalidPayloadError';
  }
}

export class CisaKevTimeoutError extends Error {
  constructor(message: string = 'CISA KEV Request Timed Out') {
    super(message);
    this.name = 'CisaKevTimeoutError';
  }
}

export class CisaKevPersistenceError extends Error {
  constructor(message: string = 'Failed to persist CISA KEV records') {
    super(message);
    this.name = 'CisaKevPersistenceError';
  }
}
