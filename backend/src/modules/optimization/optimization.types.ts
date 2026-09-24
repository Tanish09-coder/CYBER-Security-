// =============================================================================
// CyberRiskOS — Investment Optimization Domain Types & DTO Contracts
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// =============================================================================

export type OptimizationObjective =
  | 'MAX_MODELED_RISK_REDUCTION'
  | 'MAX_MODELED_EAL_REDUCTION'
  | 'MAX_ROSI';

export type OptimizationStrategyType =
  | 'MAX_MODELED_RISK_REDUCTION'
  | 'MAX_MODELED_EAL_REDUCTION'
  | 'MAX_ROSI'
  | 'MAX_REDUCTION'
  | 'BALANCED_ROSI'
  | 'QUICK_WINS';

export interface RemediationCandidateActionDTO {
  actionId: string;
  actionType: 'PATCH_VULNERABILITY' | 'IMPLEMENT_CONTROL' | 'ISOLATE_ASSET' | 'DECOMMISSION_ASSET' | string;
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

export interface OptimizationRequestDTO {
  budgetLimit: number;
  currency?: string;
  objective?: OptimizationObjective;
  candidateActions?: RemediationCandidateActionDTO[];
  baselinePortfolioRisk?: number | null;
  baselinePortfolioEal?: number | null;
}

export interface StrategyResultDTO {
  strategyId: string;
  strategyName: string;
  strategyType: OptimizationStrategyType;
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

export interface OptimizationResultDTO {
  budgetLimit: number;
  currency: string;
  strategies: StrategyResultDTO[];
  totalCandidates: number;
  evaluatedAt: string;
  modelVersion: string;
}

export interface StrategyComparisonRequestDTO {
  budgetLimit: number;
  strategyA: StrategyResultDTO;
  strategyB: StrategyResultDTO;
}

export interface StrategyComparisonResponseDTO {
  strategyA: {
    id: string;
    name: string;
    totalCost: number;
    totalEalReduction: number;
    rosiPct?: number | null;
  };
  strategyB: {
    id: string;
    name: string;
    totalCost: number;
    totalEalReduction: number;
    rosiPct?: number | null;
  };
  costDelta: number;
  ealReductionDelta: number;
  tradeOffSummary: string;
}
