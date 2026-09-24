export type ExplanationRequestType = 'EXPLAIN_RISK' | 'EXPLAIN_FINANCIAL' | 'COMPARE_STRATEGIES';

export type ExplanationStatus =
  | 'TEMPLATE_GENERATED'
  | 'AI_GENERATED'
  | 'GROUNDING_FAILED'
  | 'PROVIDER_ERROR'
  | 'AI_UNAVAILABLE';

export interface RiskExplanationRequestDTO {
  riskResultId?: string;
  assetId?: string;
  cveId?: string;
}

export interface FinancialExplanationRequestDTO {
  financialResultId?: string;
  assetId?: string;
  cveId?: string;
  currency?: string;
}

export interface StrategyComparisonRequestDTO {
  optimizationResultId?: string;
  strategyIds?: string[];
  budgetLimit?: number;
  currency?: string;
  candidateActions?: any[];
}

export interface GroundingViolationDTO {
  field: string;
  expectedValue: number;
  tolerancePct: number;
  note: string;
}

export interface StructuredClaimDTO {
  sourceField: string;
  claimedValue: number | string | null;
  isVerified: boolean;
  expectedValue?: number | string | null;
  note?: string;
}

export interface GroundingValidationDTO {
  passed: boolean;
  anchorCount: number;
  verifiedCount: number;
  violations: GroundingViolationDTO[];
  structuredClaims?: StructuredClaimDTO[];
  validationNote: string;
}

export interface AIExplanationResponseDTO {
  requestType: ExplanationRequestType;
  explanationStatus: ExplanationStatus;
  explanation: string;
  groundingValidation: GroundingValidationDTO;
  promptGroundingCitation: string;
  aiProvider: string;
  modelVersion: string;
  generatedAt: string;
  warnings: string[];
  integrationStatus?: string;
}
