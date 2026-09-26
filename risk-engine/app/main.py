# =============================================================================
# CyberRiskOS — Risk, Financial & Simulation Engine FastAPI Microservice
# Phases: Phase 2 (Risk Model v1), Phase 3 (Financial EAL), Phase 4 (What-If Simulator)
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Specs: docs/RISK_ENGINE_CONTRACT.md, docs/FINANCIAL_MODEL.md
# =============================================================================

from fastapi import FastAPI, HTTPException

# Phase 2 Schemas & Calculators
from app.schemas.risk_input import (
    RiskEvaluationInputSchema,
    RiskEvaluationResultSchema,
    BatchRiskEvaluationInputSchema,
    BatchRiskEvaluationResultSchema,
)
from app.calculators.risk_model_v1 import RiskModelV1Calculator

# Phase 3 Schemas & Calculators
from app.schemas.financial_input import (
    FinancialExposureInputSchema,
    FinancialExposureResultSchema,
    BatchFinancialExposureInputSchema,
    BatchFinancialExposureResultSchema,
)
from app.calculators.financial_exposure import FinancialExposureCalculator

# Phase 4 Schemas & Calculators
from app.schemas.scenario_input import (
    ScenarioSimulationInputSchema,
    ScenarioSimulationResultSchema,
)
from app.scenarios.scenario_engine import WhatIfScenarioEngine

# Phase 5 Schemas & Optimizer
from app.schemas.optimization_input import (
    OptimizationRequestSchema,
    OptimizationResultSchema,
)
from app.optimizers.budget_optimizer import BudgetOptimizer

# Phase 7B Attack Graph Schemas & Engine
from app.schemas.attack_graph_input import (
    AttackGraphInputSchema,
    AttackGraphAnalysisResultSchema,
)
from app.attack_graph.graph_engine import AttackGraphEngine

# Active Breach Containment AI Agent
from app.schemas.containment_input import (
    BreachContainmentInputSchema,
    BreachContainmentResultSchema,
)
from app.ai.breach_containment_agent import BreachContainmentAgent


app = FastAPI(
    title="CyberRiskOS Risk, Financial & Simulation Engine",
    description="Deterministic cyber-risk quantification, financial exposure / EAL calculation, What-If scenario simulation, and multi-strategy investment optimization service.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "risk-engine",
        "modelVersion": RiskModelV1Calculator.MODEL_VERSION,
        "capabilities": [
            "risk_model_v1",
            "financial_exposure_eal",
            "whatif_scenarios",
            "investment_optimizer",
        ],
    }


# -----------------------------------------------------------------------------
# Phase 2: Deterministic Risk Model v1 Endpoints (Operational)
# -----------------------------------------------------------------------------

@app.post("/api/v1/risk/evaluate", response_model=RiskEvaluationResultSchema)
def evaluate_risk_endpoint(payload: RiskEvaluationInputSchema):
    """
    Evaluates an atomic (asset_id, vulnerability_id) pair deterministically
    using Risk Model v1.0.0 based on verified enterprise consequence and technical severity.
    """
    try:
        return RiskModelV1Calculator.evaluate(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk evaluation error: {str(e)}")


@app.post("/api/v1/risk/evaluate/batch", response_model=BatchRiskEvaluationResultSchema)
def evaluate_risk_batch_endpoint(payload: BatchRiskEvaluationInputSchema):
    """
    Evaluates a batch of atomic (asset_id, vulnerability_id) pairs deterministically.
    """
    try:
        return RiskModelV1Calculator.evaluate_batch(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch risk evaluation error: {str(e)}")


# -----------------------------------------------------------------------------
# Phase 3: Financial Exposure & Estimated Annualized Loss (EAL) Endpoints
# -----------------------------------------------------------------------------

@app.post("/api/v1/financial/evaluate", response_model=FinancialExposureResultSchema)
def evaluate_financial_endpoint(payload: FinancialExposureInputSchema):
    """
    Evaluates quantitative financial exposure and Estimated Annualized Loss (EAL)
    for an atomic (asset_id, vulnerability_id) pair in fiat currency.
    """
    try:
        return FinancialExposureCalculator.evaluate(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Financial evaluation error: {str(e)}")


@app.post("/api/v1/financial/evaluate/batch", response_model=BatchFinancialExposureResultSchema)
def evaluate_financial_batch_endpoint(payload: BatchFinancialExposureInputSchema):
    """
    Evaluates a batch of financial exposures and computes total portfolio EAL.
    """
    try:
        return FinancialExposureCalculator.evaluate_batch(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch financial evaluation error: {str(e)}")


# -----------------------------------------------------------------------------
# Phase 4: What-If Scenario Simulation Endpoints
# -----------------------------------------------------------------------------

@app.post("/api/v1/scenarios/simulate", response_model=ScenarioSimulationResultSchema)
def simulate_scenario_endpoint(payload: ScenarioSimulationInputSchema):
    """
    Simulates hypothetical remediation actions in an in-memory sandbox.
    Computes baseline vs simulated posture deltas for risk score and financial EAL.
    Strictly zero database mutations.
    """
    try:
        return WhatIfScenarioEngine.simulate(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario simulation error: {str(e)}")


# -----------------------------------------------------------------------------
# Phase 5: Investment Optimization Endpoints
# -----------------------------------------------------------------------------

@app.post("/api/v1/optimization/solve", response_model=OptimizationResultSchema)
def solve_optimization_endpoint(payload: OptimizationRequestSchema):
    """
    Computes multi-strategy investment optimization candidates (Strategy A: Maximum Reduction,
    Strategy B: Balanced ROSI, Strategy C: Quick Wins) under budget and dependency constraints.
    """
    try:
        return BudgetOptimizer.solve(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization error: {str(e)}")


# -----------------------------------------------------------------------------
# Phase 7B: Attack Path & Blast Radius Analysis Endpoints
# -----------------------------------------------------------------------------

@app.post("/api/v1/attack-paths/analyze", response_model=AttackGraphAnalysisResultSchema)
def analyze_attack_paths_endpoint(payload: AttackGraphInputSchema):
    """
    Performs deterministic, topological attack path discovery and structural
    choke point identification from verified network, asset, and vulnerability evidence.
    """
    try:
        return AttackGraphEngine.analyze(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attack path analysis error: {str(e)}")


# -----------------------------------------------------------------------------
# Active Breach Containment AI Agent Endpoint
# -----------------------------------------------------------------------------

@app.post("/api/v1/breach-containment/analyze", response_model=BreachContainmentResultSchema)
def analyze_breach_containment_endpoint(payload: BreachContainmentInputSchema):
    """
    Analyzes active ongoing server hacking events and generates real-time
    containment playbooks, CLI scripts, and INR financial mitigation metrics.
    """
    try:
        return BreachContainmentAgent.generate_containment_plan(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Breach containment error: {str(e)}")


