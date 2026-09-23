from typing import List, Optional, Dict
from pydantic import BaseModel, Field

# =============================================================================
# Structural Contracts for CyberRiskOS Risk Engine
# Pure data contracts and interface schemas (no operational business logic)
# =============================================================================

class ControlState(BaseModel):
    control_code: str
    status: str = Field(..., description="Implemented | Partially Implemented | Not Implemented")
    effectiveness_score: float = Field(..., ge=0.0, le=1.0)
    mitigation_weight: float = Field(..., ge=0.0, le=1.0)

class VulnerabilityState(BaseModel):
    cve_id: str
    cvss_score: float = Field(..., ge=0.0, le=10.0)
    is_kev: bool = False
    exploit_status: Optional[str] = "Unproven"
    patch_available: bool = True

class FinancialParameters(BaseModel):
    hourly_downtime_cost: float
    hourly_recovery_rate: float
    cost_per_sensitive_record: float
    regulatory_breach_penalty: float
    daily_transaction_volume: float = 0.0

class AssetProfile(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    business_unit: str
    criticality_tier: int = Field(..., ge=1, le=5)
    is_internet_facing: bool
    data_classification: str
    revenue_dependency_pct: float = Field(..., ge=0.0, le=100.0)
    operational_importance_score: float = Field(1.0, ge=0.5, le=2.0)
    controls: List[ControlState] = []
    vulnerabilities: List[VulnerabilityState] = []
    upstream_dependencies: List[str] = []

# --- Request / Response DTOs ---

class RiskDriverExplanation(BaseModel):
    driver_name: str
    weight_percentage: float
    impact_level: str

class AssetRiskResult(BaseModel):
    asset_id: str
    asset_name: str
    incident_probability: float
    single_loss_expectancy: float
    modeled_annual_exposure: float
    risk_tier: str
    risk_drivers: List[RiskDriverExplanation]

class RiskCalculationRequest(BaseModel):
    organization_id: str
    financial_parameters: FinancialParameters
    assets: List[AssetProfile]

class RiskCalculationResponse(BaseModel):
    organization_id: str
    total_modeled_annual_exposure: float
    currency: str = "INR"
    evaluated_asset_count: int
    asset_results: List[AssetRiskResult]
    highest_exposure_asset_id: str

# --- Simulation DTOs ---

class SimulationIntervention(BaseModel):
    action_type: str = Field(..., description="ENABLE_CONTROL | PATCH_CVE | SEGMENT_NETWORK | DELAY_REMEDIATION")
    target_asset_id: Optional[str] = None
    target_control_code: Optional[str] = None
    target_cve_id: Optional[str] = None
    delay_days: Optional[int] = 0

class WhatIfSimulationRequest(BaseModel):
    organization_id: str
    baseline_request: RiskCalculationRequest
    interventions: List[SimulationIntervention]

class WhatIfSimulationResponse(BaseModel):
    organization_id: str
    baseline_exposure: float
    simulated_exposure: float
    modeled_risk_reduction: float
    modeled_reduction_percentage: float
    affected_assets: List[str]

# --- Optimization DTOs ---

class SecurityInitiative(BaseModel):
    initiative_id: str
    name: str
    cost: float
    affected_asset_ids: List[str]
    target_control_code: str
    target_control_status: str

class OptimizerRequest(BaseModel):
    organization_id: str
    available_budget: float
    baseline_request: RiskCalculationRequest
    candidate_initiatives: List[SecurityInitiative]

class InvestmentStrategyOption(BaseModel):
    strategy_label: str
    total_cost: float
    modeled_exposure_reduction: float
    residual_exposure: float
    rosi_percentage: float
    selected_initiative_ids: List[str]

class OptimizerResponse(BaseModel):
    organization_id: str
    available_budget: float
    strategies: List[InvestmentStrategyOption]
    diminishing_returns_curve: List[Dict[str, float]]
