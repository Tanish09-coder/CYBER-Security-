# =============================================================================
# CyberRiskOS — Deterministic Risk Model v1.0.0 Calculator Core
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any

from app.schemas.risk_input import (
    RiskSeverity,
    FactorCategory,
    ControlStatus,
    RiskEvaluationInputSchema,
    RiskEvaluationResultSchema,
    BatchRiskEvaluationInputSchema,
    BatchRiskEvaluationResultSchema,
    FactorExplanationSchema,
)
from app.models.risk_entity import ProvenanceHasher


# -----------------------------------------------------------------------------
# Explicit Model-Policy Consequence Scalar Matrix
# Spec: docs/RISK_ENGINE_CONTRACT.md (Section 3.1, Audit 3)
# Note: Labeled as an organizational model-policy assumption, NOT an empirical constant.
# -----------------------------------------------------------------------------
CRITICALITY_CONSEQUENCE_WEIGHTS: Dict[int, float] = {
    1: 1.40,  # Tier 1 (Mission Critical): +40% consequence uplift
    2: 1.20,  # Tier 2 (High): +20% consequence uplift
    3: 1.00,  # Tier 3 (Moderate / Baseline): 0% baseline reference
    4: 0.80,  # Tier 4 (Low): -20% consequence reduction
    5: 0.60,  # Tier 5 (Minimal): -40% consequence reduction
}


class RiskModelV1Calculator:
    """
    Deterministic Risk Model v1 Core Calculator.
    Evaluates atomic (asset_id, vulnerability_id) pairs without arbitrary multipliers,
    invented probabilities, or ungrounded control percentage reductions.
    """

    MODEL_VERSION: str = "1.0.0"

    @classmethod
    def evaluate(cls, payload: RiskEvaluationInputSchema) -> RiskEvaluationResultSchema:
        asset = payload.asset
        vuln = payload.vulnerability

        missing_data_warnings: List[str] = []
        risk_flags: List[str] = []
        factors: List[FactorExplanationSchema] = []

        # ---------------------------------------------------------------------
        # 1. Base Technical Severity (CVSS)
        # ---------------------------------------------------------------------
        if vuln.cvss_score is not None:
            raw_cvss = float(vuln.cvss_score)
            s_tech = round(raw_cvss * 10.0, 2)
            cvss_contribution = s_tech
            cvss_rationale = (
                f"Intrinsic technical flaw severity from NIST NVD (CVSS {raw_cvss:.1f})."
            )
        else:
            raw_cvss = None
            s_tech = None
            cvss_contribution = None
            missing_data_warnings.append("MISSING_CVSS_SCORE")
            cvss_rationale = (
                "CVSS base score is missing or unavailable; core technical severity cannot be calculated."
            )

        factors.append(
            FactorExplanationSchema(
                name="CVSS_TECHNICAL_SEVERITY",
                category=FactorCategory.TECHNICAL_SEVERITY,
                value=raw_cvss,
                weight=1.00,
                contribution=cvss_contribution,
                rationale=cvss_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 2. Enterprise Consequence Weight (Asset Criticality Tier)
        # ---------------------------------------------------------------------
        tier = asset.criticality_tier
        if tier is not None and tier in CRITICALITY_CONSEQUENCE_WEIGHTS:
            w_crit = CRITICALITY_CONSEQUENCE_WEIGHTS[tier]
            crit_rationale = (
                f"Tier {tier} asset consequence scaling (Model-Policy Construct: weight {w_crit:.2f})."
            )
        else:
            w_crit = 1.00
            if tier is None:
                missing_data_warnings.append("MISSING_ASSET_CRITICALITY")
                crit_rationale = (
                    "Criticality tier is unknown/unrecorded; consequence scaling cannot be evaluated."
                )
            else:
                missing_data_warnings.append("INVALID_ASSET_CRITICALITY")
                crit_rationale = (
                    f"Criticality tier {tier} invalid; consequence scaling not applied."
                )

        # ---------------------------------------------------------------------
        # 3. Unclamped & Clamped Enterprise Risk Score Calculation
        # ---------------------------------------------------------------------
        if s_tech is not None:
            r_raw = s_tech * w_crit
            final_score: Optional[float] = min(100.0, max(0.0, round(r_raw, 2)))
            consequence_delta: Optional[float] = round(final_score - s_tech, 2)
            eval_status = "CALCULATED"
        else:
            final_score = None
            consequence_delta = None
            eval_status = "NOT_CALCULABLE"

        factors.append(
            FactorExplanationSchema(
                name="ASSET_CRITICALITY_CONSEQUENCE",
                category=FactorCategory.BUSINESS_CONTEXT,
                value=tier,
                weight=w_crit,
                contribution=consequence_delta,
                rationale=crit_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 4. Threat Intel Evidence: CISA KEV Active Exploitation
        # ---------------------------------------------------------------------
        is_kev = bool(vuln.is_known_exploited)
        if is_kev:
            risk_flags.append("CISA_KEV_ACTIVE_EXPLOITATION")
            kev_rationale = (
                "Active exploitation in the wild confirmed by official CISA KEV catalog; "
                "establishes qualitative severity floor."
            )
        else:
            kev_rationale = (
                "No active in-the-wild exploitation cataloged in CISA KEV."
            )

        factors.append(
            FactorExplanationSchema(
                name="CISA_KEV_EXPLOITATION_EVIDENCE",
                category=FactorCategory.THREAT_INTEL,
                value=is_kev,
                weight=0.00,
                contribution=0.00,
                rationale=kev_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 5. Threat Intel Evidence: CISA KEV Ransomware Campaign Use
        # ---------------------------------------------------------------------
        ransomware_status = vuln.known_ransomware_campaign_use
        is_ransomware_known = ransomware_status is not None and ransomware_status.strip().lower() == "known"
        if is_ransomware_known:
            risk_flags.append("RANSOMWARE_CAMPAIGN_ASSOCIATED")
            rw_rationale = (
                "Verified association with ransomware campaigns cataloged by CISA; "
                "prioritized for containment."
            )
        else:
            rw_rationale = (
                "No confirmed ransomware campaign association cataloged."
            )

        factors.append(
            FactorExplanationSchema(
                name="CISA_KEV_RANSOMWARE_EVIDENCE",
                category=FactorCategory.THREAT_INTEL,
                value=ransomware_status,
                weight=0.00,
                contribution=0.00,
                rationale=rw_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 6. Network Topology Context: Perimeter Internet Exposure
        # ---------------------------------------------------------------------
        if asset.is_internet_facing is None:
            is_exposed = None
            missing_data_warnings.append("UNKNOWN_INTERNET_EXPOSURE")
            exposure_rationale = (
                "Asset perimeter internet exposure posture is unknown/unrecorded."
            )
        elif asset.is_internet_facing:
            is_exposed = True
            risk_flags.append("INTERNET_FACING_PERIMETER")
            exposure_rationale = (
                "Asset is directly accessible from public Internet; perimeter attack surface is elevated."
            )
        else:
            is_exposed = False
            exposure_rationale = (
                "Asset is hosted on internal networks with no direct public Internet ingress."
            )

        factors.append(
            FactorExplanationSchema(
                name="PERIMETER_EXPOSURE_CONTEXT",
                category=FactorCategory.BUSINESS_CONTEXT,
                value=is_exposed,
                weight=0.00,
                contribution=0.00,
                rationale=exposure_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 7. Defensive Controls Posture Context
        # ---------------------------------------------------------------------
        controls = asset.controls
        if controls is None:
            missing_data_warnings.append("UNKNOWN_CONTROLS_DATA")
            controls_rationale = (
                "Defensive controls posture is unrecorded/unknown."
            )
            implemented_count = None
        elif len(controls) == 0:
            missing_data_warnings.append("INCOMPLETE_CONTROLS_DATA")
            controls_rationale = (
                "No defensive controls registered for asset."
            )
            implemented_count = 0
        else:
            implemented_controls = [c for c in controls if c.status == ControlStatus.IMPLEMENTED]
            implemented_count = len(implemented_controls)
            if implemented_count > 0:
                risk_flags.append("COMPENSATING_CONTROLS_ACTIVE")
                codes_str = ", ".join(c.control_code for c in implemented_controls)
                controls_rationale = (
                    f"{implemented_count} implemented control(s) present ({codes_str}); "
                    "contextual defense evaluated (zero arbitrary percentage offset in Model v1)."
                )
            else:
                controls_rationale = (
                    f"{len(controls)} control(s) registered but none fully IMPLEMENTED."
                )

        factors.append(
            FactorExplanationSchema(
                name="SECURITY_CONTROLS_POSTURE",
                category=FactorCategory.DEFENSIVE_POSTURE,
                value=implemented_count,
                weight=0.00,
                contribution=0.00,
                rationale=controls_rationale,
            )
        )

        # ---------------------------------------------------------------------
        # 8. Qualitative Severity Tier & Empirical Evidence Floors
        # ---------------------------------------------------------------------
        if final_score is None:
            severity = RiskSeverity.UNKNOWN
        else:
            severity = cls._determine_severity(
                score=final_score,
                s_tech=s_tech,
                is_kev=is_kev,
                is_ransomware=is_ransomware_known,
            )

        # ---------------------------------------------------------------------
        # 9. Data Completeness Score Calculation
        # ---------------------------------------------------------------------
        data_completeness = cls._compute_data_completeness(
            has_cvss=vuln.cvss_score is not None,
            has_criticality=asset.criticality_tier is not None and asset.criticality_tier in CRITICALITY_CONSEQUENCE_WEIGHTS,
            has_exposure=asset.is_internet_facing is not None,
            has_controls=controls is not None and len(controls) > 0,
        )

        # ---------------------------------------------------------------------
        # 10. Deterministic SHA-256 Provenance Hash
        # ---------------------------------------------------------------------
        raw_input_dict = payload.model_dump(by_alias=True)
        provenance_hash = ProvenanceHasher.compute_hash(raw_input_dict)

        evaluated_at = datetime.now(timezone.utc).isoformat()

        return RiskEvaluationResultSchema(
            assetId=asset.asset_id,
            assetName=asset.asset_name,
            cveId=vuln.cve_id,
            baseCvss=vuln.cvss_score,
            riskScore=final_score,
            evaluationStatus=eval_status,
            severity=severity,
            factors=factors,
            missingDataWarnings=missing_data_warnings,
            dataCompletenessScore=data_completeness,
            riskFlags=risk_flags,
            modelVersion=cls.MODEL_VERSION,
            provenanceHash=provenance_hash,
            evaluatedAt=evaluated_at,
        )

    @classmethod
    def evaluate_batch(
        cls, batch_input: BatchRiskEvaluationInputSchema
    ) -> BatchRiskEvaluationResultSchema:
        results: List[RiskEvaluationResultSchema] = []
        for item in batch_input.evaluations:
            results.append(cls.evaluate(item))

        return BatchRiskEvaluationResultSchema(
            results=results,
            totalEvaluated=len(results),
            modelVersion=cls.MODEL_VERSION,
        )

    @staticmethod
    def _determine_severity(
        score: float, s_tech: float, is_kev: bool, is_ransomware: bool
    ) -> RiskSeverity:
        # Standard score brackets
        if score >= 90.0:
            assigned = RiskSeverity.CRITICAL
        elif score >= 70.0:
            assigned = RiskSeverity.HIGH
        elif score >= 40.0:
            assigned = RiskSeverity.MEDIUM
        else:
            assigned = RiskSeverity.LOW

        # CyberRiskOS Model-Policy Severity Floor Rules:
        # Note: KEV provides authoritative evidence of exploitation; the floor treatment
        # is a deterministic, versioned CyberRiskOS modeling decision (not a CISA-prescribed rule).
        # 1. An actively exploited vulnerability in CISA KEV cannot be LOW
        if is_kev and assigned == RiskSeverity.LOW:
            assigned = RiskSeverity.MEDIUM

        # 2. An actively exploited vulnerability with CVSS base >= 7.0 cannot be below HIGH
        if is_kev and s_tech >= 70.0 and assigned in (RiskSeverity.LOW, RiskSeverity.MEDIUM):
            assigned = RiskSeverity.HIGH

        # 3. Known ransomware usage on an actively exploited CVE cannot be below HIGH
        if is_kev and is_ransomware and assigned in (RiskSeverity.LOW, RiskSeverity.MEDIUM):
            assigned = RiskSeverity.HIGH

        return assigned

    @staticmethod
    def _compute_data_completeness(
        has_cvss: bool,
        has_criticality: bool,
        has_exposure: bool,
        has_controls: bool,
    ) -> float:
        points = sum([
            1.0 if has_cvss else 0.0,
            1.0 if has_criticality else 0.0,
            1.0 if has_exposure else 0.0,
            1.0 if has_controls else 0.0,
        ])
        return round(points / 4.0, 2)
