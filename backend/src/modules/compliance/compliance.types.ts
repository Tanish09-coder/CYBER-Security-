// =============================================================================
// CyberRiskOS — Compliance Intelligence Domain Types
// Phase: Phase 7A — Compliance Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P7A-01)
// =============================================================================

export interface ComplianceFrameworkCoverageFilter {
  organizationId?: string;
  frameworkCode?: string;
}

export interface ComplianceGapsFilter {
  organizationId?: string;
  frameworkCode?: string;
  minAssetCriticality?: number;
  limit?: number;
  offset?: number;
}

export interface ComplianceEvidenceFilter {
  organizationId?: string;
  frameworkCode?: string;
  controlCode?: string;
  requirementCode?: string;
  limit?: number;
  offset?: number;
}

export interface ParameterizedQuery {
  text: string;
  values: any[];
}

export interface FrameworkCoverageSummary {
  frameworkCode: string;
  frameworkName: string;
  totalRequirements: number;
  implementedControls: number;
  partialControls: number;
  missingControls: number;
  compliancePercentage: number;
}

export interface ComplianceGapItem {
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  controlCode: string;
  controlName: string;
  assetId: string;
  assetName: string;
  assetCriticality: number;
  status: string;
  effectivenessScore: number;
}

export interface ComplianceEvidenceItem {
  evidenceId: string;
  controlCode: string;
  controlName: string;
  assetId: string;
  assetName: string;
  source: string;
  status: string;
  lastVerifiedAt: string;
  notes: string | null;
}
