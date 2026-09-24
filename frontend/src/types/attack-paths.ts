export type EdgeType = 'NETWORK_EXPOSURE' | 'VULNERABILITY_EXPLOIT' | 'TRUST_RELATIONSHIP';

export interface GraphNodeDTO {
  assetId: string;
  name: string;
  ipAddress?: string | null;
  criticalityTier: number;
  isInternetFacing: boolean;
  businessUnitId?: string | null;
}

export interface GraphEdgeDTO {
  edgeId: string;
  sourceAssetId: string;
  targetAssetId: string;
  edgeType: EdgeType;
  riskWeight: number;
  cveId?: string | null;
  isKnownExploited: boolean;
}

export interface DiscoveredPathDTO {
  pathId: string;
  nodeIds: string[];
  edgeIds: string[];
  hopCount: number;
  cumulativeRiskScore: number;
  entryAssetId: string;
  targetAssetId: string;
  criticalCves: string[];
}

export interface ChokePointDTO {
  assetId: string;
  assetName: string;
  interceptedPathsCount: number;
  interceptedRiskScore: number;
  chokePointScore: number;
  remediationRecommendation: string;
}

export interface AttackGraphAnalysisResultDTO {
  totalNodes: number;
  totalEdges: number;
  totalPathsFound: number;
  maxPathRisk: number;
  discoveredPaths: DiscoveredPathDTO[];
  chokePoints: ChokePointDTO[];
  entryPointsCount: number;
  criticalTargetsCount: number;
  evaluatedAt: string;
  modelVersion: string;
}

export interface AssetBlastRadiusDTO {
  assetId: string;
  assetName: string;
  criticalityTier: number;
  isInternetFacing: boolean;
  upstreamInboundPaths: DiscoveredPathDTO[];
  downstreamOutboundPaths: DiscoveredPathDTO[];
  compromiseRiskScore: number;
  isChokePoint: boolean;
  chokePointDetails?: ChokePointDTO | null;
}
