// =============================================================================
// CyberRiskOS — Formatting & Human-Language Utilities
// Prevents raw UUID leaks, translates technical factor IDs into readable terms
// =============================================================================

/**
 * Maps known internal/demo asset IDs or UUID patterns to human-readable labels
 */
const KNOWN_ASSET_NAMES: Record<string, string> = {
  'prod-pay-gw-01': 'Payment Gateway (prod-pay-gw-01)',
  'core-db-cluster-01': 'Core Database Cluster (core-db-cluster-01)',
  'edge-nginx-proxy': 'Customer Web Gateway (edge-nginx-proxy)',
  'corp-hq-dc01': 'Corporate Active Directory (corp-hq-dc01)',
  'confluence-wiki-01': 'Confluence Wiki Server (confluence-wiki-01)',
  'AJLAPTOP': 'Developer Workstation (AJLAPTOP)',
};

/**
 * Checks if a string is a raw UUID
 */
export function isUuid(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Returns a clean, human-readable entity name instead of displaying raw UUIDs in primary UI.
 */
export function formatEntityName(name?: string | null, fallbackId?: string | null): string {
  if (name && name.trim() && !isUuid(name)) {
    // Strip redundant trailing internal tags if needed
    return name.replace(/\.apex\.internal/g, '').replace(/\(Demo\)/g, '').trim();
  }

  const candidateId = fallbackId || name;
  if (!candidateId) return 'Enterprise Asset';

  // Check known map
  for (const [key, humanName] of Object.entries(KNOWN_ASSET_NAMES)) {
    if (candidateId.includes(key)) {
      return humanName;
    }
  }

  // If UUID, return a shortened readable token
  if (isUuid(candidateId)) {
    return `Asset-${candidateId.slice(0, 8)}`;
  }

  return candidateId;
}

/**
 * Translates raw numerical or internal factor keys into explainable factor names
 * Example: factor_98 -> Technical Severity
 */
export function formatFactorName(factorKey?: string | number | null): string {
  if (factorKey === null || factorKey === undefined) return 'Baseline Factor';
  
  const str = String(factorKey).trim();

  const factorMap: Record<string, string> = {
    '98': 'Technical Vulnerability Severity (CVSS)',
    'cvss': 'Technical Vulnerability Severity (CVSS)',
    'base_cvss': 'Base Vulnerability Severity',
    'criticality': 'Enterprise Business Criticality',
    'business_criticality': 'Enterprise Business Criticality',
    'kev': 'CISA Known Exploited Context',
    'kev_context': 'CISA Known Exploited Context',
    'exposure': 'Internet Exposure Context',
    'internet_exposure': 'Internet Exposure Context',
    'control': 'Security Control Mitigation Context',
    'control_context': 'Security Control Mitigation Context',
    'data_classification': 'Data Classification Risk Level',
  };

  return factorMap[str.toLowerCase()] || `Risk Factor (${str})`;
}

/**
 * Badge Label Types for consistent UI tagging
 */
export type DataOriginLabel = 'REAL INTELLIGENCE' | 'DEMO ENTERPRISE DATA' | 'MODELED / ESTIMATED' | 'HYPOTHETICAL';
