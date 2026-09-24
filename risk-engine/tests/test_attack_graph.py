# =============================================================================
# CyberRiskOS — Attack Path Graph Engine Test Suite
# Phase: Phase 7B — Attack Path Intelligence
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/ATTACK_PATH_MODEL.md
# =============================================================================

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.attack_graph_input import (
    AttackGraphInputSchema,
    GraphNodeSchema,
    GraphEdgeSchema,
    EdgeType,
)
from app.attack_graph.graph_traversal import AttackGraphTraversalEngine
from app.attack_graph.choke_points import ChokePointAnalyzer
from app.attack_graph.graph_engine import AttackGraphEngine


client = TestClient(app)


def build_sample_topology():
    """
    Constructs a deterministic multi-tier topology:
    - Web Server (Internet facing, Tier 3)
    - Bastion Host (Internet facing, Tier 3)
    - App Server (Internal transit choke point, Tier 2)
    - Database Server (Crown Jewel, Tier 1)
    - Isolated Backup (Disconnected, Tier 1)
    """
    nodes = [
        GraphNodeSchema(
            asset_id="asset-web",
            name="Public Web Portal",
            ip_address="198.51.100.10",
            criticality_tier=3,
            is_internet_facing=True,
        ),
        GraphNodeSchema(
            asset_id="asset-bastion",
            name="SSH Bastion Host",
            ip_address="198.51.100.20",
            criticality_tier=3,
            is_internet_facing=True,
        ),
        GraphNodeSchema(
            asset_id="asset-app",
            name="Core Banking Application Server",
            ip_address="10.0.1.50",
            criticality_tier=2,
            is_internet_facing=False,
        ),
        GraphNodeSchema(
            asset_id="asset-db",
            name="Primary Customer Accounts DB",
            ip_address="10.0.2.100",
            criticality_tier=1,  # Crown Jewel
            is_internet_facing=False,
        ),
        GraphNodeSchema(
            asset_id="asset-isolated",
            name="Air-Gapped Offline Tape Backup",
            criticality_tier=1,  # Crown Jewel
            is_internet_facing=False,
        ),
    ]

    edges = [
        # Path 1: Web -> App (Log4Shell, high risk)
        GraphEdgeSchema(
            edge_id="edge-1",
            source_asset_id="asset-web",
            target_asset_id="asset-app",
            edge_type=EdgeType.VULNERABILITY_EXPLOIT,
            risk_weight=80.0,
            cve_id="CVE-2021-44228",
            is_known_exploited=True,
        ),
        # Path 2: Bastion -> App (SSH trust relationship)
        GraphEdgeSchema(
            edge_id="edge-2",
            source_asset_id="asset-bastion",
            target_asset_id="asset-app",
            edge_type=EdgeType.TRUST_RELATIONSHIP,
            risk_weight=50.0,
        ),
        # Common Link: App -> DB (SQL injection / database access)
        GraphEdgeSchema(
            edge_id="edge-3",
            source_asset_id="asset-app",
            target_asset_id="asset-db",
            edge_type=EdgeType.NETWORK_EXPOSURE,
            risk_weight=70.0,
            cve_id="CVE-2023-34362",
            is_known_exploited=True,
        ),
    ]

    return nodes, edges


def test_acyclic_path_discovery():
    """Validates that multi-hop paths to crown jewels are discovered correctly."""
    nodes, edges = build_sample_topology()
    payload = AttackGraphInputSchema(nodes=nodes, edges=edges)

    paths = AttackGraphTraversalEngine.discover_paths(payload)

    # Expect 2 distinct paths reaching the DB:
    # 1. Web -> App -> DB
    # 2. Bastion -> App -> DB
    assert len(paths) == 2

    # Check path 1: Web -> App -> DB
    path1 = next((p for p in paths if p.entry_asset_id == "asset-web"), None)
    assert path1 is not None
    assert path1.node_ids == ["asset-web", "asset-app", "asset-db"]
    assert path1.hop_count == 2
    assert path1.target_asset_id == "asset-db"
    # Cumulative risk: 100 * (1 - (1 - 0.8) * (1 - 0.7)) = 100 * (1 - 0.2 * 0.3) = 94.0
    assert path1.cumulative_risk_score == 94.0
    assert "CVE-2021-44228" in path1.critical_cves
    assert "CVE-2023-34362" in path1.critical_cves


def test_graph_cycle_detection():
    """Validates that cyclic graphs are traversed without infinite loops or duplicate hops."""
    nodes, edges = build_sample_topology()
    # Add cycle: App -> Web (reverse link) and App -> App (self loop)
    edges.append(
        GraphEdgeSchema(
            edge_id="edge-cycle-1",
            source_asset_id="asset-app",
            target_asset_id="asset-web",
            edge_type=EdgeType.NETWORK_EXPOSURE,
            risk_weight=30.0,
        )
    )
    edges.append(
        GraphEdgeSchema(
            edge_id="edge-cycle-2",
            source_asset_id="asset-app",
            target_asset_id="asset-app",
            edge_type=EdgeType.NETWORK_EXPOSURE,
            risk_weight=10.0,
        )
    )

    payload = AttackGraphInputSchema(nodes=nodes, edges=edges)
    paths = AttackGraphTraversalEngine.discover_paths(payload)

    # Paths must still discover acyclic paths to DB without cycle errors
    assert len(paths) == 2
    for p in paths:
        # Every node in path must be unique
        assert len(p.node_ids) == len(set(p.node_ids))


def test_disconnected_asset_zero_paths():
    """Validates that disconnected assets do not generate spurious paths."""
    nodes, edges = build_sample_topology()
    payload = AttackGraphInputSchema(nodes=nodes, edges=edges)

    paths = AttackGraphTraversalEngine.discover_paths(payload)

    # Disconnected backup must never appear in any target
    for p in paths:
        assert p.target_asset_id != "asset-isolated"


def test_structural_choke_point_identification():
    """Validates that the intermediate app server is ranked as the #1 choke point."""
    nodes, edges = build_sample_topology()
    payload = AttackGraphInputSchema(nodes=nodes, edges=edges)

    result = AttackGraphEngine.analyze(payload)

    assert result.total_paths_found == 2
    assert len(result.choke_points) >= 1

    # App server is traversed by both paths!
    top_choke = result.choke_points[0]
    assert top_choke.asset_id == "asset-app"
    assert top_choke.intercepted_paths_count == 2
    assert top_choke.choke_point_score == 1.0  # 100% of critical paths pass through it
    assert "Core Banking Application Server" in top_choke.asset_name


def test_max_depth_cutoff():
    """Validates that paths exceeding max_depth are pruned."""
    nodes, edges = build_sample_topology()
    # Set max_depth to 1 hop (both valid paths require 2 hops)
    payload = AttackGraphInputSchema(nodes=nodes, edges=edges, max_depth=1)

    paths = AttackGraphTraversalEngine.discover_paths(payload)
    assert len(paths) == 0


def test_api_endpoint_analyze():
    """Tests the FastAPI HTTP endpoint POST /api/v1/attack-paths/analyze."""
    nodes, edges = build_sample_topology()
    payload = {
        "nodes": [n.model_dump(by_alias=True) for n in nodes],
        "edges": [e.model_dump(by_alias=True) for e in edges],
    }

    response = client.post("/api/v1/attack-paths/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["totalNodes"] == 5
    assert data["totalEdges"] == 3
    assert data["totalPathsFound"] == 2
    assert data["maxPathRisk"] == 94.0
    assert len(data["discoveredPaths"]) == 2
    assert len(data["chokePoints"]) >= 1
    assert data["chokePoints"][0]["assetId"] == "asset-app"
    assert data["modelVersion"] == "1.0.0"
