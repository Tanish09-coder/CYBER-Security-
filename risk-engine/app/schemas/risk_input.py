# =============================================================================
# CyberRiskOS — Risk Engine v1 Pydantic Input/Output Schemas
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ControlStatus(str, Enum):
    IMPLEMENTED = "IMPLEMENTED"
    PARTIAL = "PARTIAL"
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED"
    UNKNOWN = "UNKNOWN"


class ControlSource(str, Enum):
    USER_CONFIG = "USER_CONFIG"
    SCANNER_IMPORT = "SCANNER_IMPORT"
    AUDIT_VERIFIED = "AUDIT_VERIFIED"


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


class FactorCategory(str, Enum):
    TECHNICAL_SEVERITY = "TECHNICAL_SEVERITY"
    THREAT_INTEL = "THREAT_INTEL"
    BUSINESS_CONTEXT = "BUSINESS_CONTEXT"
    DEFENSIVE_POSTURE = "DEFENSIVE_POSTURE"


# -----------------------------------------------------------------------------
# Input Schemas
# -----------------------------------------------------------------------------

class ControlContextSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    control_code: str = Field(..., alias="controlCode", min_length=1)
    status: ControlStatus
    source: Optional[ControlSource] = None


class VulnerabilityRiskInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cve_id: str = Field(..., alias="cveId", min_length=1)
    cvss_score: Optional[float] = Field(None, ge=0.0, le=10.0, alias="cvssScore")
    cvss_version: Optional[str] = Field(None, alias="cvssVersion")
    is_known_exploited: bool = Field(False, alias="isKnownExploited")
    known_ransomware_campaign_use: Optional[str] = Field(None, alias="knownRansomwareCampaignUse")
    source_identifier: Optional[str] = Field(None, alias="sourceIdentifier")

    @field_validator("cve_id")
    @classmethod
    def validate_cve_id(cls, v: str) -> str:
        v_upper = v.strip().upper()
        if not v_upper.startswith("CVE-"):
            raise ValueError(f"Invalid CVE identifier format: {v}")
        return v_upper


class AssetRiskInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    asset_id: str = Field(..., alias="assetId", min_length=1)
    asset_name: str = Field(..., alias="assetName", min_length=1)
    criticality_tier: Optional[int] = Field(None, ge=1, le=5, alias="criticalityTier")
    is_internet_facing: Optional[bool] = Field(None, alias="isInternetFacing")
    business_unit_id: Optional[str] = Field(None, alias="businessUnitId")
    business_unit_name: Optional[str] = Field(None, alias="businessUnitName")
    controls: Optional[List[ControlContextSchema]] = Field(default=None, alias="controls")


class RiskEvaluationInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    asset: AssetRiskInputSchema
    vulnerability: VulnerabilityRiskInputSchema


class BatchRiskEvaluationInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    evaluations: List[RiskEvaluationInputSchema] = Field(..., min_length=1, max_length=500)


# -----------------------------------------------------------------------------
# Output Schemas
# -----------------------------------------------------------------------------

class FactorExplanationSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    category: FactorCategory
    value: Any
    weight: float
    contribution: Optional[float]
    rationale: str


class RiskEvaluationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    asset_id: str = Field(..., alias="assetId")
    asset_name: str = Field(..., alias="assetName")
    cve_id: str = Field(..., alias="cveId")
    base_cvss: Optional[float] = Field(None, ge=0.0, le=10.0, alias="baseCvss")
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0, alias="riskScore")
    evaluation_status: str = Field("CALCULATED", alias="evaluationStatus")
    severity: RiskSeverity
    factors: List[FactorExplanationSchema]
    missing_data_warnings: List[str] = Field(default_factory=list, alias="missingDataWarnings")
    data_completeness_score: float = Field(..., ge=0.0, le=1.0, alias="dataCompletenessScore")
    risk_flags: List[str] = Field(default_factory=list, alias="riskFlags")
    model_version: str = Field("1.0.0", alias="modelVersion")
    provenance_hash: str = Field(..., alias="provenanceHash", min_length=64, max_length=64)
    evaluated_at: str = Field(..., alias="evaluatedAt")


class BatchRiskEvaluationResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    results: List[RiskEvaluationResultSchema]
    total_evaluated: int = Field(..., ge=0, alias="totalEvaluated")
    model_version: str = Field("1.0.0", alias="modelVersion")
