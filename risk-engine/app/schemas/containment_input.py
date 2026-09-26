# =============================================================================
# CyberRiskOS — Active Breach Containment AI Agent Schemas
# Phase: Active Incident Response & Server Hacking Containment
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# =============================================================================

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class BreachContainmentInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    server_id: str = Field(..., alias="serverId")
    server_name: str = Field(..., alias="serverName")
    ip_address: Optional[str] = Field("192.168.1.100", alias="ipAddress")
    os_environment: Optional[str] = Field("Linux (Ubuntu/RHEL)", alias="osEnvironment")
    incident_type: str = Field(..., alias="incidentType")
    threat_severity: str = Field(default="CRITICAL", alias="threatSeverity")
    detected_anomalies: List[str] = Field(default_factory=list, alias="detectedAnomalies")
    affected_services: Optional[List[str]] = Field(default_factory=list, alias="affectedServices")


class ContainmentActionSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    action_id: str = Field(..., alias="actionId")
    step_number: int = Field(..., alias="stepNumber")
    title: str = Field(..., alias="title")
    category: str = Field(..., alias="category")
    command: str = Field(..., alias="command")
    execution_type: str = Field(default="AUTOMATED_CLI", alias="executionType")
    impact_assessment: str = Field(..., alias="impactAssessment")
    verification_check: str = Field(..., alias="verificationCheck")


class BreachContainmentResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    containment_id: str = Field(..., alias="containmentId")
    server_id: str = Field(..., alias="serverId")
    server_name: str = Field(..., alias="serverName")
    threat_level: str = Field(..., alias="threatLevel")
    containment_status: str = Field(default="PLAYBOOK_GENERATED", alias="containmentStatus")
    mitigation_summary: str = Field(..., alias="mitigationSummary")
    actions: List[ContainmentActionSchema] = Field(default_factory=list, alias="actions")
    estimated_financial_saved_inr: float = Field(..., alias="estimatedFinancialSavedInr")
    unchecked_loss_inr: float = Field(..., alias="uncheckedLossInr")
    contained_loss_inr: float = Field(..., alias="containedLossInr")
    compliance_mandates: List[str] = Field(default_factory=list, alias="complianceMandates")
    automated_script_bash: str = Field(..., alias="automatedScriptBash")
    automated_script_powershell: str = Field(..., alias="automatedScriptPowershell")
    evaluated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        alias="evaluatedAt"
    )
    model_version: str = Field(default="1.0.0", alias="modelVersion")
