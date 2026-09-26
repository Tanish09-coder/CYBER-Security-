# =============================================================================
# CyberRiskOS — Attack Path Graph Traversal Engine
# Phase: Phase 7B — Attack Path Intelligence
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/ATTACK_PATH_MODEL.md
# =============================================================================

from typing import List, Dict, Set, Tuple
from app.schemas.attack_graph_input import (
    AttackGraphInputSchema,
    GraphNodeSchema,
    GraphEdgeSchema,
    DiscoveredPathSchema,
)


class AttackGraphTraversalEngine:
    @classmethod
    def discover_paths(cls, payload: AttackGraphInputSchema) -> List[DiscoveredPathSchema]:
        """
        Deterministically discovers acyclic attack paths from internet-exposed entry points
        to high-criticality enterprise crown jewels.
        """
        nodes_map: Dict[str, GraphNodeSchema] = {n.asset_id: n for n in payload.nodes}

        # 1. Determine entry points and target assets
        if payload.entry_asset_ids:
            entry_ids = set(payload.entry_asset_ids).intersection(nodes_map.keys())
        else:
            entry_ids = {n.asset_id for n in payload.nodes if n.is_internet_facing}

        if payload.target_asset_ids:
            target_ids = set(payload.target_asset_ids).intersection(nodes_map.keys())
        else:
            target_ids = {n.asset_id for n in payload.nodes if n.criticality_tier and (n.criticality_tier >= 4 or n.criticality_tier == 1)}

        # If no entry points or no target crown jewels, no valid multi-hop attack paths exist
        if not entry_ids or not target_ids:
            return []

        # 2. Build deterministic adjacency map
        adj: Dict[str, List[GraphEdgeSchema]] = {n.asset_id: [] for n in payload.nodes}
        for edge in payload.edges:
            if edge.source_asset_id in adj and edge.target_asset_id in nodes_map:
                adj[edge.source_asset_id].append(edge)

        # Sort adjacency lists deterministically (highest risk weight first, then edge_id)
        for node_id in adj:
            adj[node_id].sort(key=lambda e: (-e.risk_weight, e.edge_id))

        # 3. Directed acyclic DFS traversal
        discovered_paths: List[DiscoveredPathSchema] = []
        path_counter = 0

        # Sort entry points for deterministic execution
        sorted_entry_ids = sorted(list(entry_ids))

        for entry_id in sorted_entry_ids:
            # If the entry point itself is already a target crown jewel, record direct exposure
            if entry_id in target_ids:
                # Direct entry point vulnerability or exposure
                continue

            def dfs(
                curr_node_id: str,
                visited_nodes: Set[str],
                path_node_ids: List[str],
                path_edges: List[GraphEdgeSchema],
            ):
                nonlocal path_counter
                if len(path_edges) >= payload.max_depth:
                    return

                for edge in adj.get(curr_node_id, []):
                    next_node_id = edge.target_asset_id

                    # Cycle detection: never revisit an asset already in the current traversal path
                    if next_node_id in visited_nodes:
                        continue

                    new_edges = path_edges + [edge]
                    new_nodes = path_node_ids + [next_node_id]

                    if next_node_id in target_ids:
                        path_counter += 1
                        cum_risk = cls._compute_cumulative_risk(new_edges)
                        cves = list({e.cve_id for e in new_edges if e.cve_id})
                        cves.sort()

                        discovered_paths.append(
                            DiscoveredPathSchema(
                                path_id=f"path-{path_counter}",
                                node_ids=new_nodes,
                                edge_ids=[e.edge_id for e in new_edges],
                                hop_count=len(new_edges),
                                cumulative_risk_score=cum_risk,
                                entry_asset_id=entry_id,
                                target_asset_id=next_node_id,
                                critical_cves=cves,
                            )
                        )
                    else:
                        visited_nodes.add(next_node_id)
                        dfs(next_node_id, visited_nodes, new_nodes, new_edges)
                        visited_nodes.remove(next_node_id)

            visited = {entry_id}
            dfs(entry_id, visited, [entry_id], [])

        # Sort discovered paths: highest cumulative risk first, then lowest hop count, then path_id
        discovered_paths.sort(key=lambda p: (-p.cumulative_risk_score, p.hop_count, p.path_id))
        return discovered_paths

    @staticmethod
    def _compute_cumulative_risk(edges: List[GraphEdgeSchema]) -> float:
        """
        Computes cumulative path risk using independent breach probability union:
        PathRisk = 100 * (1 - prod(1 - risk_weight/100))
        """
        if not edges:
            return 0.0

        complement_product = 1.0
        for e in edges:
            weight = max(0.0, min(100.0, e.risk_weight))
            complement_product *= (1.0 - (weight / 100.0))

        raw_score = 100.0 * (1.0 - complement_product)
        return round(raw_score, 2)
