// =============================================================================
// CyberRiskOS — What-If Simulation Engine Domain Types & DTO Contracts
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// Rationale:
// - Stateless, in-memory scenario simulation comparing baseline vs hypothetical postures
// - Strictly ZERO database mutations
// =============================================================================

export type ScenarioActionType =
  | 'PATCH_VULNERABILITY'
  | 'IMPLEMENT_CONTROL'
  | 'ISOLATE_ASSET'
  | 'DECOMMISSION_ASSET';

export interface ScenarioActionDTO {
  actionType: ScenarioActionType;
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

export interface ScenarioSimulationRequestDTO {
  scenarioName?: string;
  actions: ScenarioActionDTO[];
  assetId?: string; // Optional: target single asset
  baselineRiskInputs?: any[];
  baselineFinancialInputs?: any[];
}

export interface ScenarioSimulationResultDTO {
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

export interface ScenarioPresetDTO {
  id: string;
  name: string;
  description: string;
  category: 'VULNERABILITY_PATCHING' | 'PERIMETER_DEFENSE' | 'CONTROLS_ENFORCEMENT';
  actions: ScenarioActionDTO[];
}
