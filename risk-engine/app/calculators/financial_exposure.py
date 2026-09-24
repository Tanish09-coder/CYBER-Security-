# =============================================================================
# CyberRiskOS — Financial Exposure & EAL Deterministic Calculator Core
# Phase: Phase 3 — Financial Exposure / EAL Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/FINANCIAL_MODEL.md
# =============================================================================

from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple

from app.schemas.financial_input import (
    FinancialExposureInputSchema,
    FinancialExposureResultSchema,
    BatchFinancialExposureInputSchema,
    BatchFinancialExposureResultSchema,
    FinancialFactorExplanationSchema,
)
from app.models.risk_entity import ProvenanceHasher



class FinancialExposureCalculator:
    """
    Deterministic Financial Exposure and Estimated Annualized Loss (EAL) Calculator.
    Computes Single Loss Expectancy (SLE), Annual Loss Event Frequency (ALEF),
    and Estimated Annualized Loss (EAL = ALEF * SLE) in fiat currency.
    Strictly labeled MODELED / ESTIMATED.
    Requires authoritative business impact inputs from enterprise contracts.
    """

    MODEL_VERSION: str = "1.0.0"

    @classmethod
    def evaluate(cls, payload: FinancialExposureInputSchema) -> FinancialExposureResultSchema:
        asset = payload.asset
        vuln = payload.vulnerability

        missing_data_warnings: List[str] = []
        factors: List[FinancialFactorExplanationSchema] = []

        # ---------------------------------------------------------------------
        # 1. Authoritative Estimated Outage Duration (Hours)
        # ---------------------------------------------------------------------
        if asset.estimated_outage_hours is not None and asset.estimated_outage_hours >= 0.0:
            outage_hours = round(float(asset.estimated_outage_hours), 2)
            factors.append(
                FinancialFactorExplanationSchema(
                    name="DOWNTIME_OUTAGE_HOURS",
                    category="OPERATIONAL_IMPACT",
                    value=outage_hours,
                    amount=outage_hours,
                    rationale=f"Authoritative estimated outage duration: {outage_hours:.2f} hours.",
                )
            )
        else:
            outage_hours = None
            missing_data_warnings.append("MISSING_ESTIMATED_OUTAGE_HOURS")
            factors.append(
                FinancialFactorExplanationSchema(
                    name="DOWNTIME_OUTAGE_HOURS",
                    category="OPERATIONAL_IMPACT",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="Estimated outage hours are NOT_AVAILABLE. Outage duration is not fabricated without authoritative enterprise operational inputs.",
                )
            )

        # ---------------------------------------------------------------------
        # 2. Authoritative Hourly Downtime Rate
        # ---------------------------------------------------------------------
        if asset.hourly_downtime_cost is not None and asset.hourly_downtime_cost >= 0.0:
            hourly_rate = float(asset.hourly_downtime_cost)
            factors.append(
                FinancialFactorExplanationSchema(
                    name="HOURLY_DOWNTIME_RATE",
                    category="BUSINESS_CONSEQUENCE",
                    value=hourly_rate,
                    amount=hourly_rate,
                    rationale=f"Configured enterprise asset downtime rate: {hourly_rate:,.2f} {asset.currency}/hr.",
                )
            )
        else:
            hourly_rate = None
            missing_data_warnings.append("MISSING_HOURLY_DOWNTIME_RATE")
            factors.append(
                FinancialFactorExplanationSchema(
                    name="HOURLY_DOWNTIME_RATE",
                    category="BUSINESS_CONSEQUENCE",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="Hourly downtime cost rate is NOT_AVAILABLE. Rates are not fabricated without authoritative enterprise financial contracts.",
                )
            )

        # ---------------------------------------------------------------------
        # 3. Primary Loss (Downtime Interruption)
        # ---------------------------------------------------------------------
        if outage_hours is not None and hourly_rate is not None:
            primary_loss = round(outage_hours * hourly_rate, 2)
            factors.append(
                FinancialFactorExplanationSchema(
                    name="PRIMARY_DOWNTIME_LOSS",
                    category="PRIMARY_LOSS",
                    value=f"{outage_hours} hrs * {hourly_rate} {asset.currency}",
                    amount=primary_loss,
                    rationale=f"Total primary downtime business interruption loss ({outage_hours} hrs * {hourly_rate:,.2f} {asset.currency}/hr).",
                )
            )
        else:
            primary_loss = None
            factors.append(
                FinancialFactorExplanationSchema(
                    name="PRIMARY_DOWNTIME_LOSS",
                    category="PRIMARY_LOSS",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="Primary downtime loss is NOT_AVAILABLE due to missing outage hours or hourly downtime rate.",
                )
            )

        # ---------------------------------------------------------------------
        # 4. Secondary Loss (Incident Response & Forensic Recovery)
        # ---------------------------------------------------------------------
        if asset.recovery_cost is not None and asset.recovery_cost >= 0.0:
            secondary_loss = round(float(asset.recovery_cost), 2)
            factors.append(
                FinancialFactorExplanationSchema(
                    name="SECONDARY_RECOVERY_COST",
                    category="SECONDARY_LOSS",
                    value=secondary_loss,
                    amount=secondary_loss,
                    rationale=f"Authoritative enterprise recovery and incident response cost: {secondary_loss:,.2f} {asset.currency}.",
                )
            )
        else:
            secondary_loss = None
            missing_data_warnings.append("MISSING_RECOVERY_COST")
            factors.append(
                FinancialFactorExplanationSchema(
                    name="SECONDARY_RECOVERY_COST",
                    category="SECONDARY_LOSS",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="Secondary recovery cost is NOT_AVAILABLE due to missing authoritative recovery cost input.",
                )
            )

        # ---------------------------------------------------------------------
        # 5. Single Loss Expectancy (SLE)
        # ---------------------------------------------------------------------
        if primary_loss is not None and secondary_loss is not None:
            sle = round(primary_loss + secondary_loss, 2)
            sle_status = "CALCULATED"
            factors.append(
                FinancialFactorExplanationSchema(
                    name="SINGLE_LOSS_EXPECTANCY",
                    category="TOTAL_INCIDENT_IMPACT",
                    value=sle,
                    amount=sle,
                    rationale=f"Single Loss Expectancy (SLE = Primary Loss {primary_loss:,.2f} + Secondary Loss {secondary_loss:,.2f}).",
                )
            )
        else:
            sle = None
            sle_status = "NOT_AVAILABLE"
            missing_data_warnings.append("SLE_NOT_AVAILABLE")
            factors.append(
                FinancialFactorExplanationSchema(
                    name="SINGLE_LOSS_EXPECTANCY",
                    category="TOTAL_INCIDENT_IMPACT",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="Single Loss Expectancy (SLE) is NOT_AVAILABLE because required monetary/business-impact inputs are missing.",
                )
            )

        # ---------------------------------------------------------------------
        # 6. Annual Loss Event Frequency (ALEF) & Estimated Annualized Loss (EAL)
        # ---------------------------------------------------------------------
        input_alef = getattr(vuln, "annualized_loss_event_frequency", None)
        if input_alef is None:
            input_alef = getattr(asset, "annualized_loss_event_frequency", None)

        if sle is not None and input_alef is not None and input_alef >= 0.0:
            alef = round(float(input_alef), 4)
            eal = round(alef * sle, 2)
            eal_status = "CALCULATED"
            factors.append(
                FinancialFactorExplanationSchema(
                    name="ANNUAL_EVENT_FREQUENCY",
                    category="FREQUENCY_ESTIMATE",
                    value=alef,
                    amount=alef,
                    rationale=f"Authoritative annualized loss event frequency (ALEF): {alef:.4f} events/year (user/telemetry provided).",
                )
            )
            factors.append(
                FinancialFactorExplanationSchema(
                    name="ESTIMATED_ANNUALIZED_LOSS",
                    category="ANNUALIZED_EXPOSURE",
                    value=eal,
                    amount=eal,
                    rationale=f"Estimated Annualized Loss (EAL = {alef:.4f} events/yr * {sle:,.2f} {asset.currency} SLE).",
                )
            )
        else:
            alef = round(float(input_alef), 4) if (input_alef is not None and input_alef >= 0.0) else None
            eal = None
            eal_status = "NOT_AVAILABLE"
            if alef is None:
                missing_data_warnings.append("ANNUAL_LOSS_EVENT_FREQUENCY_UNSPECIFIED")
                factors.append(
                    FinancialFactorExplanationSchema(
                        name="ANNUAL_EVENT_FREQUENCY",
                        category="FREQUENCY_ESTIMATE",
                        value=None,
                        amount=0.0,
                        rationale="Annual Loss Event Frequency (ALEF) is NOT_AVAILABLE. Frequency is not fabricated without empirical telemetry.",
                    )
                )
            else:
                factors.append(
                    FinancialFactorExplanationSchema(
                        name="ANNUAL_EVENT_FREQUENCY",
                        category="FREQUENCY_ESTIMATE",
                        value=alef,
                        amount=alef,
                        rationale=f"Authoritative annualized loss event frequency (ALEF): {alef:.4f} events/year, but SLE is NOT_AVAILABLE.",
                    )
                )

            factors.append(
                FinancialFactorExplanationSchema(
                    name="ESTIMATED_ANNUALIZED_LOSS",
                    category="ANNUALIZED_EXPOSURE",
                    value="NOT_AVAILABLE",
                    amount=0.0,
                    rationale="EAL is NOT_AVAILABLE because required monetary/business-impact inputs or event frequency are missing.",
                )
            )

        # ---------------------------------------------------------------------
        # 7. Data Completeness & Provenance
        # ---------------------------------------------------------------------
        has_outage = outage_hours is not None
        has_hourly_rate = hourly_rate is not None
        has_recovery = secondary_loss is not None
        has_exposure = asset.is_internet_facing is not None
        has_alef = alef is not None

        completeness_pts = sum([
            1.0 if has_outage else 0.0,
            1.0 if has_hourly_rate else 0.0,
            1.0 if has_recovery else 0.0,
            1.0 if has_exposure else 0.0,
            1.0 if has_alef else 0.0,
        ])
        data_completeness = round(completeness_pts / 5.0, 2)

        raw_input_dict = payload.model_dump(by_alias=True)
        provenance_hash = ProvenanceHasher.compute_hash(raw_input_dict)
        evaluated_at = datetime.now(timezone.utc).isoformat()

        return FinancialExposureResultSchema(
            assetId=asset.asset_id,
            assetName=asset.asset_name,
            cveId=vuln.cve_id,
            sle=sle,
            sleStatus=sle_status,
            alef=alef,
            eal=eal,
            ealStatus=eal_status,
            currency=asset.currency,
            primaryLoss=primary_loss,
            secondaryLoss=secondary_loss,
            estimatedOutageHours=outage_hours,
            hourlyDowntimeRate=hourly_rate,
            recoveryCost=secondary_loss,
            factors=factors,
            missingDataWarnings=missing_data_warnings,
            dataCompletenessScore=data_completeness,
            modelVersion=cls.MODEL_VERSION,
            provenanceHash=provenance_hash,
            isEstimated=True,
            evaluatedAt=evaluated_at,
        )

    @classmethod
    def evaluate_batch(
        cls, batch_input: BatchFinancialExposureInputSchema
    ) -> BatchFinancialExposureResultSchema:
        results: List[FinancialExposureResultSchema] = []
        available_eals: List[float] = []
        currency = "USD"

        for item in batch_input.evaluations:
            res = cls.evaluate(item)
            results.append(res)
            if res.eal is not None:
                available_eals.append(res.eal)
            currency = res.currency

        total_eal = round(sum(available_eals), 2) if available_eals else None

        return BatchFinancialExposureResultSchema(
            results=results,
            totalEvaluated=len(results),
            totalModeledEal=total_eal,
            availableEalCount=len(available_eals),
            currency=currency,
            modelVersion=cls.MODEL_VERSION,
        )
