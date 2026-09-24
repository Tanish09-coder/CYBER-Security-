# =============================================================================
# CyberRiskOS — Investment Optimization Pydantic v2 Schemas
# Phase: Phase 5 — Investment Optimization + ROSI
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/OPTIMIZATION.md
# =============================================================================

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class OptimizationObjective(str, Enum):
    MAX_MODELED_RISK_REDUCTION = "MAX_MODELED_RISK_REDUCTION"
    MAX_MODELED_EAL_REDUCTION = "MAX_MODELED_EAL_REDUCTION"
    MAX_ROSI = "MAX_ROSI"


class OptimizationStrategyType(str, Enum):
    MAX_MODELED_RISK_REDUCTION = "MAX_MODELED_RISK_REDUCTION"
    MAX_MODELED_EAL_REDUCTION = "MAX_MODELED_EAL_REDUCTION"
    MAX_ROSI = "MAX_ROSI"
    # Aliases
    MAX_REDUCTION = "MAX_MODELED_EAL_REDUCTION"
    BALANCED_ROSI = "MAX_ROSI"
    QUICK_WINS = "MAX_MODELED_RISK_REDUCTION"


class RemediationCandidateActionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    action_id: str = Field(..., alias="actionId")
    action_type: str = Field(..., alias="actionType")
    target_asset_id: str = Field(..., alias="targetAssetId")
    target_cve_id: Optional[str] = Field(None, alias="targetCveId")
    control_code: Optional[str] = Field(None, alias="controlCode")
    cost: float = Field(..., ge=0.0, description="Remediation implementation cost in fiat currency")
    estimated_risk_reduction: float = Field(default=0.0, ge=0.0, alias="estimatedRiskReduction")
    estimated_eal_reduction: float = Field(default=0.0, ge=0.0, alias="estimatedEalReduction")
    dependencies: List[str] = Field(default_factory=list, description="Action IDs required before this action")
    conflicts_with: List[str] = Field(default_factory=list, alias="conflictsWith", description="Mutually exclusive action IDs")
    title: str = Field(..., description="Executive summary title")
    description: Optional[str] = None


class OptimizationRequestSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    budget_limit: float = Field(..., ge=0.0, alias="budgetLimit")
    currency: str = Field(default="USD", max_length=10)
    objective: Optional[OptimizationObjective] = None
    candidate_actions: List[RemediationCandidateActionSchema] = Field(..., min_length=1, alias="candidateActions")
    baseline_portfolio_risk: Optional[float] = Field(None, ge=0.0, le=100.0, alias="baselinePortfolioRisk")
    baseline_portfolio_eal: Optional[float] = Field(None, ge=0.0, alias="baselinePortfolioEal")


class StrategyResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    strategy_id: str = Field(..., alias="strategyId")
    strategy_name: str = Field(..., alias="strategyName")
    strategy_type: OptimizationStrategyType = Field(..., alias="strategyType")
    description: str
    selected_actions: List[RemediationCandidateActionSchema] = Field(default_factory=list, alias="selectedActions")
    total_cost: float = Field(..., ge=0.0, alias="totalCost")
    remaining_budget: float = Field(..., ge=0.0, alias="remainingBudget")
    total_risk_reduction: float = Field(..., ge=0.0, alias="totalRiskReduction")
    total_eal_reduction: float = Field(..., ge=0.0, alias="totalEalReduction")
    simulated_portfolio_risk: Optional[float] = Field(None, alias="simulatedPortfolioRisk")
    simulated_portfolio_eal: Optional[float] = Field(None, alias="simulatedPortfolioEal")
    net_financial_benefit: float = Field(..., alias="netFinancialBenefit")
    rosi_pct: Optional[float] = Field(None, alias="rosiPct", description="Return on Security Investment as a percentage")
    rosi_ratio: Optional[float] = Field(None, alias="rosiRatio", description="Return on Security Investment as a ratio")
    action_count: int = Field(..., ge=0, alias="actionCount")


class OptimizationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    budget_limit: float = Field(..., ge=0.0, alias="budgetLimit")
    currency: str = Field(default="USD")
    strategies: List[StrategyResultSchema]
    total_candidates: int = Field(..., ge=0, alias="totalCandidates")
    evaluated_at: str = Field(..., alias="evaluatedAt")
    model_version: str = Field("1.0.0", alias="modelVersion")
