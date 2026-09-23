// =============================================================================
// CyberRiskOS Frontend UI Types & Contracts (PRD Section 19, 32)
// =============================================================================

export type NavItemKey =
  | 'overview'
  | 'risk-analysis'
  | 'risk-drivers'
  | 'risk-timeline'
  | 'assets'
  | 'vulnerabilities'
  | 'threats'
  | 'simulator'
  | 'optimizer'
  | 'attack-paths'
  | 'compliance'
  | 'reports'
  | 'integrations'
  | 'settings';

export interface ExecutiveSummaryKPIs {
  modeledFinancialExposure: number; // In INR (e.g. 47,200,000)
  exposurePeriodDeltaPct: number;    // e.g. +8.4%
  criticalAssetCount: number;
  openKevVulnerabilityCount: number;
  highRiskAssetCount: number;
  controlCoveragePct: number;
  potentialRiskReduction: number;
}

export interface AssetItem {
  id: string;
  assetIdentifier: string; // AST-00124
  name: string;
  assetType: string;
  businessUnit: string;
  criticalityTier: 1 | 2 | 3 | 4 | 5;
  isInternetFacing: boolean;
  modeledExposure: number; // In INR
  riskTier: 'Low' | 'Moderate' | 'High' | 'Critical';
  kevPresent: boolean;
  topControlGap: string;
}

export interface VulnerabilityItem {
  id: string;
  cveId: string;
  cvssScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedTechnology: string;
  isKev: boolean;
  affectedAssetCount: number;
  remediationCostEstimate: number;
}

export interface AttackPathGraphData {
  nodes: {
    id: string;
    label: string;
    type: 'entry_point' | 'compromised' | 'lateral_hop' | 'critical_target';
    exposure: number;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    techniqueId?: string; // MITRE ATT&CK technique e.g. T1190
  }[];
}

export interface WhatIfActionConfig {
  enableMfa: boolean;
  enableEdr: boolean;
  patchCriticalCve: boolean;
  segmentNetwork: boolean;
  remediationDelayDays: 0 | 7 | 30 | 60;
}

export interface InvestmentStrategyResult {
  strategyLabel: 'Strategy A' | 'Strategy B' | 'Strategy C';
  cost: number;
  modeledExposureReduction: number;
  residualExposure: number;
  rosiPercentage: number;
  initiatives: string[];
}
