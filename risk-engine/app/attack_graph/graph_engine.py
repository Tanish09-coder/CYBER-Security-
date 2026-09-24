# =============================================================================
# CyberRiskOS — Attack Path Graph Engine Coordinator
# Phase: Phase 7B — Attack Path Intelligence
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/ATTACK_PATH_MODEL.md
# =============================================================================

from typing import Dict
from app.schemas.attack_graph_input import (
    AttackGraphInputSchema,
    AttackGraphAnalysisResultSchema,
    GraphNodeSchema,
)
from app.attack_graph.graph_traversal import AttackGraphTraversalEngine
from app.attack_graph.choke_points import ChokePointAnalyzer


class AttackGraphEngine:
    @classmethod
    def analyze(cls, payload: AttackGraphInputSchema) -> AttackGraphAnalysisResultSchema:
        """
        Coordinates graph traversal, cumulative path risk calculation, and structural
        choke point identification across the enterprise network topology.
        """
        nodes_map: Dict[str, GraphNodeSchema] = {n.asset_id: n for n in payload.nodes}

        # Determine entry points and target counts
        if payload.entry_asset_ids:
            entry_count = len(set(payload.entry_asset_ids).intersection(nodes_map.keys()))
        else:
            entry_count = sum(1 for n in payload.nodes if n.is_internet_facing)

        if payload.target_asset_ids:
            target_count = len(set(payload.target_asset_ids).intersection(nodes_map.keys()))
        else:
            target_count = sum(1 for n in payload.nodes if n.criticality_tier == 1)

        # 1. Discover acyclic attack paths
        paths = AttackGraphTraversalEngine.discover_paths(payload)

        # 2. Identify structural choke points
        choke_points = ChokePointAnalyzer.identify_choke_points(paths, nodes_map)

        max_risk = max((p.cumulative_risk_score for p in paths), default=0.0)

        return AttackGraphAnalysisResultSchema(
            total_nodes=len(payload.nodes),
            total_edges=len(payload.edges),
            total_paths_found=len(paths),
            max_path_risk=max_risk,
            discovered_paths=paths,
            choke_points=choke_points,
            entry_points_count=entry_count,
            critical_targets_count=target_count,
        )
