# =============================================================================
# CyberRiskOS — What-If Simulation Engine Unit Tests
# Phase: Phase 4 — What-If Simulation Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
# =============================================================================

import pytest
from app.schemas.scenario_input import (
    ScenarioSimulationInputSchema,
    ScenarioActionSchema,
    ScenarioActionType,
)
from app.schemas.risk_input import (
    RiskEvaluationInputSchema,
    AssetRiskInputSchema,
    VulnerabilityRiskInputSchema,
)
from app.schemas.financial_input import (
    FinancialExposureInputSchema,
    FinancialAssetInputSchema,
    FinancialVulnerabilityInputSchema,
)
from app.scenarios.scenario_engine import WhatIfScenarioEngine


@pytest.fixture
def baseline_data():
    risk_inputs = [
        RiskEvaluationInputSchema(
            asset=AssetRiskInputSchema(
                assetId="asset-1",
                assetName="Web Edge",
                criticalityTier=2,
                isInternetFacing=True,
            ),
            vulnerability=VulnerabilityRiskInputSchema(
                cveId="CVE-2021-44228",
                cvssScore=10.0,
                isKnownExploited=True,
            ),
        ),
        RiskEvaluationInputSchema(
            asset=AssetRiskInputSchema(
                assetId="asset-2",
                assetName="DB Server",
                criticalityTier=1,
                isInternetFacing=False,
            ),
            vulnerability=VulnerabilityRiskInputSchema(
                cveId="CVE-2023-34362",
                cvssScore=8.0,
                isKnownExploited=False,
            ),
        ),
    ]

    fin_inputs = [
        FinancialExposureInputSchema(
            asset=FinancialAssetInputSchema(
                assetId="asset-1",
                assetName="Web Edge",
                criticalityTier=2,
                isInternetFacing=True,
                hourlyDowntimeCost=5000.0,
                recoveryCost=25000.0,
                estimatedOutageHours=12.0,
                annualizedLossEventFrequency=1.0,
            ),
            vulnerability=FinancialVulnerabilityInputSchema(
                cveId="CVE-2021-44228",
                cvssScore=10.0,
                availabilityImpact="HIGH",
                isKnownExploited=True,
            ),
        ),
        FinancialExposureInputSchema(
            asset=FinancialAssetInputSchema(
                assetId="asset-2",
                assetName="DB Server",
                criticalityTier=1,
                isInternetFacing=False,
                hourlyDowntimeCost=10000.0,
                recoveryCost=50000.0,
                estimatedOutageHours=4.0,
                annualizedLossEventFrequency=1.0,
            ),
            vulnerability=FinancialVulnerabilityInputSchema(
                cveId="CVE-2023-34362",
                cvssScore=8.0,
                availabilityImpact="LOW",
                isKnownExploited=False,
            ),
        ),
    ]

    return risk_inputs, fin_inputs


class TestWhatIfScenarioEngine:
    def test_patch_vulnerability_action_simulation(self, baseline_data):
        risk_inputs, fin_inputs = baseline_data

        sim_input = ScenarioSimulationInputSchema(
            scenarioName="Patch Log4Shell",
            actions=[
                ScenarioActionSchema(
                    actionType=ScenarioActionType.PATCH_VULNERABILITY,
                    targetAssetId="asset-1",
                    targetCveId="CVE-2021-44228",
                )
            ],
            baselineRiskInputs=risk_inputs,
            baselineFinancialInputs=fin_inputs,
        )

        res = WhatIfScenarioEngine.simulate(sim_input)

        assert res.scenario_name == "Patch Log4Shell"
        assert res.total_actions_applied == 1
        assert res.is_simulation is True
        # Asset 1 flaw removed, remaining is Asset 2
        assert len(res.simulated_evaluations) == 1
        assert res.simulated_evaluations[0].asset_id == "asset-2"
        # EAL should be lower than baseline
        assert res.simulated_total_eal < res.baseline_total_eal
        assert res.eal_delta < 0.0
        assert res.eal_reduction_pct > 0.0
        assert len(res.action_impacts) == 1
        # Patching captures flaw risk and EAL eliminated
        assert res.action_impacts[0].risk_score_reduction > 0.0
        assert res.action_impacts[0].eal_reduction > 0.0

    def test_isolate_asset_action_simulation(self, baseline_data):
        risk_inputs, fin_inputs = baseline_data

        sim_input = ScenarioSimulationInputSchema(
            scenarioName="Isolate Web Edge",
            actions=[
                ScenarioActionSchema(
                    actionType=ScenarioActionType.ISOLATE_ASSET,
                    targetAssetId="asset-1",
                )
            ],
            baselineRiskInputs=risk_inputs,
            baselineFinancialInputs=fin_inputs,
        )

        res = WhatIfScenarioEngine.simulate(sim_input)

        # Still 2 evaluations
        assert len(res.simulated_evaluations) == 2
        # Consistency audit: internet exposure is contextual-only in Risk Model v1; score delta = 0.0
        assert res.risk_score_delta == 0.0
        assert res.action_impacts[0].risk_score_reduction == 0.0
        assert res.action_impacts[0].eal_reduction == 0.0
        assert res.eal_delta == 0.0

    def test_implement_control_action_simulation(self, baseline_data):
        risk_inputs, fin_inputs = baseline_data

        sim_input = ScenarioSimulationInputSchema(
            scenarioName="Deploy EDR",
            actions=[
                ScenarioActionSchema(
                    actionType=ScenarioActionType.IMPLEMENT_CONTROL,
                    targetAssetId="asset-1",
                    controlCode="EDR",
                )
            ],
            baselineRiskInputs=risk_inputs,
            baselineFinancialInputs=fin_inputs,
        )

        res = WhatIfScenarioEngine.simulate(sim_input)
        assert res.total_actions_applied == 1
        assert len(res.simulated_evaluations) == 2
        # Consistency audit: controls are contextual-only in Risk Model v1; score delta = 0.0
        assert res.risk_score_delta == 0.0
        assert res.action_impacts[0].risk_score_reduction == 0.0
        assert res.action_impacts[0].eal_reduction == 0.0
        # Verify COMPENSATING_CONTROLS_ACTIVE flag appeared
        assert "COMPENSATING_CONTROLS_ACTIVE" in res.simulated_evaluations[0].risk_flags

    def test_decommission_asset_action_simulation(self, baseline_data):
        risk_inputs, fin_inputs = baseline_data

        sim_input = ScenarioSimulationInputSchema(
            scenarioName="Decommission Asset 1",
            actions=[
                ScenarioActionSchema(
                    actionType=ScenarioActionType.DECOMMISSION_ASSET,
                    targetAssetId="asset-1",
                )
            ],
            baselineRiskInputs=risk_inputs,
            baselineFinancialInputs=fin_inputs,
        )

        res = WhatIfScenarioEngine.simulate(sim_input)
        assert res.total_actions_applied == 1
        assert len(res.simulated_evaluations) == 1
        assert res.simulated_evaluations[0].asset_id == "asset-2"
        assert res.action_impacts[0].risk_score_reduction > 0.0
        assert res.action_impacts[0].eal_reduction > 0.0
        assert "modeled exposure" in res.action_impacts[0].summary

    def test_scenario_missing_alef_handling(self):
        risk_inp = [
            RiskEvaluationInputSchema(
                asset=AssetRiskInputSchema(assetId="a1", assetName="Edge", criticalityTier=2, isInternetFacing=True),
                vulnerability=VulnerabilityRiskInputSchema(cveId="CVE-2021-44228", cvssScore=9.8, isKnownExploited=True),
            )
        ]
        fin_inp = [
            FinancialExposureInputSchema(
                asset=FinancialAssetInputSchema(assetId="a1", assetName="Edge", criticalityTier=2, isInternetFacing=True, annualizedLossEventFrequency=None),
                vulnerability=FinancialVulnerabilityInputSchema(cveId="CVE-2021-44228", cvssScore=9.8, availabilityImpact="HIGH"),
            )
        ]
        sim_input = ScenarioSimulationInputSchema(
            scenarioName="Test Missing ALEF",
            actions=[ScenarioActionSchema(actionType=ScenarioActionType.PATCH_VULNERABILITY, targetAssetId="a1", targetCveId="CVE-2021-44228")],
            baselineRiskInputs=risk_inp,
            baselineFinancialInputs=fin_inp,
        )
        res = WhatIfScenarioEngine.simulate(sim_input)
        assert res.eal_status == "NOT_AVAILABLE"
        assert res.baseline_total_eal is None
        assert res.simulated_total_eal is None
        assert res.eal_delta is None
