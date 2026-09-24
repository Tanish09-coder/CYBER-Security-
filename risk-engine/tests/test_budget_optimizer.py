# =============================================================================
# CyberRiskOS — Investment Optimizer Unit Tests
# Phase: Phase 5 — Investment Optimization + ROSI
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/OPTIMIZATION.md
# =============================================================================

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.optimization_input import (
    OptimizationRequestSchema,
    RemediationCandidateActionSchema,
    OptimizationStrategyType,
)
from app.optimizers.budget_optimizer import BudgetOptimizer
from app.calculators.rosi import RosiCalculator


@pytest.fixture
def candidate_actions():
    return [
        RemediationCandidateActionSchema(
            actionId="act-patch-log4shell",
            actionType="PATCH_VULNERABILITY",
            targetAssetId="asset-1",
            targetCveId="CVE-2021-44228",
            cost=25000.0,
            estimatedRiskReduction=25.0,
            estimatedEalReduction=250000.0,
            title="Patch Log4Shell RCE on Payment Switch",
        ),
        RemediationCandidateActionSchema(
            actionId="act-mfa-edge",
            actionType="IMPLEMENT_CONTROL",
            targetAssetId="asset-1",
            controlCode="MFA",
            cost=10000.0,
            estimatedRiskReduction=10.0,
            estimatedEalReduction=80000.0,
            title="Deploy MFA on Core Switch",
        ),
        RemediationCandidateActionSchema(
            actionId="act-isolate-legacy",
            actionType="ISOLATE_ASSET",
            targetAssetId="asset-2",
            cost=5000.0,
            estimatedRiskReduction=8.0,
            estimatedEalReduction=45000.0,
            title="Isolate Legacy Database",
        ),
        RemediationCandidateActionSchema(
            actionId="act-edr-cluster",
            actionType="IMPLEMENT_CONTROL",
            targetAssetId="asset-3",
            controlCode="EDR",
            cost=50000.0,
            estimatedRiskReduction=30.0,
            estimatedEalReduction=150000.0,
            title="Enterprise EDR Cluster Rollout",
        ),
        RemediationCandidateActionSchema(
            actionId="act-patch-ssl",
            actionType="PATCH_VULNERABILITY",
            targetAssetId="asset-4",
            targetCveId="CVE-2023-0001",
            cost=2000.0,
            estimatedRiskReduction=5.0,
            estimatedEalReduction=30000.0,
            title="Renew and Patch Web SSL Vulnerability",
        ),
    ]


class TestBudgetOptimizer:
    def test_multi_strategy_generation(self, candidate_actions):
        request = OptimizationRequestSchema(
            budgetLimit=40000.0,
            currency="USD",
            candidateActions=candidate_actions,
            baselinePortfolioRisk=85.0,
            baselinePortfolioEal=600000.0,
        )

        result = BudgetOptimizer.solve(request)

        assert result.budget_limit == 40000.0
        assert result.total_candidates == 5
        assert len(result.strategies) == 3

        strat_types = {s.strategy_type for s in result.strategies}
        assert strat_types == {
            OptimizationStrategyType.MAX_MODELED_EAL_REDUCTION,
            OptimizationStrategyType.MAX_ROSI,
            OptimizationStrategyType.MAX_MODELED_RISK_REDUCTION,
        }

        for s in result.strategies:
            assert s.total_cost <= request.budget_limit
            assert s.remaining_budget == round(request.budget_limit - s.total_cost, 2)
            assert s.action_count == len(s.selected_actions)
            assert s.net_financial_benefit == round(s.total_eal_reduction - s.total_cost, 2)
            if s.total_cost > 0:
                assert s.rosi_pct is not None
                assert s.rosi_ratio is not None

    def test_explicit_objective_single_strategy(self, candidate_actions):
        req = OptimizationRequestSchema(
            budgetLimit=30000.0,
            currency="USD",
            objective=OptimizationStrategyType.MAX_MODELED_RISK_REDUCTION,
            candidateActions=candidate_actions,
        )
        res = BudgetOptimizer.solve(req)
        assert len(res.strategies) == 1
        assert res.strategies[0].strategy_type == OptimizationStrategyType.MAX_MODELED_RISK_REDUCTION
        assert res.strategies[0].total_cost <= 30000.0

    def test_dependency_resolution(self):
        actions = [
            RemediationCandidateActionSchema(
                actionId="act-base-network",
                actionType="IMPLEMENT_CONTROL",
                targetAssetId="asset-1",
                cost=10000.0,
                estimatedRiskReduction=5.0,
                estimatedEalReduction=20000.0,
                title="Base Network Segmentation",
            ),
            RemediationCandidateActionSchema(
                actionId="act-ztna-gateway",
                actionType="IMPLEMENT_CONTROL",
                targetAssetId="asset-1",
                cost=15000.0,
                estimatedRiskReduction=20.0,
                estimatedEalReduction=100000.0,
                dependencies=["act-base-network"],
                title="ZTNA Gateway Deployment",
            ),
        ]

        # Budget of 20,000 cannot afford both (10k + 15k = 25k) -> act-ztna-gateway cannot be selected alone
        res = BudgetOptimizer.solve(
            OptimizationRequestSchema(budgetLimit=20000.0, candidateActions=actions)
        )
        for s in res.strategies:
            selected_ids = {a.action_id for a in s.selected_actions}
            if "act-ztna-gateway" in selected_ids:
                assert "act-base-network" in selected_ids

    def test_mutually_exclusive_conflicts(self):
        actions = [
            RemediationCandidateActionSchema(
                actionId="act-patch-os",
                actionType="PATCH_VULNERABILITY",
                targetAssetId="asset-1",
                cost=10000.0,
                estimatedRiskReduction=15.0,
                estimatedEalReduction=50000.0,
                conflictsWith=["act-decom-server"],
                title="Patch OS on Server",
            ),
            RemediationCandidateActionSchema(
                actionId="act-decom-server",
                actionType="DECOMMISSION_ASSET",
                targetAssetId="asset-1",
                cost=12000.0,
                estimatedRiskReduction=25.0,
                estimatedEalReduction=80000.0,
                conflictsWith=["act-patch-os"],
                title="Decommission Server",
            ),
        ]

        res = BudgetOptimizer.solve(
            OptimizationRequestSchema(budgetLimit=25000.0, candidateActions=actions)
        )
        for s in res.strategies:
            selected_ids = {a.action_id for a in s.selected_actions}
            # Both must NEVER be selected together
            assert not ("act-patch-os" in selected_ids and "act-decom-server" in selected_ids)

    def test_budget_boundary_zero(self, candidate_actions):
        res = BudgetOptimizer.solve(
            OptimizationRequestSchema(budgetLimit=0.0, candidateActions=candidate_actions)
        )
        for s in res.strategies:
            assert s.total_cost == 0.0
            assert s.remaining_budget == 0.0
            assert len(s.selected_actions) == 0

    def test_rosi_calculator_zero_cost(self):
        net, ratio, pct = RosiCalculator.calculate(eal_reduction=50000.0, cost=0.0)
        assert net == 50000.0
        assert ratio is None
        assert pct is None

    def test_optimization_api_endpoint(self, candidate_actions):
        client = TestClient(app)
        payload = {
            "budgetLimit": 30000.0,
            "currency": "USD",
            "candidateActions": [a.model_dump(by_alias=True) for a in candidate_actions],
            "baselinePortfolioRisk": 80.0,
            "baselinePortfolioEal": 500000.0,
        }
        res = client.post("/api/v1/optimization/solve", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["budgetLimit"] == 30000.0
        assert len(data["strategies"]) == 3
