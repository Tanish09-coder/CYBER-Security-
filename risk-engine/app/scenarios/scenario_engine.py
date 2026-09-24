# =============================================================================
# CyberRiskOS — What-If Scenario Calculation Engine Core
# Phase: Phase 4 — What-If Simulation Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
# Rationale:
# - In-memory sandbox simulation without mutating the PostgreSQL database
# - Evaluates baseline vs simulated posture for both Risk Model v1 and Financial EAL
# - Calculates exact score deltas, EAL monetary savings, and action attribution
# =============================================================================

from copy import deepcopy
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

from app.schemas.scenario_input import (
    ScenarioSimulationInputSchema,
    ScenarioSimulationResultSchema,
    ScenarioActionSchema,
    ScenarioActionType,
    ActionImpactSchema,
)
from app.schemas.risk_input import (
    RiskEvaluationInputSchema,
    BatchRiskEvaluationInputSchema,
    ControlContextSchema,
    ControlStatus,
)
from app.schemas.financial_input import (
    FinancialExposureInputSchema,
    BatchFinancialExposureInputSchema,
)
from app.calculators.risk_model_v1 import RiskModelV1Calculator
from app.calculators.financial_exposure import FinancialExposureCalculator


class WhatIfScenarioEngine:
    """
    Stateless, in-memory scenario engine computing baseline vs hypothetical posture.
    Strictly zero database writes.
    """

    MODEL_VERSION: str = "1.0.0"

    @classmethod
    def simulate(
        cls, payload: ScenarioSimulationInputSchema
    ) -> ScenarioSimulationResultSchema:
        actions = payload.actions
        baseline_risk_inputs = payload.baseline_risk_inputs
        baseline_fin_inputs = payload.baseline_financial_inputs or []

        # ---------------------------------------------------------------------
        # 1. Baseline Evaluation
        # ---------------------------------------------------------------------
        base_risk_batch = RiskModelV1Calculator.evaluate_batch(
            BatchRiskEvaluationInputSchema(evaluations=baseline_risk_inputs)
        )
        base_risk_results = base_risk_batch.results
        base_avg_risk = (
            round(sum(r.risk_score for r in base_risk_results) / len(base_risk_results), 2)
            if base_risk_results
            else 0.0
        )

        currency = "USD"
        if baseline_fin_inputs:
            base_fin_batch = FinancialExposureCalculator.evaluate_batch(
                BatchFinancialExposureInputSchema(evaluations=baseline_fin_inputs)
            )
            base_fin_results = base_fin_batch.results
            base_total_eal = base_fin_batch.total_modeled_eal
            currency = base_fin_batch.currency
        else:
            base_fin_results = []
            base_total_eal = 0.0

        # ---------------------------------------------------------------------
        # 2. In-Memory Cloning & Action Application
        # ---------------------------------------------------------------------
        sim_risk_inputs = [deepcopy(inp) for inp in baseline_risk_inputs]
        sim_fin_inputs = [deepcopy(inp) for inp in baseline_fin_inputs]

        action_impacts: List[ActionImpactSchema] = []

        for action in actions:
            action_type = action.action_type
            target_asset_id = action.target_asset_id
            target_cve_id = action.target_cve_id

            if action_type == ScenarioActionType.PATCH_VULNERABILITY:
                # Find matching baseline risk and EAL results for attribution
                matched_base_risks = [
                    r.risk_score for r in base_risk_results
                    if r.asset_id == target_asset_id and (target_cve_id is None or r.cve_id == target_cve_id)
                ]
                matched_base_eals = [
                    r.eal for r in base_fin_results
                    if r.asset_id == target_asset_id and (target_cve_id is None or r.cve_id == target_cve_id) and r.eal is not None
                ]

                # Patch CVE on target asset: remove matching (asset, CVE) evaluation
                sim_risk_inputs = [
                    inp for inp in sim_risk_inputs
                    if not (inp.asset.asset_id == target_asset_id and (target_cve_id is None or inp.vulnerability.cve_id == target_cve_id))
                ]
                sim_fin_inputs = [
                    inp for inp in sim_fin_inputs
                    if not (inp.asset.asset_id == target_asset_id and (target_cve_id is None or inp.vulnerability.cve_id == target_cve_id))
                ]

                flaw_risk_eliminated = round(sum(matched_base_risks) / len(matched_base_risks), 2) if matched_base_risks else 0.0
                flaw_eal_eliminated = round(sum(matched_base_eals), 2) if matched_base_eals else (0.0 if base_total_eal is not None else None)

                action_impacts.append(
                    ActionImpactSchema(
                        actionType=action_type.value,
                        targetAssetId=target_asset_id,
                        targetCveId=target_cve_id,
                        riskScoreReduction=flaw_risk_eliminated,
                        ealReduction=flaw_eal_eliminated,
                        currency=currency,
                        summary=f"Remediated vulnerability {target_cve_id or 'all vulnerabilities'} on asset {target_asset_id} (eliminated {len(matched_base_risks)} flaw exposure(s) from modeled posture).",
                    )
                )

            elif action_type == ScenarioActionType.IMPLEMENT_CONTROL:
                # Implement defensive control on target asset
                control_code = action.control_code or "MFA"
                for inp in sim_risk_inputs:
                    if inp.asset.asset_id == target_asset_id:
                        controls = inp.asset.controls or []
                        existing = next((c for c in controls if c.control_code == control_code), None)
                        if existing:
                            existing.status = ControlStatus.IMPLEMENTED
                        else:
                            controls.append(ControlContextSchema(controlCode=control_code, status=ControlStatus.IMPLEMENTED))
                        inp.asset.controls = controls

                # Audit directive: controls are contextual-only in Risk Model v1; risk_score_reduction = 0.0
                eal_reduc = 0.0 if base_total_eal is not None else None
                action_impacts.append(
                    ActionImpactSchema(
                        actionType=action_type.value,
                        targetAssetId=target_asset_id,
                        targetCveId=None,
                        riskScoreReduction=0.0,
                        ealReduction=eal_reduc,
                        currency=currency,
                        summary=f"Implemented control {control_code} on asset {target_asset_id} (contextual defense posture updated; no quantitative reduction under Risk Model v1).",
                    )
                )

            elif action_type == ScenarioActionType.ISOLATE_ASSET:
                # Remove asset from internet edge (is_internet_facing = False)
                for inp in sim_risk_inputs:
                    if inp.asset.asset_id == target_asset_id:
                        inp.asset.is_internet_facing = False
                for fin_inp in sim_fin_inputs:
                    if fin_inp.asset.asset_id == target_asset_id:
                        fin_inp.asset.is_internet_facing = False

                # Audit directive: perimeter exposure is contextual-only in Risk Model v1; risk_score_reduction = 0.0
                eal_reduc = 0.0 if base_total_eal is not None else None
                action_impacts.append(
                    ActionImpactSchema(
                        actionType=action_type.value,
                        targetAssetId=target_asset_id,
                        targetCveId=None,
                        riskScoreReduction=0.0,
                        ealReduction=eal_reduc,
                        currency=currency,
                        summary=f"Isolated asset {target_asset_id} from public Internet edge (perimeter context updated; no continuous score delta under Risk Model v1).",
                    )
                )

            elif action_type == ScenarioActionType.DECOMMISSION_ASSET:
                # Find matching baseline risk and EAL results for attribution
                matched_base_risks = [
                    r.risk_score for r in base_risk_results
                    if r.asset_id == target_asset_id
                ]
                matched_base_eals = [
                    r.eal for r in base_fin_results
                    if r.asset_id == target_asset_id and r.eal is not None
                ]

                # Completely decommission asset from active posture
                sim_risk_inputs = [inp for inp in sim_risk_inputs if inp.asset.asset_id != target_asset_id]
                sim_fin_inputs = [fin_inp for fin_inp in sim_fin_inputs if fin_inp.asset.asset_id != target_asset_id]

                decom_risk_removed = round(sum(matched_base_risks) / len(matched_base_risks), 2) if matched_base_risks else 0.0
                decom_eal_retired = round(sum(matched_base_eals), 2) if matched_base_eals else (0.0 if base_total_eal is not None else None)

                # Audit directive: distinguish removal from modeled exposure from risk score magically becoming zero
                action_impacts.append(
                    ActionImpactSchema(
                        actionType=action_type.value,
                        targetAssetId=target_asset_id,
                        targetCveId=None,
                        riskScoreReduction=decom_risk_removed,
                        ealReduction=decom_eal_retired,
                        currency=currency,
                        summary=f"Decommissioned asset {target_asset_id} from active portfolio (removed {len(matched_base_risks)} flaw(s) from modeled exposure; retired from active enterprise scope).",
                    )
                )

        # ---------------------------------------------------------------------
        # 3. Simulated Posture Evaluation
        # ---------------------------------------------------------------------
        if sim_risk_inputs:
            sim_risk_batch = RiskModelV1Calculator.evaluate_batch(
                BatchRiskEvaluationInputSchema(evaluations=sim_risk_inputs)
            )
            sim_risk_results = sim_risk_batch.results
            sim_avg_risk = round(sum(r.risk_score for r in sim_risk_results) / len(sim_risk_results), 2)
        else:
            sim_risk_results = []
            sim_avg_risk = 0.0

        if sim_fin_inputs:
            sim_fin_batch = FinancialExposureCalculator.evaluate_batch(
                BatchFinancialExposureInputSchema(evaluations=sim_fin_inputs)
            )
            sim_fin_results = sim_fin_batch.results
            sim_total_eal = sim_fin_batch.total_modeled_eal
        else:
            sim_fin_results = []
            sim_total_eal = 0.0 if (baseline_fin_inputs and base_total_eal is not None) else None

        # ---------------------------------------------------------------------
        # 4. Deltas and Percentage Reductions
        # ---------------------------------------------------------------------
        risk_delta = round(sim_avg_risk - base_avg_risk, 2)
        risk_pct = round(abs(risk_delta) / base_avg_risk * 100, 2) if base_avg_risk > 0 else 0.0

        if base_total_eal is not None and sim_total_eal is not None:
            eal_delta = round(sim_total_eal - base_total_eal, 2)
            eal_pct = round(abs(eal_delta) / base_total_eal * 100, 2) if base_total_eal > 0 else 0.0
            eal_status = "CALCULATED"
        else:
            eal_delta = None
            eal_pct = None
            eal_status = "NOT_AVAILABLE"

        simulated_at = datetime.now(timezone.utc).isoformat()

        return ScenarioSimulationResultSchema(
            scenarioName=payload.scenario_name,
            baselineAvgRiskScore=base_avg_risk,
            simulatedAvgRiskScore=sim_avg_risk,
            riskScoreDelta=risk_delta,
            riskReductionPct=risk_pct,
            baselineTotalEal=base_total_eal,
            simulatedTotalEal=sim_total_eal,
            ealDelta=eal_delta,
            ealReductionPct=eal_pct,
            ealStatus=eal_status,
            currency=currency,
            totalActionsApplied=len(actions),
            actionImpacts=action_impacts,
            simulatedEvaluations=sim_risk_results,
            simulatedFinancialEvaluations=sim_fin_results,
            modelVersion=cls.MODEL_VERSION,
            isSimulation=True,
            simulatedAt=simulated_at,
        )
