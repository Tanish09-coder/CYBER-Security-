# =============================================================================
# CyberRiskOS — Financial Exposure & EAL Pydantic v2 Schemas
# Phase: Phase 3 — Financial Exposure / EAL Engine
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/FINANCIAL_MODEL.md
# =============================================================================

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class AvailabilityImpact(str, Enum):
    HIGH = "HIGH"
    LOW = "LOW"
    NONE = "NONE"


class CvssScope(str, Enum):
    UNCHANGED = "UNCHANGED"
    CHANGED = "CHANGED"


class FinancialFactorExplanationSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str
    category: str
    value: Any
    amount: Optional[float] = None
    rationale: str


class FinancialAssetInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId")
    asset_name: str = Field(..., alias="assetName")
    criticality_tier: Optional[int] = Field(None, ge=1, le=5, alias="criticalityTier")
    is_internet_facing: Optional[bool] = Field(None, alias="isInternetFacing")
    hourly_downtime_cost: Optional[float] = Field(None, ge=0.0, alias="hourlyDowntimeCost")
    recovery_cost: Optional[float] = Field(None, ge=0.0, alias="recoveryCost")
    estimated_outage_hours: Optional[float] = Field(None, ge=0.0, alias="estimatedOutageHours")
    annualized_loss_event_frequency: Optional[float] = Field(None, ge=0.0, alias="annualizedLossEventFrequency")
    currency: str = Field(default="USD", max_length=10)


class FinancialVulnerabilityInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    cve_id: str = Field(..., alias="cveId")
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0, alias="cvssScore")
    availability_impact: Optional[str] = Field("HIGH", alias="availabilityImpact")
    scope: Optional[str] = Field("UNCHANGED", alias="scope")
    is_known_exploited: bool = Field(default=False, alias="isKnownExploited")
    known_ransomware_campaign_use: Optional[str] = Field(None, alias="knownRansomwareCampaignUse")
    annualized_loss_event_frequency: Optional[float] = Field(None, ge=0.0, alias="annualizedLossEventFrequency")


class FinancialExposureInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset: FinancialAssetInputSchema
    vulnerability: FinancialVulnerabilityInputSchema


class FinancialExposureResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId")
    asset_name: str = Field(..., alias="assetName")
    cve_id: str = Field(..., alias="cveId")
    sle: Optional[float] = Field(None, ge=0.0, description="Single Loss Expectancy in fiat currency (None if unavailable)")
    sle_status: str = Field("CALCULATED", alias="sleStatus", description="'CALCULATED' or 'NOT_AVAILABLE'")
    alef: Optional[float] = Field(None, ge=0.0, description="Annual Loss Event Frequency (None if unspecified)")
    eal: Optional[float] = Field(None, ge=0.0, description="Estimated Annualized Loss (ALEF * SLE, None if ALEF unspecified)")
    eal_status: str = Field("CALCULATED", alias="ealStatus", description="'CALCULATED' or 'NOT_AVAILABLE'")
    currency: str = Field(default="USD")
    primary_loss: Optional[float] = Field(None, ge=0.0, alias="primaryLoss", description="Downtime loss (None if unavailable)")
    secondary_loss: Optional[float] = Field(None, ge=0.0, alias="secondaryLoss", description="Response and recovery loss (None if unavailable)")
    estimated_outage_hours: Optional[float] = Field(None, ge=0.0, alias="estimatedOutageHours")
    hourly_downtime_rate: Optional[float] = Field(None, ge=0.0, alias="hourlyDowntimeRate")
    recovery_cost: Optional[float] = Field(None, ge=0.0, alias="recoveryCost")
    factors: List[FinancialFactorExplanationSchema] = Field(default_factory=list)
    missing_data_warnings: List[str] = Field(default_factory=list, alias="missingDataWarnings")
    data_completeness_score: float = Field(..., ge=0.0, le=1.0, alias="dataCompletenessScore")
    model_version: str = Field("1.0.0", alias="modelVersion")
    provenance_hash: str = Field(..., alias="provenanceHash", min_length=64, max_length=64)
    is_estimated: bool = Field(True, alias="isEstimated")
    evaluated_at: str = Field(..., alias="evaluatedAt")


class BatchFinancialExposureInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    evaluations: List[FinancialExposureInputSchema] = Field(..., min_length=1, max_length=500)


class BatchFinancialExposureResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    results: List[FinancialExposureResultSchema]
    total_evaluated: int = Field(..., ge=0, alias="totalEvaluated")
    total_modeled_eal: Optional[float] = Field(None, ge=0.0, alias="totalModeledEal")
    available_eal_count: int = Field(default=0, ge=0, alias="availableEalCount")
    currency: str = Field(default="USD")
    model_version: str = Field("1.0.0", alias="modelVersion")
