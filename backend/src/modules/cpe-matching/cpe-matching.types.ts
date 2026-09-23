// =============================================================================
// CyberRiskOS — CPE Matching & Asset Vulnerability Correlation Types
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

// ---------------------------------------------------------------------------
// Match Status Constants (Strict Terminology Rule)
// ---------------------------------------------------------------------------

export const MATCH_STATUSES = [
  'POTENTIAL_VULNERABILITY_MATCH',
  'INVESTIGATING',
  'MITIGATED',
  'FALSE_POSITIVE',
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

// ---------------------------------------------------------------------------
// Stored Database Row Type
// ---------------------------------------------------------------------------

export interface StoredAssetVulnerability {
  id: string;
  asset_id: string;
  software_id: string | null;
  vulnerability_id: string;
  cve_id: string;
  cpe_criteria_id: string | null;
  match_confidence: string; // NUMERIC returned as string
  match_type: string;
  match_reason: string;
  status: MatchStatus;
  matched_at: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// CPE Parsing & Evaluation Types
// ---------------------------------------------------------------------------

export interface ParsedCpe23 {
  part: 'a' | 'o' | 'h' | string;
  vendor: string;
  product: string;
  version: string;
  update: string;
  edition: string;
  language: string;
  sw_edition: string;
  target_sw: string;
  target_hw: string;
  other: string;
}

export interface VulnerabilityCpeRecord {
  id: string;
  vulnerability_id: string;
  criteria: string;
  vulnerable: boolean;
  version_start_including: string | null;
  version_start_excluding: string | null;
  version_end_including: string | null;
  version_end_excluding: string | null;
  cve_id: string;
}

export interface MatchEvaluationResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
  matchType: string;
}

// ---------------------------------------------------------------------------
// API DTOs
// ---------------------------------------------------------------------------

export interface EvaluateMatchingRequest {
  asset_id?: string;
  organization_id?: string;
}

export interface EvaluateMatchingResponse {
  message: string;
  evaluatedAssets: number;
  evaluatedPackages: number;
  matchedVulnerabilities: number;
  newMatches: number;
}

export interface CorrelatedVulnerabilityResponse {
  id: string;
  assetId: string;
  softwareId: string | null;
  vulnerabilityId: string;
  cveId: string;
  matchConfidence: number;
  matchType: string;
  matchReason: string;
  status: MatchStatus;
  matchedAt: string;
  // Vulnerability details
  description: string | null;
  cvssScore: number | null;
  cvssSeverity: string | null;
  attackVector: string | null;
  isKev: boolean;
  kevDueDate: string | null;
  ransomwareCampaignUse: string | null;
  // Software details
  softwareVendor: string | null;
  softwareProduct: string | null;
  softwareVersion: string | null;
}
