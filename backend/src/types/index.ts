// =============================================================================
// CyberRiskOS - Core TypeScript Domain Models (PRD Sections 5, 22, 23)
// =============================================================================

export type UserRole = 
  | 'Administrator'
  | 'CISO'
  | 'Security Analyst'
  | 'Risk Officer'
  | 'Auditor'
  | 'Executive Viewer';

export type Environment = 'Production' | 'Staging' | 'Development' | 'DR';
export type CriticalityTier = 1 | 2 | 3 | 4 | 5;
export type DataClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';
export type ControlStatus = 'Implemented' | 'Partially Implemented' | 'Not Implemented';
export type VulnerabilitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskTier = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  baseCurrency: string;
  createdAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface Asset {
  id: string;
  organizationId: string;
  assetIdentifier: string;
  name: string;
  assetType: string;
  businessUnit: string;
  environment: Environment;
  owner?: string;
  ipAddress?: string;
  isInternetFacing: boolean;
  criticalityTier: CriticalityTier;
  dataClassification: DataClassification;
  revenueDependencyPct: number;
  operationalImportanceScore: number;
  dependencies?: string[];
}

export interface Vulnerability {
  id: string;
  cveId: string;
  cvssScore: number;
  severity: VulnerabilitySeverity;
  affectedTechnology: string;
  isKev: boolean;
  exploitStatus: string;
  patchAvailable: boolean;
  publishedDate?: string;
  remediationGuidance?: string;
}

export interface SecurityControl {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  defaultMitigationWeight: number;
}

export interface AssetControlState {
  controlId: string;
  assetId: string;
  status: ControlStatus;
  effectivenessScore: number;
}

export interface FinancialProfile {
  id: string;
  organizationId: string;
  hourlyDowntimeCost: number;
  hourlyRecoveryRate: number;
  costPerSensitiveRecord: number;
  regulatoryBreachPenalty: number;
  dailyTransactionVolume: number;
}

export interface RiskSnapshot {
  id: string;
  assetId: string;
  assetName: string;
  incidentProbability: number;
  singleLossExpectancy: number;
  modeledAnnualExposure: number;
  riskTier: RiskTier;
  riskDrivers: {
    driverName: string;
    weightPercentage: number;
    impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH';
  }[];
  snapshotTimestamp: string;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  baselineExposure: number;
  simulatedExposure: number;
  modeledRiskReduction: number;
  interventions: {
    actionType: 'ENABLE_CONTROL' | 'PATCH_CVE' | 'SEGMENT_NETWORK' | 'DELAY_REMEDIATION';
    targetAssetId?: string;
    targetControlCode?: string;
    targetCveId?: string;
    delayDays?: number;
  }[];
}

export interface InvestmentStrategy {
  strategyLabel: string;
  totalCost: number;
  modeledExposureReduction: number;
  residualExposure: number;
  rosiPercentage: number;
  selectedInitiativeIds: string[];
}
