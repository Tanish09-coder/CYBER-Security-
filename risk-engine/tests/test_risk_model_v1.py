# =============================================================================
# CyberRiskOS — Risk Model v1.0.0 Calculator Unit Tests
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

import pytest
from app.schemas.risk_input import (
    ControlStatus,
    RiskSeverity,
    RiskEvaluationInputSchema,
    BatchRiskEvaluationInputSchema,
)
from app.calculators.risk_model_v1 import (
    RiskModelV1Calculator,
    CRITICALITY_CONSEQUENCE_WEIGHTS,
)


@pytest.fixture
def base_input_payload():
    return {
        "asset": {
            "assetId": "srv-finance-01",
            "assetName": "SWIFT Transaction Gateway",
            "criticalityTier": 3,
            "isInternetFacing": False,
            "controls": [
                {"controlCode": "MFA", "status": "IMPLEMENTED"},
                {"controlCode": "EDR", "status": "IMPLEMENTED"},
            ],
        },
        "vulnerability": {
            "cveId": "CVE-2021-44228",
            "cvssScore": 7.0,
            "cvssVersion": "3.1",
            "isKnownExploited": False,
            "knownRansomwareCampaignUse": None,
        },
    }


class TestRiskModelV1Core:
    def test_baseline_calculation_tier3(self, base_input_payload):
        # Tier 3 (1.00 weight), CVSS 7.0 -> Score should be exactly 70.00
        schema = RiskEvaluationInputSchema.model_validate(base_input_payload)
        result = RiskModelV1Calculator.evaluate(schema)

        assert result.risk_score == 70.00
        assert result.severity == RiskSeverity.HIGH
        assert result.model_version == "1.0.0"
        assert len(result.provenance_hash) == 64
        assert result.missing_data_warnings == []
        assert result.data_completeness_score == 1.0

        # Check factor breakdown
        factors = {f.name: f for f in result.factors}
        assert "CVSS_TECHNICAL_SEVERITY" in factors
        assert factors["CVSS_TECHNICAL_SEVERITY"].contribution == 70.0
        assert "ASSET_CRITICALITY_CONSEQUENCE" in factors
        assert factors["ASSET_CRITICALITY_CONSEQUENCE"].weight == 1.00
        assert factors["ASSET_CRITICALITY_CONSEQUENCE"].contribution == 0.0

    def test_criticality_tier_scaling(self, base_input_payload):
        cvss = 7.0
        # Expected scores for CVSS 7.0 across tiers:
        # Tier 1: 70 * 1.40 = 98.00 (CRITICAL)
        # Tier 2: 70 * 1.20 = 84.00 (HIGH)
        # Tier 3: 70 * 1.00 = 70.00 (HIGH)
        # Tier 4: 70 * 0.80 = 56.00 (MEDIUM)
        # Tier 5: 70 * 0.60 = 42.00 (MEDIUM)
        expected = {
            1: (98.00, RiskSeverity.CRITICAL),
            2: (84.00, RiskSeverity.HIGH),
            3: (70.00, RiskSeverity.HIGH),
            4: (56.00, RiskSeverity.MEDIUM),
            5: (42.00, RiskSeverity.MEDIUM),
        }

        for tier, (exp_score, exp_sev) in expected.items():
            payload = {
                **base_input_payload,
                "asset": {**base_input_payload["asset"], "criticalityTier": tier},
            }
            res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
            assert res.risk_score == exp_score
            assert res.severity == exp_sev

    def test_boundary_maximum_clamped_at_100(self, base_input_payload):
        # CVSS 10.0 on Tier 1 (1.40 weight) gives 140.0 raw -> clamped to 100.00
        payload = {
            **base_input_payload,
            "asset": {**base_input_payload["asset"], "criticalityTier": 1},
            "vulnerability": {**base_input_payload["vulnerability"], "cvssScore": 10.0},
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert res.risk_score == 100.00
        assert res.severity == RiskSeverity.CRITICAL

    def test_boundary_zero_cvss(self, base_input_payload):
        # CVSS 0.0 gives 0.00 score
        payload = {
            **base_input_payload,
            "vulnerability": {**base_input_payload["vulnerability"], "cvssScore": 0.0},
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert res.risk_score == 0.00
        assert res.severity == RiskSeverity.LOW

    def test_missing_cvss_handling(self, base_input_payload):
        # When CVSS is None: technical severity is not calculable, risk_score is None, severity is UNKNOWN
        payload = {
            **base_input_payload,
            "vulnerability": {**base_input_payload["vulnerability"], "cvssScore": None},
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert res.risk_score is None
        assert res.evaluation_status == "NOT_CALCULABLE"
        assert res.severity == RiskSeverity.UNKNOWN
        assert "MISSING_CVSS_SCORE" in res.missing_data_warnings
        assert res.data_completeness_score == 0.75  # 3 of 4 present

    def test_missing_controls_handling(self, base_input_payload):
        # When controls array is empty: generates INCOMPLETE_CONTROLS_DATA warning
        payload = {
            **base_input_payload,
            "asset": {**base_input_payload["asset"], "controls": []},
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert "INCOMPLETE_CONTROLS_DATA" in res.missing_data_warnings
        assert res.data_completeness_score == 0.75

    def test_controls_participate_as_context_not_arbitrary_reduction(self, base_input_payload):
        # Score must remain identical whether controls are implemented or not!
        # (Zero arbitrary percentage offsets rule)
        payload_with_controls = {
            **base_input_payload,
            "asset": {
                **base_input_payload["asset"],
                "controls": [
                    {"controlCode": "MFA", "status": "IMPLEMENTED"},
                    {"controlCode": "EDR", "status": "IMPLEMENTED"},
                    {"controlCode": "PAM", "status": "IMPLEMENTED"},
                ],
            },
        }
        payload_without_controls = {
            **base_input_payload,
            "asset": {
                **base_input_payload["asset"],
                "controls": [
                    {"controlCode": "MFA", "status": "NOT_IMPLEMENTED"},
                    {"controlCode": "EDR", "status": "NOT_IMPLEMENTED"},
                ],
            },
        }

        res_with = RiskModelV1Calculator.evaluate(
            RiskEvaluationInputSchema.model_validate(payload_with_controls)
        )
        res_without = RiskModelV1Calculator.evaluate(
            RiskEvaluationInputSchema.model_validate(payload_without_controls)
        )

        # Mathematical score must be identical (no unverified -30% reduction)
        assert res_with.risk_score == res_without.risk_score
        assert "COMPENSATING_CONTROLS_ACTIVE" in res_with.risk_flags
        assert "COMPENSATING_CONTROLS_ACTIVE" not in res_without.risk_flags

    def test_cisa_kev_active_exploitation_severity_floor(self, base_input_payload):
        # CVSS 3.5 on Tier 4 -> score 28.0 (normally LOW).
        # But if isKnownExploited == True, severity floor elevates it to MEDIUM!
        payload = {
            **base_input_payload,
            "asset": {**base_input_payload["asset"], "criticalityTier": 4},
            "vulnerability": {
                **base_input_payload["vulnerability"],
                "cvssScore": 3.5,
                "isKnownExploited": True,
            },
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert res.risk_score == 28.00  # Mathematical score is pure
        assert res.severity == RiskSeverity.MEDIUM  # Empirical floor elevated from LOW
        assert "CISA_KEV_ACTIVE_EXPLOITATION" in res.risk_flags

    def test_cisa_kev_high_cvss_elevation_floor(self, base_input_payload):
        # CVSS 7.0 on Tier 5 -> score 42.0 (normally MEDIUM).
        # But with active KEV on CVSS >= 7.0, severity floor elevates to HIGH!
        payload = {
            **base_input_payload,
            "asset": {**base_input_payload["asset"], "criticalityTier": 5},
            "vulnerability": {
                **base_input_payload["vulnerability"],
                "cvssScore": 7.0,
                "isKnownExploited": True,
            },
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert res.risk_score == 42.00
        assert res.severity == RiskSeverity.HIGH  # Floor elevated
        assert "CISA_KEV_ACTIVE_EXPLOITATION" in res.risk_flags

    def test_ransomware_association_flag(self, base_input_payload):
        payload = {
            **base_input_payload,
            "vulnerability": {
                **base_input_payload["vulnerability"],
                "isKnownExploited": True,
                "knownRansomwareCampaignUse": "Known",
            },
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert "RANSOMWARE_CAMPAIGN_ASSOCIATED" in res.risk_flags
        assert "CISA_KEV_ACTIVE_EXPLOITATION" in res.risk_flags

    def test_internet_facing_perimeter_flag(self, base_input_payload):
        payload = {
            **base_input_payload,
            "asset": {**base_input_payload["asset"], "isInternetFacing": True},
        }
        res = RiskModelV1Calculator.evaluate(RiskEvaluationInputSchema.model_validate(payload))
        assert "INTERNET_FACING_PERIMETER" in res.risk_flags
        # Ensure it didn't apply an arbitrary 1.25 multiplier
        assert res.risk_score == 70.00

    def test_deterministic_repeatability_and_provenance(self, base_input_payload):
        schema1 = RiskEvaluationInputSchema.model_validate(base_input_payload)
        schema2 = RiskEvaluationInputSchema.model_validate(base_input_payload)

        res1 = RiskModelV1Calculator.evaluate(schema1)
        res2 = RiskModelV1Calculator.evaluate(schema2)

        assert res1.risk_score == res2.risk_score
        assert res1.severity == res2.severity
        assert res1.provenance_hash == res2.provenance_hash
        assert res1.model_version == res2.model_version == "1.0.0"
        assert res1.model_dump(by_alias=True)["modelVersion"] == "1.0.0"

    def test_batch_evaluation(self, base_input_payload):
        batch = {
            "evaluations": [
                base_input_payload,
                {
                    **base_input_payload,
                    "asset": {**base_input_payload["asset"], "assetId": "srv-02", "criticalityTier": 1},
                },
            ]
        }
        batch_schema = BatchRiskEvaluationInputSchema.model_validate(batch)
        batch_result = RiskModelV1Calculator.evaluate_batch(batch_schema)

        assert batch_result.total_evaluated == 2
        assert len(batch_result.results) == 2
        assert batch_result.results[0].risk_score == 70.00
        assert batch_result.results[1].risk_score == 98.00
