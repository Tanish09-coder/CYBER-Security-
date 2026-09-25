// =============================================================================
// CyberRiskOS — Risk Engine v1 Domain Types & DTO Contracts
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// =============================================================================

export const RISK_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN'] as const;
export type RiskSeverity = (typeof RISK_SEVERITIES)[number];

export const FACTOR_CATEGORIES = [
  'TECHNICAL_SEVERITY',
  'THREAT_INTEL',
  'BUSINESS_CONTEXT',
  'DEFENSIVE_POSTURE',
] as const;
export type FactorCategory = (typeof FACTOR_CATEGORIES)[number];

export const CONTROL_STATUSES = [
  'IMPLEMENTED',
  'PARTIAL',
  'NOT_IMPLEMENTED',
  'UNKNOWN',
] as const;
export type ControlStatus = (typeof CONTROL_STATUSES)[number];

export const CONTROL_SOURCES = [
  'USER_CONFIG',
  'SCANNER_IMPORT',
  'AUDIT_VERIFIED',
] as const;
export type ControlSource = (typeof CONTROL_SOURCES)[number];

// -----------------------------------------------------------------------------
// Input DTOs
// -----------------------------------------------------------------------------

export interface ControlContextDTO {
  controlCode: string;
  status: ControlStatus;
  source?: ControlSource;
}

export interface VulnerabilityRiskInputDTO {
  cveId: string;
  cvssScore: number | null;
  cvssVersion?: string | null;
  isKnownExploited: boolean;
  knownRansomwareCampaignUse?: string | null;
  sourceIdentifier?: string | null;
}

export interface AssetRiskInputDTO {
  assetId: string;
  assetName: string;
  criticalityTier?: 1 | 2 | 3 | 4 | 5 | null;
  isInternetFacing?: boolean | null;
  businessUnitId?: string | null;
  businessUnitName?: string | null;
  controls?: ControlContextDTO[] | null;
}

export interface RiskEvaluationInputDTO {
  asset: AssetRiskInputDTO;
  vulnerability: VulnerabilityRiskInputDTO;
}

export interface BatchRiskEvaluationInputDTO {
  evaluations: RiskEvaluationInputDTO[];
}

// -----------------------------------------------------------------------------
// Output DTOs
// -----------------------------------------------------------------------------

export interface FactorExplanationDTO {
  name: string;
  category: FactorCategory;
  value: string | number | boolean | null;
  weight: number;
  contribution: number | null;
  rationale: string;
}

export interface RiskEvaluationResultDTO {
  assetId: string;
  assetName?: string;
  cveId: string;
  baseCvss: number | null;
  riskScore: number | null; // 0.0 to 100.0 (API alias: score, null if NOT_CALCULABLE)
  evaluationStatus?: 'CALCULATED' | 'NOT_CALCULABLE' | 'INCOMPLETE';
  severity: RiskSeverity; // API alias: level
  factors: FactorExplanationDTO[];
  missingDataWarnings: string[];
  dataCompletenessScore: number; // 0.0 to 1.0 — STRUCTURAL: schema fields populated
  controlAssessmentCoverage?: number | null; // 0.0 to 1.0 — EVIDENCE: non-UNKNOWN controls / total; null = no controls registered
  riskFlags: string[];
  modelVersion: string; // "1.0.0"
  provenanceHash: string;
  evaluatedAt: string;
  isCached?: boolean;
}

export interface BatchRiskEvaluationResultDTO {
  results: RiskEvaluationResultDTO[];
  totalEvaluated: number;
  modelVersion: string;
}

// -----------------------------------------------------------------------------
// Public API Response DTOs (Clean abstractions without raw DB internals)
// -----------------------------------------------------------------------------

export interface RiskScoreItemDTO {
  id: string;
  assetId: string;
  assetName?: string;
  cveId: string;
  score: number | null;
  level: RiskSeverity;
  baseCvss: number | null;
  modelVersion: string;
  inputProvenanceHash: string;
  dataCompleteness: number; // STRUCTURAL: schema fields populated
  controlAssessmentCoverage?: number | null; // EVIDENCE: non-UNKNOWN controls / total
  factors: FactorExplanationDTO[];
  missingDataWarnings: string[];
  riskFlags: string[];
  evaluatedAt: string;
  isCached?: boolean;
  // Documented compatibility aliases
  riskScore?: number | null;
  severity?: RiskSeverity;
  dataCompletenessScore?: number;
  provenanceHash?: string;
}

export interface PaginatedRiskScoresResponseDTO {
  items: RiskScoreItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssetRiskProfileDTO {
  assetId: string;
  totalVulnerabilitiesEvaluated: number;
  highestScore: number;
  highestLevel: RiskSeverity;
  averageScore: number;
  levelDistribution: Record<RiskSeverity, number>;
  evaluations: RiskScoreItemDTO[];
}

export interface VulnerabilityImpactDTO {
  cveId: string;
  totalAssetsAffected: number;
  highestScore: number;
  highestLevel: RiskSeverity;
  averageScore: number;
  levelDistribution: Record<RiskSeverity, number>;
  evaluations: RiskScoreItemDTO[];
}

// -----------------------------------------------------------------------------
// Query & Database Types
// -----------------------------------------------------------------------------

export interface RiskScoreQueryParams {
  page?: number;
  limit?: number;
  assetId?: string;
  cveId?: string;
  level?: RiskSeverity;
  severity?: RiskSeverity; // Alias for level
  minScore?: number;
  maxScore?: number;
  modelVersion?: string;
  organizationId?: string;
}

export interface StoredRiskResultRecord {
  id: string;
  organization_id: string | null;
  asset_id: string;
  vulnerability_id: string | null;
  cve_id: string;
  score: number | null;
  level: RiskSeverity;
  base_cvss: number | null;
  model_version: string;
  input_provenance_hash: string;
  data_completeness: number;
  factors: FactorExplanationDTO[];
  missing_data_warnings: string[];
  risk_flags: string[];
  snapshot_metadata: Record<string, any>;
  evaluated_at: string;
  created_at: string;
  updated_at: string;
}

// Alias for backwards-compatibility
export type StoredRiskScoreRecord = StoredRiskResultRecord;
