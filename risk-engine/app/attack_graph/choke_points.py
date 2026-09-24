# =============================================================================
# CyberRiskOS — Attack Path Structural Choke Point Analyzer
# Phase: Phase 7B — Attack Path Intelligence
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/ATTACK_PATH_MODEL.md
# =============================================================================

from typing import List, Dict
from app.schemas.attack_graph_input import (
    DiscoveredPathSchema,
    GraphNodeSchema,
    ChokePointSchema,
)


class ChokePointAnalyzer:
    @classmethod
    def identify_choke_points(
        cls,
        discovered_paths: List[DiscoveredPathSchema],
        nodes_map: Dict[str, GraphNodeSchema],
    ) -> List[ChokePointSchema]:
        """
        Identifies and ranks structural choke points where intervention eliminates
        the maximum number of attack paths reaching high-criticality destinations.
        """
        if not discovered_paths:
            return []

        total_risk_sum = sum(p.cumulative_risk_score for p in discovered_paths)
        if total_risk_sum <= 0.0:
            total_risk_sum = 1.0

        # Map: asset_id -> list of paths that traverse through this asset
        # Exclude the target asset itself from being counted as a transit choke point
        node_path_map: Dict[str, List[DiscoveredPathSchema]] = {}

        for path in discovered_paths:
            # Transit assets: entry point and intermediate hops (excluding final target crown jewel)
            transit_assets = set(path.node_ids[:-1])
            for asset_id in transit_assets:
                if asset_id not in node_path_map:
                    node_path_map[asset_id] = []
                node_path_map[asset_id].append(path)

        choke_points: List[ChokePointSchema] = []

        for asset_id, paths in node_path_map.items():
            node = nodes_map.get(asset_id)
            node_name = node.name if node else f"Asset-{asset_id}"

            intercepted_risk = sum(p.cumulative_risk_score for p in paths)
            choke_score = min(1.0, max(0.0, intercepted_risk / total_risk_sum))

            recommendation = (
                f"Remediating or segmenting '{node_name}' severs {len(paths)} attack path(s) "
                f"to critical enterprise assets, removing {round(intercepted_risk, 1)} aggregate risk."
            )

            choke_points.append(
                ChokePointSchema(
                    asset_id=asset_id,
                    asset_name=node_name,
                    intercepted_paths_count=len(paths),
                    intercepted_risk_score=round(intercepted_risk, 2),
                    choke_point_score=round(choke_score, 4),
                    remediation_recommendation=recommendation,
                )
            )

        # Rank choke points: most intercepted paths first, then highest choke score
        choke_points.sort(
            key=lambda c: (-c.intercepted_paths_count, -c.choke_point_score, c.asset_id)
        )
        return choke_points
