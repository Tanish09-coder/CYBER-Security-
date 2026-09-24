# =============================================================================
# CyberRiskOS — Attack Path Graph Pydantic Schemas
# Phase: Phase 7B — Attack Path Intelligence
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/ATTACK_PATH_MODEL.md
# =============================================================================

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class EdgeType(str, Enum):
    NETWORK_EXPOSURE = "NETWORK_EXPOSURE"
    VULNERABILITY_EXPLOIT = "VULNERABILITY_EXPLOIT"
    TRUST_RELATIONSHIP = "TRUST_RELATIONSHIP"


class GraphNodeSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId")
    name: str
    ip_address: Optional[str] = Field(None, alias="ipAddress")
    criticality_tier: int = Field(..., ge=1, le=5, alias="criticalityTier")
    is_internet_facing: bool = Field(default=False, alias="isInternetFacing")
    business_unit_id: Optional[str] = Field(None, alias="businessUnitId")


class GraphEdgeSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    edge_id: str = Field(..., alias="edgeId")
    source_asset_id: str = Field(..., alias="sourceAssetId")
    target_asset_id: str = Field(..., alias="targetAssetId")
    edge_type: EdgeType = Field(default=EdgeType.NETWORK_EXPOSURE, alias="edgeType")
    risk_weight: float = Field(..., ge=0.0, le=100.0, alias="riskWeight")
    cve_id: Optional[str] = Field(None, alias="cveId")
    is_known_exploited: bool = Field(default=False, alias="isKnownExploited")


class AttackGraphInputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    nodes: List[GraphNodeSchema] = Field(..., min_length=1)
    edges: List[GraphEdgeSchema] = Field(default_factory=list)
    entry_asset_ids: Optional[List[str]] = Field(None, alias="entryAssetIds")
    target_asset_ids: Optional[List[str]] = Field(None, alias="targetAssetIds")
    max_depth: int = Field(default=8, ge=1, le=20, alias="maxDepth")


class DiscoveredPathSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    path_id: str = Field(..., alias="pathId")
    node_ids: List[str] = Field(..., alias="nodeIds")
    edge_ids: List[str] = Field(..., alias="edgeIds")
    hop_count: int = Field(..., ge=1, alias="hopCount")
    cumulative_risk_score: float = Field(..., ge=0.0, le=100.0, alias="cumulativeRiskScore")
    entry_asset_id: str = Field(..., alias="entryAssetId")
    target_asset_id: str = Field(..., alias="targetAssetId")
    critical_cves: List[str] = Field(default_factory=list, alias="criticalCves")


class ChokePointSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    asset_id: str = Field(..., alias="assetId")
    asset_name: str = Field(..., alias="assetName")
    intercepted_paths_count: int = Field(..., ge=1, alias="interceptedPathsCount")
    intercepted_risk_score: float = Field(..., ge=0.0, alias="interceptedRiskScore")
    choke_point_score: float = Field(..., ge=0.0, le=1.0, alias="chokePointScore")
    remediation_recommendation: str = Field(..., alias="remediationRecommendation")


class AttackGraphAnalysisResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    total_nodes: int = Field(..., alias="totalNodes")
    total_edges: int = Field(..., alias="totalEdges")
    total_paths_found: int = Field(..., alias="totalPathsFound")
    max_path_risk: float = Field(..., ge=0.0, le=100.0, alias="maxPathRisk")
    discovered_paths: List[DiscoveredPathSchema] = Field(default_factory=list, alias="discoveredPaths")
    choke_points: List[ChokePointSchema] = Field(default_factory=list, alias="chokePoints")
    entry_points_count: int = Field(..., alias="entryPointsCount")
    critical_targets_count: int = Field(..., alias="criticalTargetsCount")
    evaluated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        alias="evaluatedAt"
    )
    model_version: str = Field(default="1.0.0", alias="modelVersion")
