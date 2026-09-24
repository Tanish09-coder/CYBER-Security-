# =============================================================================
# CyberRiskOS — Financial Exposure & EAL Unit Tests
# Phase: Phase 3 — Financial Exposure / EAL Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/FINANCIAL_MODEL.md
# =============================================================================

import pytest
from app.schemas.financial_input import (
    FinancialExposureInputSchema,
    FinancialAssetInputSchema,
    FinancialVulnerabilityInputSchema,
    BatchFinancialExposureInputSchema,
)
from app.calculators.financial_exposure import FinancialExposureCalculator


@pytest.fixture
def tier1_asset_input():
    return FinancialAssetInputSchema(
        assetId="asset-tier1-switch",
        assetName="SWIFT Core Payment Switch",
        criticalityTier=1,
        isInternetFacing=True,
        hourlyDowntimeCost=10000.0,
        recoveryCost=75000.0,
        estimatedOutageHours=36.0,
        annualizedLossEventFrequency=1.20,
        currency="USD",
    )


@pytest.fixture
def tier5_asset_input():
    return FinancialAssetInputSchema(
        assetId="asset-tier5-dev",
        assetName="Ephemeral Test Box",
        criticalityTier=5,
        isInternetFacing=False,
        annualizedLossEventFrequency=0.04,
        currency="USD",
    )


@pytest.fixture
def high_cvss_vuln_input():
    return FinancialVulnerabilityInputSchema(
        cveId="CVE-2021-44228",
        cvssScore=10.0,
        availabilityImpact="HIGH",
        scope="CHANGED",
        isKnownExploited=True,
        knownRansomwareCampaignUse="Known",
    )


@pytest.fixture
def low_cvss_vuln_input():
    return FinancialVulnerabilityInputSchema(
        cveId="CVE-2023-0001",
        cvssScore=4.0,
        availabilityImpact="LOW",
        scope="UNCHANGED",
        isKnownExploited=False,
    )


class TestFinancialExposureCalculator:
    def test_tier1_ransomware_eal_calculation(self, tier1_asset_input, high_cvss_vuln_input):
        payload = FinancialExposureInputSchema(
            asset=tier1_asset_input,
            vulnerability=high_cvss_vuln_input,
        )

        res = FinancialExposureCalculator.evaluate(payload)

        # Authoritative Outage
        assert res.estimated_outage_hours == 36.0
        # Authoritative Primary Loss: 36.0h * $10,000 = $360,000.00
        assert res.primary_loss == 360000.0
        # Authoritative Secondary Loss: $75,000.00
        assert res.secondary_loss == 75000.0
        # SLE = Primary + Secondary = $435,000.00
        assert res.sle == 435000.0
        assert res.sle_status == "CALCULATED"
        # Explicit ALEF provided: 1.20 events/yr
        assert res.alef == 1.20
        # EAL: 1.20 * 435,000 = 522,000.00
        assert res.eal == 522000.0
        assert res.eal_status == "CALCULATED"
        assert res.currency == "USD"
        assert res.is_estimated is True
        assert len(res.provenance_hash) == 64

    def test_missing_alef_yields_not_available_eal(self, high_cvss_vuln_input):
        asset_without_freq = FinancialAssetInputSchema(
            assetId="asset-no-freq",
            assetName="Unprofiled Server",
            criticalityTier=2,
            isInternetFacing=True,
            hourlyDowntimeCost=5000.0,
            recoveryCost=25000.0,
            estimatedOutageHours=10.0,
            annualizedLossEventFrequency=None,
        )
        payload = FinancialExposureInputSchema(
            asset=asset_without_freq,
            vulnerability=high_cvss_vuln_input,
        )

        res = FinancialExposureCalculator.evaluate(payload)

        # SLE remains calculated and valid
        assert res.sle == 75000.0
        assert res.sle_status == "CALCULATED"
        # Frequency is NOT fabricated from CVSS/KEV
        assert res.alef is None
        assert res.eal is None
        assert res.eal_status == "NOT_AVAILABLE"
        assert "ANNUAL_LOSS_EVENT_FREQUENCY_UNSPECIFIED" in res.missing_data_warnings

    def test_missing_inputs_yield_not_available_sle_and_eal(self, tier5_asset_input, low_cvss_vuln_input):
        payload = FinancialExposureInputSchema(
            asset=tier5_asset_input,
            vulnerability=low_cvss_vuln_input,
        )

        res = FinancialExposureCalculator.evaluate(payload)

        # No invented baseline rates, outage hours, or recovery costs
        assert res.hourly_downtime_rate is None
        assert res.estimated_outage_hours is None
        assert res.recovery_cost is None
        assert res.primary_loss is None
        assert res.secondary_loss is None
        assert res.sle is None
        assert res.sle_status == "NOT_AVAILABLE"
        assert res.eal is None
        assert res.eal_status == "NOT_AVAILABLE"
        assert "MISSING_ESTIMATED_OUTAGE_HOURS" in res.missing_data_warnings
        assert "MISSING_HOURLY_DOWNTIME_RATE" in res.missing_data_warnings
        assert "MISSING_RECOVERY_COST" in res.missing_data_warnings

    def test_configured_inputs_yield_exact_calculation(self, low_cvss_vuln_input):
        asset_configured = FinancialAssetInputSchema(
            assetId="asset-tier5-configured",
            assetName="Ephemeral Test Box",
            criticalityTier=5,
            isInternetFacing=False,
            hourlyDowntimeCost=100.0,
            recoveryCost=25000.0,
            estimatedOutageHours=4.0,
            annualizedLossEventFrequency=0.04,
            currency="USD",
        )
        payload = FinancialExposureInputSchema(
            asset=asset_configured,
            vulnerability=low_cvss_vuln_input,
        )

        res = FinancialExposureCalculator.evaluate(payload)

        assert res.hourly_downtime_rate == 100.0
        assert res.estimated_outage_hours == 4.0
        assert res.primary_loss == 400.0
        assert res.secondary_loss == 25000.0
        assert res.sle == 25400.0
        assert res.sle_status == "CALCULATED"
        assert res.alef == 0.04
        assert res.eal == 1016.0
        assert res.eal_status == "CALCULATED"

    def test_batch_financial_evaluation(self, tier1_asset_input, tier5_asset_input, high_cvss_vuln_input, low_cvss_vuln_input):
        batch_input = BatchFinancialExposureInputSchema(
            evaluations=[
                FinancialExposureInputSchema(asset=tier1_asset_input, vulnerability=high_cvss_vuln_input),
                FinancialExposureInputSchema(asset=tier5_asset_input, vulnerability=low_cvss_vuln_input),
            ]
        )

        batch_res = FinancialExposureCalculator.evaluate_batch(batch_input)
        assert batch_res.total_evaluated == 2
        # tier1 has authoritative EAL (522,000.0), tier5 is NOT_AVAILABLE
        assert batch_res.available_eal_count == 1
        assert batch_res.total_modeled_eal == 522000.0
        assert len(batch_res.results) == 2
