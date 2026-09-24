# =============================================================================
# CyberRiskOS — What-If Simulation Engine Pydantic v2 Schemas
# Phase: Phase 4 — What-If Simulation Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
# =============================================================================

from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.risk_input import RiskEvaluationInputSchema, RiskEvaluationResultSchema
from app.schemas.financial_input import FinancialExposureInputSchema, FinancialExposureResultSchema


class ScenarioActionType(str, Enum):
    PATCH_VULNERABILITY = "PATCH_VULNERABILITY"
    IMPLEMENT_CONTROL = "IMPLEMENT_CONTROL"
    ISOLATE_ASSET = "ISOLATE_ASSET"
    DECOMMISSION_ASSET = "DECOMMISSION_ASSET"


class ScenarioActionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    action_type: ScenarioActionType = Field(..., alias="actionType")
    target_asset_id: str = Field(..., alias="targetAssetId")
    target_cve_id: Optional[str] = Field(None, alias="targetCveId")
    control_code: Optional[str] = Field(None, alias="controlCode")
    description: Optional[str] = None


class ActionImpactSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    action_type: str = Field(..., alias="actionType")
    target_asset_id: str = Field(..., alias="targetAssetId")
    target_cve_id: Optional[str] = Field(None, alias="targetCveId")
    risk_score_reduction: float = Field(0.0, alias="riskScoreReduction")
    eal_reduction: Optional[float] = Field(0.0, alias="ealReduction")
    currency: str = Field("USD")
    summary: str


class ScenarioSimulationInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    scenario_name: str = Field(default="Hypothetical Remediation Scenario", alias="scenarioName")
    actions: List[ScenarioActionSchema] = Field(..., min_length=1)
    baseline_risk_inputs: List[RiskEvaluationInputSchema] = Field(..., min_length=1, alias="baselineRiskInputs")
    baseline_financial_inputs: Optional[List[FinancialExposureInputSchema]] = Field(default=None, alias="baselineFinancialInputs")


class ScenarioSimulationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    scenario_name: str = Field(..., alias="scenarioName")
    baseline_avg_risk_score: float = Field(..., alias="baselineAvgRiskScore")
    simulated_avg_risk_score: float = Field(..., alias="simulatedAvgRiskScore")
    risk_score_delta: float = Field(..., alias="riskScoreDelta")
    risk_reduction_pct: float = Field(..., alias="riskReductionPct")
    baseline_total_eal: Optional[float] = Field(None, alias="baselineTotalEal")
    simulated_total_eal: Optional[float] = Field(None, alias="simulatedTotalEal")
    eal_delta: Optional[float] = Field(None, alias="ealDelta")
    eal_reduction_pct: Optional[float] = Field(None, alias="ealReductionPct")
    eal_status: str = Field("CALCULATED", alias="ealStatus")
    currency: str = Field("USD")
    total_actions_applied: int = Field(..., alias="totalActionsApplied")
    action_impacts: List[ActionImpactSchema] = Field(default_factory=list, alias="actionImpacts")
    simulated_evaluations: List[RiskEvaluationResultSchema] = Field(default_factory=list, alias="simulatedEvaluations")
    simulated_financial_evaluations: List[FinancialExposureResultSchema] = Field(default_factory=list, alias="simulatedFinancialEvaluations")
    model_version: str = Field("1.0.0", alias="modelVersion")
    is_simulation: bool = Field(True, alias="isSimulation")
    simulated_at: str = Field(..., alias="simulatedAt")
