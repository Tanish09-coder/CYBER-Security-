// =============================================================================
// CyberRiskOS — What-If Remediation Actions & Scenario Simulation Schemas
// Owner: HARSH (Enterprise Context & Action Catalog Lead)
// =============================================================================

export type PermittedActionType = 'PATCH_CVE' | 'ENABLE_CONTROL' | 'SEGMENT_NETWORK' | 'ISOLATE_ASSET';

export interface RemediationActionDefinition {
  actionId: string;
  organizationId: string;
  actionType: PermittedActionType;
  title: string;
  description?: string;
  remediationCost: number; // Implementation cost in organization currency
  estimatedEffortHours?: number;
  feasibilityScore?: number; // 0.0 to 1.0 (operational feasibility)
  targetControlCode?: 'MFA' | 'EDR' | 'BACKUP' | 'SEGMENTATION' | 'PAM' | 'ENCRYPTION' | 'MONITORING';
  targetCveId?: string;
  affectedAssetIds: string[];
  executionConstraints?: string[];
  prerequisiteActionIds?: string[];
}

export interface ScenarioActionParameter {
  actionId: string;
  assetId: string;
  targetState: 'IMPLEMENTED' | 'REMEDIATED' | 'ISOLATED';
  implementationCost: number;
}
