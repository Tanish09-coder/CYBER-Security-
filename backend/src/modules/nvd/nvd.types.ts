// =============================================================================
// NVD API v2.0 TypeScript Definitions & Error Classes
// Reference: https://services.nvd.nist.gov/rest/json/cves/2.0
// =============================================================================

export interface NvdDescription {
  lang: string;
  value: string;
}

export interface CvssDataV40 {
  version: string;
  vectorString: string;
  baseScore: number;
  baseSeverity: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
}

export interface CvssMetricV40 {
  source: string;
  type: string;
  cvssData: CvssDataV40;
}

export interface CvssDataV3 {
  version: string;
  vectorString: string;
  baseScore: number;
  baseSeverity: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
}

export interface CvssMetricV3 {
  source: string;
  type: string;
  cvssData: CvssDataV3;
}

export interface CvssDataV2 {
  version: string;
  vectorString: string;
  baseScore: number;
  accessVector?: string;
  accessComplexity?: string;
  authentication?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
}

export interface CvssMetricV2 {
  source: string;
  type: string;
  cvssData: CvssDataV2;
  baseSeverity?: string;
}

export interface NvdMetrics {
  cvssMetricV40?: CvssMetricV40[];
  cvssMetricV31?: CvssMetricV3[];
  cvssMetricV30?: CvssMetricV3[];
  cvssMetricV2?: CvssMetricV2[];
}

export interface NvdWeakness {
  source: string;
  type: string;
  description: { lang: string; value: string }[];
}

export interface NvdCpeMatch {
  vulnerable: boolean;
  criteria: string;
  matchCriteriaId?: string;
  versionStartIncluding?: string;
  versionStartExcluding?: string;
  versionEndIncluding?: string;
  versionEndExcluding?: string;
}

export interface NvdConfigurationNode {
  operator: string;
  negate?: boolean;
  cpeMatch: NvdCpeMatch[];
}

export interface NvdConfiguration {
  nodes: NvdConfigurationNode[];
}

export interface NvdReference {
  url: string;
  source?: string;
  tags?: string[];
}

export interface NvdCveItem {
  id: string;
  sourceIdentifier: string;
  published: string;
  lastModified: string;
  vulnStatus?: string;
  descriptions: NvdDescription[];
  metrics?: NvdMetrics;
  weaknesses?: NvdWeakness[];
  configurations?: NvdConfiguration[];
  references?: NvdReference[];
}

export interface NvdVulnerabilityWrapper {
  cve: NvdCveItem;
}

export interface NvdApiResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  format: string;
  version: string;
  timestamp: string;
  vulnerabilities: NvdVulnerabilityWrapper[];
}

export interface NvdQueryParams {
  cveId?: string;
  pubStartDate?: string;
  pubEndDate?: string;
  lastModStartDate?: string;
  lastModEndDate?: string;
  startIndex?: number;
  resultsPerPage?: number;
}

// =============================================================================
// Safe Domain Error Classes
// =============================================================================

export class NvdRateLimitError extends Error {
  constructor(message: string = 'NVD API Rate Limit Exceeded') {
    super(message);
    this.name = 'NvdRateLimitError';
  }
}

export class NvdUnavailableError extends Error {
  constructor(message: string = 'NVD API Unavailable') {
    super(message);
    this.name = 'NvdUnavailableError';
  }
}

export class NvdInvalidRequestError extends Error {
  constructor(message: string = 'Invalid Request to NVD API') {
    super(message);
    this.name = 'NvdInvalidRequestError';
  }
}

export class NvdTimeoutError extends Error {
  constructor(message: string = 'NVD API Request Timed Out') {
    super(message);
    this.name = 'NvdTimeoutError';
  }
}

export class IngestionPersistenceError extends Error {
  constructor(message: string = 'Failed to persist ingestion records') {
    super(message);
    this.name = 'IngestionPersistenceError';
  }
}
