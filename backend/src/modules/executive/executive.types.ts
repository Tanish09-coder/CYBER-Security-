// =============================================================================
// CyberRiskOS — Executive Decision Dashboard Domain Types & DTO Contracts
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-01, TANISH-P6-02)
// =============================================================================

export interface ExecutiveRiskDistributionDTO {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface BusinessUnitRollupDTO {
  businessUnitId: string;
  businessUnitName: string;
  avgRiskScore: number;
  totalAssets: number;
  criticalFlawsCount: number;
}

export interface ExecutivePostureDTO {
  overallRiskScore: number;
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskDistribution: ExecutiveRiskDistributionDTO;
  totalAssetsEvaluated: number;
  totalVulnerabilitiesEvaluated: number;
  kevExposureCount: number;
  ransomwareAssociatedCount: number;
  internetFacingAssetCount: number;
  businessUnitRollups: BusinessUnitRollupDTO[];
  dataFreshnessTimestamp: string | null;
  modelVersion: string;
}

export interface ExecutiveTopRiskDTO {
  rank: number;
  assetId: string;
  assetName: string;
  criticalityTier: number;
  isInternetFacing: boolean;
  cveId: string;
  cvssScore: number | null;
  riskScore: number;
  severity: string;
  isKnownExploited: boolean;
  ransomwareCampaignUse: string | null;
  eal: number | null;
  currency: string;
}

export interface ExecutiveFinancialSummaryDTO {
  totalModeledEal: number | null;
  availableEalCount: number;
  totalEvaluatedCount?: number;
  isPartialCoverage?: boolean;
  coverageNote?: string;
  currency: string;
  totalPrimaryLoss: number;
  totalSecondaryLoss: number;
  averageOutageHours: number;
  highestLossAsset: {
    assetId: string;
    assetName: string;
    eal: number;
  } | null;
  topLossDrivers: Array<{
    assetId: string;
    assetName: string;
    cveId: string;
    eal: number;
  }>;
  isEstimated: boolean;
}
