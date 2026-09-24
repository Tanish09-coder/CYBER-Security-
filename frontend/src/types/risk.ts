export interface ControlState {
  control_code: string;
  status: string;
  effectiveness_score: number;
  mitigation_weight: number;
}

export interface VulnerabilityState {
  cve_id: string;
  cvss_score: number;
  is_kev: boolean;
  exploit_status?: string | null;
  patch_available: boolean;
}

export interface FinancialParameters {
  hourly_downtime_cost: number;
  hourly_recovery_rate: number;
  cost_per_sensitive_record: number;
  regulatory_breach_penalty: number;
  daily_transaction_volume: number;
}

export interface AssetProfile {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  business_unit: string;
  criticality_tier: number;
  is_internet_facing: boolean;
  data_classification: string;
  revenue_dependency_pct: number;
  operational_importance_score: number;
  controls: ControlState[];
  vulnerabilities: VulnerabilityState[];
  upstream_dependencies: string[];
}

export interface RiskDriverExplanation {
  driver_name: string;
  weight_percentage: number;
  impact_level: string;
}

export interface AssetRiskResult {
  asset_id: string;
  asset_name: string;
  incident_probability: number;
  single_loss_expectancy: number;
  modeled_annual_exposure: number;
  risk_tier: string;
  risk_drivers: RiskDriverExplanation[];
}

export interface RiskCalculationRequest {
  organization_id: string;
  financial_parameters: FinancialParameters;
  assets: AssetProfile[];
}

export interface RiskCalculationResponse {
  organization_id: string;
  total_modeled_annual_exposure: number;
  currency: string;
  evaluated_asset_count: number;
  asset_results: AssetRiskResult[];
  highest_exposure_asset_id: string;
}

// --- Simulation DTOs ---

export interface SimulationIntervention {
  action_type: string;
  target_asset_id?: string | null;
  target_control_code?: string | null;
  target_cve_id?: string | null;
  delay_days?: number | null;
}

export interface WhatIfSimulationRequest {
  organization_id: string;
  baseline_request: RiskCalculationRequest;
  interventions: SimulationIntervention[];
}

export interface WhatIfSimulationResponse {
  organization_id: string;
  baseline_exposure: number;
  simulated_exposure: number;
  modeled_risk_reduction: number;
  modeled_reduction_percentage: number;
  affected_assets: string[];
}

// --- Optimization DTOs ---

export interface SecurityInitiative {
  initiative_id: string;
  name: string;
  cost: number;
  affected_asset_ids: string[];
  target_control_code: string;
  target_control_status: string;
}

export interface OptimizerRequest {
  organization_id: string;
  available_budget: number;
  baseline_request: RiskCalculationRequest;
  candidate_initiatives: SecurityInitiative[];
}

export interface InvestmentStrategyOption {
  strategy_label: string;
  total_cost: number;
  modeled_exposure_reduction: number;
  residual_exposure: number;
  rosi_percentage: number;
  selected_initiative_ids: string[];
}

export interface OptimizerResponse {
  organization_id: string;
  available_budget: number;
  strategies: InvestmentStrategyOption[];
  diminishing_returns_curve: Record<string, number>[];
}
