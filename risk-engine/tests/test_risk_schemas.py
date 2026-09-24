# =============================================================================
# CyberRiskOS — Risk Engine v1 Pydantic Schema Tests
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

import pytest
from pydantic import ValidationError

from app.schemas.risk_input import (
    ControlStatus,
    ControlSource,
    RiskSeverity,
    FactorCategory,
    ControlContextSchema,
    VulnerabilityRiskInputSchema,
    AssetRiskInputSchema,
    RiskEvaluationInputSchema,
    FactorExplanationSchema,
    RiskEvaluationResultSchema,
    BatchRiskEvaluationInputSchema,
    BatchRiskEvaluationResultSchema,
)


class TestVulnerabilityRiskInputSchema:
    def test_valid_vulnerability_with_aliases(self):
        data = {
            "cveId": "CVE-2021-44228",
            "cvssScore": 10.0,
            "cvssVersion": "3.1",
            "isKnownExploited": True,
            "knownRansomwareCampaignUse": "Known",
            "sourceIdentifier": "cve@mitre.org",
        }
        schema = VulnerabilityRiskInputSchema.model_validate(data)
        assert schema.cve_id == "CVE-2021-44228"
        assert schema.cvss_score == 10.0
        assert schema.is_known_exploited is True
        assert schema.known_ransomware_campaign_use == "Known"

    def test_null_cvss_score_accepted(self):
        data = {
            "cveId": "CVE-2026-99999",
            "cvssScore": None,
            "isKnownExploited": False,
        }
        schema = VulnerabilityRiskInputSchema.model_validate(data)
        assert schema.cvss_score is None

    def test_cvss_out_of_bounds_rejected(self):
        with pytest.raises(ValidationError):
            VulnerabilityRiskInputSchema(cveId="CVE-2021-44228", cvssScore=10.1)

        with pytest.raises(ValidationError):
            VulnerabilityRiskInputSchema(cveId="CVE-2021-44228", cvssScore=-0.1)

    def test_invalid_cve_format_rejected(self):
        with pytest.raises(ValidationError):
            VulnerabilityRiskInputSchema(cveId="INVALID-CVE-ID", cvssScore=7.5)


class TestAssetRiskInputSchema:
    def test_valid_asset_all_criticality_tiers(self):
        for tier in [1, 2, 3, 4, 5]:
            data = {
                "assetId": f"asset-{tier}",
                "assetName": f"Database Server {tier}",
                "criticalityTier": tier,
                "isInternetFacing": tier <= 2,
                "controls": [
                    {"controlCode": "MFA", "status": "IMPLEMENTED", "source": "AUDIT_VERIFIED"}
                ],
            }
            schema = AssetRiskInputSchema.model_validate(data)
            assert schema.criticality_tier == tier
            assert len(schema.controls) == 1
            assert schema.controls[0].status == ControlStatus.IMPLEMENTED

    def test_invalid_criticality_tier_rejected(self):
        for invalid_tier in [0, 6, -1]:
            with pytest.raises(ValidationError):
                AssetRiskInputSchema(
                    assetId="srv-01",
                    assetName="Core Server",
                    criticalityTier=invalid_tier,
                )

    def test_invalid_control_status_rejected(self):
        with pytest.raises(ValidationError):
            ControlContextSchema(
                controlCode="EDR",
                status="NON_EXISTENT_STATUS",  # type: ignore
            )


class TestRiskEvaluationInputSchema:
    def test_atomic_evaluation_unit(self):
        payload = {
            "asset": {
                "assetId": "srv-finance-01",
                "assetName": "SWIFT Transaction Node",
                "criticalityTier": 1,
                "isInternetFacing": True,
            },
            "vulnerability": {
                "cveId": "CVE-2021-44228",
                "cvssScore": 10.0,
                "isKnownExploited": True,
                "knownRansomwareCampaignUse": "Known",
            },
        }
        schema = RiskEvaluationInputSchema.model_validate(payload)
        assert schema.asset.asset_id == "srv-finance-01"
        assert schema.asset.criticality_tier == 1
        assert schema.vulnerability.cve_id == "CVE-2021-44228"
        assert schema.vulnerability.is_known_exploited is True

    def test_batch_evaluation_input(self):
        payload = {
            "evaluations": [
                {
                    "asset": {
                        "assetId": "srv-01",
                        "assetName": "Web App",
                        "criticalityTier": 2,
                        "isInternetFacing": True,
                    },
                    "vulnerability": {
                        "cveId": "CVE-2023-34362",
                        "cvssScore": 9.8,
                        "isKnownExploited": True,
                    },
                }
            ]
        }
        batch = BatchRiskEvaluationInputSchema.model_validate(payload)
        assert len(batch.evaluations) == 1


class TestRiskEvaluationResultSchema:
    def test_valid_deterministic_result(self):
        data = {
            "assetId": "srv-01",
            "assetName": "SWIFT Node",
            "cveId": "CVE-2021-44228",
            "baseCvss": 10.0,
            "riskScore": 100.0,
            "severity": "CRITICAL",
            "factors": [
                {
                    "name": "CVSS_TECHNICAL_SEVERITY",
                    "category": "TECHNICAL_SEVERITY",
                    "value": 10.0,
                    "weight": 1.0,
                    "contribution": 100.0,
                    "rationale": "Intrinsic technical flaw severity from NIST NVD.",
                }
            ],
            "missingDataWarnings": [],
            "dataCompletenessScore": 1.0,
            "riskFlags": ["RANSOMWARE_CAMPAIGN_ASSOCIATED"],
            "modelVersion": "1.0.0",
            "provenanceHash": "a" * 64,
            "evaluatedAt": "2026-09-24T12:00:00Z",
        }
        res = RiskEvaluationResultSchema.model_validate(data)
        assert res.risk_score == 100.0
        assert res.severity == RiskSeverity.CRITICAL
        assert res.model_version == "1.0.0"
        assert len(res.provenance_hash) == 64

    def test_risk_score_bounds(self):
        base = {
            "assetId": "srv-01",
            "assetName": "SWIFT Node",
            "cveId": "CVE-2021-44228",
            "baseCvss": 10.0,
            "severity": "CRITICAL",
            "factors": [],
            "missingDataWarnings": [],
            "dataCompletenessScore": 1.0,
            "modelVersion": "1.0.0",
            "provenanceHash": "f" * 64,
            "evaluatedAt": "2026-09-24T12:00:00Z",
        }
        with pytest.raises(ValidationError):
            RiskEvaluationResultSchema.model_validate({**base, "riskScore": 100.1})

        with pytest.raises(ValidationError):
            RiskEvaluationResultSchema.model_validate({**base, "riskScore": -0.5})

    def test_provenance_hash_length_enforced(self):
        base = {
            "assetId": "srv-01",
            "assetName": "SWIFT Node",
            "cveId": "CVE-2021-44228",
            "baseCvss": 10.0,
            "riskScore": 85.0,
            "severity": "HIGH",
            "factors": [],
            "missingDataWarnings": [],
            "dataCompletenessScore": 1.0,
            "modelVersion": "1.0.0",
            "evaluatedAt": "2026-09-24T12:00:00Z",
        }
        # Shorter than 64
        with pytest.raises(ValidationError):
            RiskEvaluationResultSchema.model_validate({**base, "provenanceHash": "short-hash"})
