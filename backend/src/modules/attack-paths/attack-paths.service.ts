// =============================================================================
// CyberRiskOS — Attack Path & Blast Radius Service Layer
// Phase: Phase 7B — Attack Path Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/ATTACK_PATH_MODEL.md
// =============================================================================

import { query } from '../../db';
import {
  attackPathEngineClient,
  AttackPathEngineClient,
} from './attack-paths.client';
import {
  EdgeType,
  GraphNodeDTO,
  GraphEdgeDTO,
  AttackGraphInputDTO,
  AttackGraphAnalysisResultDTO,
  ChokePointDTO,
  AssetBlastRadiusDTO,
} from './attack-paths.types';

export class AttackPathsService {
  constructor(private client: AttackPathEngineClient = attackPathEngineClient) {}

  /**
   * Retrieves or builds the topological attack graph from authentic database records
   * and runs deterministic path traversal in the Python risk-engine.
   */
  async getAttackGraph(orgId?: string): Promise<AttackGraphAnalysisResultDTO> {
    const input = await this.buildGraphTopologyFromDb(orgId);
    if (input.nodes.length === 0) {
      return {
        totalNodes: 0,
        totalEdges: 0,
        totalPathsFound: 0,
        maxPathRisk: 0.0,
        discoveredPaths: [],
        chokePoints: [],
        entryPointsCount: 0,
        criticalTargetsCount: 0,
        evaluatedAt: new Date().toISOString(),
        modelVersion: '1.0.0',
      };
    }
    return await this.client.analyzeGraph(input);
  }

  /**
   * Analyzes an ad-hoc custom graph topology provided by the caller.
   */
  async analyzeCustomGraph(input: AttackGraphInputDTO): Promise<AttackGraphAnalysisResultDTO> {
    return await this.client.analyzeGraph(input);
  }

  /**
   * Returns top structural choke points ranked by path interception and cumulative risk.
   */
  async getChokePoints(limit: number = 10, orgId?: string): Promise<ChokePointDTO[]> {
    const graphResult = await this.getAttackGraph(orgId);
    const safeLimit = Math.max(1, Math.min(50, limit));
    return graphResult.chokePoints.slice(0, safeLimit);
  }

  /**
   * Computes inbound attack vectors and downstream blast radius for a specific asset.
   */
  async getAssetBlastRadius(assetId: string, orgId?: string): Promise<AssetBlastRadiusDTO> {
    // 1. Fetch asset details
    const assetSql = `
      SELECT id, name, business_criticality, is_internet_facing
      FROM assets
      WHERE id = $1 ${orgId ? 'AND organization_id = $2' : ''}
    `;
    const params = orgId ? [assetId, orgId] : [assetId];
    const assetRes = await query(assetSql, params);

    if (assetRes.rows.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const row = assetRes.rows[0];
    const graphResult = await this.getAttackGraph(orgId);

    // 2. Identify inbound paths reaching this asset
    const upstreamInbound = graphResult.discoveredPaths.filter(
      (p) => p.nodeIds.includes(assetId) && p.entryAssetId !== assetId
    );

    // 3. Identify downstream paths starting from or continuing past this asset to crown jewels
    const downstreamOutbound = graphResult.discoveredPaths.filter(
      (p) => p.nodeIds.includes(assetId) && p.targetAssetId !== assetId
    );

    // 4. Identify if this asset is a choke point
    const chokePoint = graphResult.chokePoints.find((c) => c.assetId === assetId) || null;

    // Calculate compromise risk score: max risk among inbound or outbound paths
    const maxInboundRisk = upstreamInbound.reduce((max, p) => Math.max(max, p.cumulativeRiskScore), 0);
    const maxOutboundRisk = downstreamOutbound.reduce((max, p) => Math.max(max, p.cumulativeRiskScore), 0);
    const compromiseRisk = Math.max(maxInboundRisk, maxOutboundRisk);

    return {
      assetId: row.id,
      assetName: row.name,
      criticalityTier: row.business_criticality,
      isInternetFacing: row.is_internet_facing,
      upstreamInboundPaths: upstreamInbound,
      downstreamOutboundPaths: downstreamOutbound,
      compromiseRiskScore: compromiseRisk,
      isChokePoint: chokePoint !== null,
      chokePointDetails: chokePoint,
    };
  }

  /**
   * Builds the AttackGraphInputDTO by querying authentic assets and vulnerabilities.
   */
  private async buildGraphTopologyFromDb(orgId?: string): Promise<AttackGraphInputDTO> {
    const params = orgId ? [orgId] : [];
    const orgFilter = orgId ? 'WHERE a.organization_id = $1' : '';

    // 1. Fetch assets as nodes
    const assetsSql = `
      SELECT 
        a.id,
        a.name,
        a.ip_address,
        a.business_criticality,
        a.is_internet_facing,
        a.business_unit_id
      FROM assets a
      ${orgFilter}
      ORDER BY a.business_criticality ASC;
    `;
    const assetsRes = await query(assetsSql, params);

    const nodes: GraphNodeDTO[] = assetsRes.rows.map((r: any) => ({
      assetId: r.id,
      name: r.name,
      ipAddress: r.ip_address || null,
      criticalityTier: r.business_criticality !== null && r.business_criticality !== undefined ? parseInt(r.business_criticality, 10) : null,
      isInternetFacing: r.is_internet_facing !== null && r.is_internet_facing !== undefined ? Boolean(r.is_internet_facing) : null,
      businessUnitId: r.business_unit_id || null,
    }));

    if (nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    // 2. Fetch authoritative edges from enterprise topology contracts (Harsh-owned).
    // Prohibit generating artificial network/dependency edges such as internet-facing -> every internal asset.
    // Query actual asset_dependencies schema: source_asset_id, target_asset_id, dependency_type, propagation_weight.
    // For organization filtering, join source and target assets to organizations.
    const edges: GraphEdgeDTO[] = [];

    const depSql = `
      SELECT 
        ad.source_asset_id,
        ad.target_asset_id,
        ad.dependency_type,
        ad.propagation_weight
      FROM asset_dependencies ad
      JOIN assets sa ON ad.source_asset_id = sa.id
      JOIN assets ta ON ad.target_asset_id = ta.id
      ${orgId ? 'WHERE sa.organization_id = $1 AND ta.organization_id = $1' : ''}
      ORDER BY ad.created_at ASC;
    `;
    const depRes = await query(depSql, params);
    for (let i = 0; i < depRes.rows.length; i++) {
      const row = depRes.rows[i];
      const propWeight = row.propagation_weight !== null ? parseFloat(row.propagation_weight) : 0.20;
      // Map dependency_type to EdgeType (NETWORK_PATH -> NETWORK_EXPOSURE, other types -> TRUST_RELATIONSHIP)
      const edgeType: EdgeType = row.dependency_type === 'NETWORK_PATH' ? 'NETWORK_EXPOSURE' : 'TRUST_RELATIONSHIP';
      edges.push({
        edgeId: `edge-${i + 1}`,
        sourceAssetId: row.source_asset_id,
        targetAssetId: row.target_asset_id,
        edgeType,
        riskWeight: Math.min(100.0, Math.max(0.0, propWeight * 100.0)),
        isKnownExploited: false,
      });
    }

    return { nodes, edges };
  }
}

export const attackPathsService = new AttackPathsService();
