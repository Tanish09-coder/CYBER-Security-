export interface RiskFactor {
  name: string;
  category: string;
  value: string | number | boolean | null;
  weight: number;
  contribution: number | null;
  rationale: string;
}

export interface AssetRiskResult {
  assetId: string;
  assetName?: string;
  cveId: string;
  baseCvss: number | null;
  riskScore: number | null;
  evaluationStatus?: 'CALCULATED' | 'NOT_CALCULABLE' | 'INCOMPLETE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  factors: RiskFactor[];
  missingDataWarnings: string[];
  dataCompletenessScore: number;
  riskFlags: string[];
  modelVersion: string;
  provenanceHash: string;
  evaluatedAt: string;
  isCached?: boolean;
}

export interface RiskCalculationResponse {
  items: AssetRiskResult[];
  data: AssetRiskResult[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Simulation DTOs ---

export interface ScenarioActionDTO {
  actionType: 'PATCH_VULNERABILITY' | 'IMPLEMENT_CONTROL' | 'ISOLATE_ASSET' | 'DECOMMISSION_ASSET';
  targetAssetId: string;
  targetCveId?: string;
  controlCode?: string;
  description?: string;
}

export interface ActionImpactDTO {
  actionType: string;
  targetAssetId: string;
  targetCveId?: string;
  riskScoreReduction: number;
  ealReduction: number | null;
  currency: string;
  summary: string;
}

export interface WhatIfSimulationRequest {
  scenarioName?: string;
  actions: ScenarioActionDTO[];
  assetId?: string; 
}

export interface WhatIfSimulationResponse {
  scenarioName: string;
  baselineAvgRiskScore: number;
  simulatedAvgRiskScore: number;
  riskScoreDelta: number;
  riskReductionPct: number;
  baselineTotalEal: number | null;
  simulatedTotalEal: number | null;
  ealDelta: number | null;
  ealReductionPct: number | null;
  ealStatus?: 'CALCULATED' | 'NOT_AVAILABLE';
  currency: string;
  totalActionsApplied: number;
  actionImpacts: ActionImpactDTO[];
  modelVersion: string;
  isSimulation: boolean;
  simulatedAt: string;
}

// --- Optimization DTOs ---

export interface RemediationCandidateActionDTO {
  actionId: string;
  actionType: string;
  targetAssetId: string;
  targetCveId?: string | null;
  controlCode?: string | null;
  cost: number;
  estimatedRiskReduction: number;
  estimatedEalReduction: number;
  dependencies?: string[];
  conflictsWith?: string[];
  title: string;
  description?: string | null;
}

export interface OptimizerRequest {
  budgetLimit: number;
  currency?: string;
  objective?: 'MAX_MODELED_RISK_REDUCTION' | 'MAX_MODELED_EAL_REDUCTION' | 'MAX_ROSI';
  candidateActions?: RemediationCandidateActionDTO[];
}

export interface StrategyResultDTO {
  strategyId: string;
  strategyName: string;
  strategyType: string;
  description: string;
  selectedActions: RemediationCandidateActionDTO[];
  totalCost: number;
  remainingBudget: number;
  totalRiskReduction: number;
  totalEalReduction: number;
  simulatedPortfolioRisk?: number | null;
  simulatedPortfolioEal?: number | null;
  netFinancialBenefit: number;
  rosiPct?: number | null;
  rosiRatio?: number | null;
  actionCount: number;
}

export interface OptimizerResponse {
  budgetLimit: number;
  currency: string;
  strategies: StrategyResultDTO[];
  totalCandidates: number;
  evaluatedAt: string;
  modelVersion: string;
}

// --- Financial Exposure DTOs ---

export interface FinancialFactorExplanationDTO {
  name: string;
  category: string;
  value: string | number | boolean | null;
  amount: number;
  rationale: string;
}

export interface FinancialExposureResultDTO {
  assetId: string;
  assetName: string;
  cveId: string;
  sle: number | null; 
  sleStatus?: 'CALCULATED' | 'NOT_AVAILABLE';
  alef: number | null; 
  eal: number | null; 
  ealStatus: 'CALCULATED' | 'NOT_AVAILABLE';
  currency: string;
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

export interface FinancialExposureResponse {
  items: FinancialExposureResultDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
