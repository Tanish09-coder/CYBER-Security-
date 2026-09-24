// =============================================================================
// CyberRiskOS — Financial Exposure & EAL Domain Types & DTO Contracts
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Migration: 015_financial_results.sql
// =============================================================================

export interface FinancialFactorExplanationDTO {
  name: string;
  category: string;
  value: string | number | boolean | null;
  amount: number;
  rationale: string;
}

export interface FinancialAssetInputDTO {
  assetId: string;
  assetName: string;
  criticalityTier: 1 | 2 | 3 | 4 | 5;
  isInternetFacing: boolean;
  hourlyDowntimeCost?: number | null;
  recoveryCost?: number | null;
  estimatedOutageHours?: number | null;
  annualizedLossEventFrequency?: number | null;
  currency?: string | null;
}

export interface FinancialVulnerabilityInputDTO {
  cveId: string;
  cvssScore?: number | null;
  availabilityImpact?: 'HIGH' | 'LOW' | 'NONE' | string | null;
  scope?: 'UNCHANGED' | 'CHANGED' | string | null;
  isKnownExploited: boolean;
  knownRansomwareCampaignUse?: string | null;
  annualizedLossEventFrequency?: number | null;
}

export interface FinancialExposureInputDTO {
  asset: FinancialAssetInputDTO;
  vulnerability: FinancialVulnerabilityInputDTO;
}

export interface BatchFinancialExposureInputDTO {
  evaluations: FinancialExposureInputDTO[];
}

export interface FinancialExposureResultDTO {
  assetId: string;
  assetName: string;
  cveId: string;
  sle: number | null; // Single Loss Expectancy in fiat currency (null if incomplete)
  sleStatus?: 'CALCULATED' | 'NOT_AVAILABLE';
  alef: number | null; // Annual Loss Event Frequency (null if unconfigured)
  eal: number | null; // Estimated Annualized Loss (null if ALEF or SLE unconfigured)
  ealStatus: 'CALCULATED' | 'NOT_AVAILABLE';
  currency: string | null;
  primaryLoss: number | null;
  secondaryLoss: number | null;
  estimatedOutageHours: number | null;
  hourlyDowntimeRate: number | null;
  recoveryCost: number | null;
  factors: FinancialFactorExplanationDTO[];
  missingDataWarnings: string[];
  dataCompletenessScore: number;
  modelVersion: string;
  provenanceHash: string;
  isEstimated: boolean;
  evaluatedAt: string;
  isCached?: boolean;
}

export interface BatchFinancialExposureResultDTO {
  results: FinancialExposureResultDTO[];
  totalEvaluated: number;
  totalModeledEal: number | null;
  availableEalCount?: number;
  currency: string | null;
  modelVersion: string;
}

export interface FinancialExposureQueryParams {
  page?: number;
  limit?: number;
  assetId?: string;
  cveId?: string;
  minEal?: number;
  maxEal?: number;
  modelVersion?: string;
  organizationId?: string;
}

export interface StoredFinancialResultRecord {
  id: string;
  organization_id: string | null;
  asset_id: string;
  vulnerability_id: string | null;
  cve_id: string;
  sle: number | null;
  sle_status?: string;
  alef: number | null;
  eal: number | null;
  eal_status: string;
  currency: string | null;
  primary_loss: number | null;
  secondary_loss: number | null;
  estimated_outage_hours: number | null;
  hourly_downtime_rate: number | null;
  recovery_cost: number | null;
  factors: FinancialFactorExplanationDTO[];
  missing_data_warnings: string[];
  data_completeness: number;
  model_version: string;
  input_provenance_hash: string;
  is_estimated: boolean;
  evaluated_at: string;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseFinancialSummaryDTO {
  totalModeledEal: number;
  currency: string | null;
  totalEvaluatedAssets: number;
  totalEvaluatedVulnerabilities: number;
  highestEalAsset: {
    assetId: string;
    assetName: string;
    eal: number;
  } | null;
  topLossDrivers: FinancialExposureResultDTO[];
  isEstimated: boolean;
}
