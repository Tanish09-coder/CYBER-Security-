// =============================================================================
// CyberRiskOS — Enterprise Financial Context & Risk Inputs Types
// Owner: HARSH
// =============================================================================

export type ActionType = 'ENABLE_CONTROL' | 'PATCH_CVE' | 'SEGMENT_NETWORK' | 'REMEDIATE_VULNERABILITY';
export type RemediationStatus = 'PLANNED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export type DependencyType = 'IDENTITY' | 'DATABASE' | 'NETWORK_PATH' | 'API' | 'PIPELINE';
export type EvidenceStatus = 'VERIFIED' | 'EXPIRED' | 'PENDING' | 'REJECTED';

export interface OrganizationFinancialParameters {
  id: string;
  organizationId: string;
  hourlyDowntimeCost: number | null;
  hourlyRecoveryRate: number | null;
  costPerSensitiveRecord: number | null;
  regulatoryBreachPenalty: number | null;
  dailyTransactionVolume: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetFinancialParametersInput {
  hourlyDowntimeCost?: number | null;
  hourlyRecoveryRate?: number | null;
  costPerSensitiveRecord?: number | null;
  regulatoryBreachPenalty?: number | null;
  dailyTransactionVolume?: number | null;
}

export interface RemediationAction {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  actionType: ActionType;
  remediationCost: number;
  estimatedEffortHours: number | null;
  targetControlCode: string | null;
  targetCveId: string | null;
  affectedAssetIds: string[];
  status: RemediationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRemediationActionInput {
  organizationId: string;
  title: string;
  description?: string;
  actionType: ActionType;
  remediationCost: number;
  estimatedEffortHours?: number;
  targetControlCode?: string;
  targetCveId?: string;
  affectedAssetIds?: string[];
  status?: RemediationStatus;
}

export interface AssetDependency {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  dependencyType: DependencyType;
  propagationWeight: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetDependencyInput {
  sourceAssetId: string;
  targetAssetId: string;
  dependencyType?: DependencyType;
  propagationWeight?: number;
  notes?: string;
}

export interface ComplianceFramework {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string;
  createdAt: Date;
}

export interface ComplianceEvidence {
  id: string;
  organizationId: string;
  complianceControlId: string;
  assetId: string | null;
  evidenceUri: string;
  evidenceType: string;
  status: EvidenceStatus;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComplianceEvidenceInput {
  organizationId: string;
  complianceControlId: string;
  assetId?: string;
  evidenceUri: string;
  evidenceType?: string;
  status?: EvidenceStatus;
}

// Aggregated Enterprise Risk Inputs Bundle for Tanish's Risk Engine
export interface EnterpriseRiskInputsBundle {
  organizationId: string;
  currency: string;
  financialParameters: {
    hourlyDowntimeCost: number | null;
    hourlyRecoveryRate: number | null;
    costPerSensitiveRecord: number | null;
    regulatoryBreachPenalty: number | null;
    dailyTransactionVolume: number | null;
  };
  assets: Array<{
    assetId: string;
    assetName: string;
    assetType: string;
    businessUnit: string;
    criticalityTier: number;
    isInternetFacing: boolean;
    dataClassification: string;
    revenueDependencyPct: number;
    operationalImportanceScore: number;
    controls: Array<{
      controlCode: string;
      status: string;
      effectivenessScore: number;
      mitigationWeight: number;
    }>;
    upstreamDependencies: string[];
  }>;
  remediationActions: Array<{
    actionId: string;
    actionType: ActionType;
    title: string;
    remediationCost: number;
    targetControlCode?: string;
    targetCveId?: string;
    affectedAssetIds: string[];
  }>;
}
