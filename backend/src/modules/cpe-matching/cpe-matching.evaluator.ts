// =============================================================================
// CyberRiskOS — CPE Matching & Semantic Version Evaluation Engine
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import {
  ParsedCpe23,
  VulnerabilityCpeRecord,
  MatchEvaluationResult,
} from './cpe-matching.types';

/**
 * Parses a standard CPE 2.3 formatted string:
 * cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
 */
export function parseCpe23(cpeString: string): ParsedCpe23 | null {
  if (!cpeString || !cpeString.startsWith('cpe:2.3:')) {
    return null;
  }

  // Handle escaped colons '\:' before splitting
  const placeholder = '__COLON__';
  const sanitized = cpeString.replace(/\\:/g, placeholder);
  const parts = sanitized.split(':');

  if (parts.length < 5) {
    return null;
  }

  const unescape = (s: string | undefined) =>
    (s || '*').replace(new RegExp(placeholder, 'g'), ':').trim();

  return {
    part: unescape(parts[2]),
    vendor: unescape(parts[3]),
    product: unescape(parts[4]),
    version: unescape(parts[5]),
    update: unescape(parts[6]),
    edition: unescape(parts[7]),
    language: unescape(parts[8]),
    sw_edition: unescape(parts[9]),
    target_sw: unescape(parts[10]),
    target_hw: unescape(parts[11]),
    other: unescape(parts[12]),
  };
}

/**
 * Compares two dot-separated or semantic version strings.
 * Returns:
 *   -1 if v1 < v2
 *    0 if v1 == v2
 *    1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  if (v1 === v2) return 0;
  if (v1 === '*' || v2 === '*') return 0;

  const clean = (v: string) => v.trim().replace(/^v/i, '');
  const s1 = clean(v1);
  const s2 = clean(v2);

  if (s1 === s2) return 0;

  // Split version on dots, hyphens, and underscores
  const segs1 = s1.split(/[._-]/);
  const segs2 = s2.split(/[._-]/);
  const maxLen = Math.max(segs1.length, segs2.length);

  for (let i = 0; i < maxLen; i++) {
    const part1 = segs1[i] ?? '0';
    const part2 = segs2[i] ?? '0';

    const num1 = parseInt(part1, 10);
    const num2 = parseInt(part2, 10);

    const isNum1 = !isNaN(num1) && String(num1) === part1;
    const isNum2 = !isNaN(num2) && String(num2) === part2;

    if (isNum1 && isNum2) {
      if (num1 !== num2) {
        return num1 > num2 ? 1 : -1;
      }
    } else {
      const comp = part1.localeCompare(part2, undefined, { numeric: true, sensitivity: 'base' });
      if (comp !== 0) {
        return comp > 0 ? 1 : -1;
      }
    }
  }

  return 0;
}

/**
 * Normalizes vendor/product string for fuzzy canonical matching
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/[-_.\s]/g, '');
}

/**
 * Evaluates whether an installed software package on an asset matches an NVD CVE CPE criteria.
 */
export function evaluateCpeMatch(
  installedVendor: string,
  installedProduct: string,
  installedVersion: string,
  cpeRecord: VulnerabilityCpeRecord,
  assetName: string = 'Asset'
): MatchEvaluationResult {
  const cpe = parseCpe23(cpeRecord.criteria);
  if (!cpe) {
    return { isMatch: false, confidence: 0, reason: 'Invalid CPE 2.3 criteria format', matchType: 'NONE' };
  }

  // 1. Vendor & Product matching
  const instNormVendor = normalizeName(installedVendor);
  const cpeNormVendor = normalizeName(cpe.vendor);
  const instNormProduct = normalizeName(installedProduct);
  const cpeNormProduct = normalizeName(cpe.product);

  const vendorMatches =
    cpe.vendor === '*' ||
    instNormVendor === cpeNormVendor ||
    instNormVendor.includes(cpeNormVendor) ||
    cpeNormVendor.includes(instNormVendor);

  const productMatches =
    cpe.product === '*' ||
    instNormProduct === cpeNormProduct ||
    instNormProduct.includes(cpeNormProduct) ||
    cpeNormProduct.includes(instNormProduct);

  if (!vendorMatches || !productMatches) {
    return { isMatch: false, confidence: 0, reason: 'Vendor or product mismatch', matchType: 'NONE' };
  }

  // 2. Version Bounds Evaluation
  const hasBounds = !!(
    cpeRecord.version_start_including ||
    cpeRecord.version_start_excluding ||
    cpeRecord.version_end_including ||
    cpeRecord.version_end_excluding
  );

  if (hasBounds) {
    if (
      cpeRecord.version_start_including &&
      compareVersions(installedVersion, cpeRecord.version_start_including) < 0
    ) {
      return { isMatch: false, confidence: 0, reason: 'Version below start including bound', matchType: 'NONE' };
    }
    if (
      cpeRecord.version_start_excluding &&
      compareVersions(installedVersion, cpeRecord.version_start_excluding) <= 0
    ) {
      return { isMatch: false, confidence: 0, reason: 'Version at or below start excluding bound', matchType: 'NONE' };
    }
    if (
      cpeRecord.version_end_including &&
      compareVersions(installedVersion, cpeRecord.version_end_including) > 0
    ) {
      return { isMatch: false, confidence: 0, reason: 'Version above end including bound', matchType: 'NONE' };
    }
    if (
      cpeRecord.version_end_excluding &&
      compareVersions(installedVersion, cpeRecord.version_end_excluding) >= 0
    ) {
      return { isMatch: false, confidence: 0, reason: 'Version at or above end excluding bound', matchType: 'NONE' };
    }

    const boundDesc = [
      cpeRecord.version_start_including ? `>= ${cpeRecord.version_start_including}` : '',
      cpeRecord.version_start_excluding ? `> ${cpeRecord.version_start_excluding}` : '',
      cpeRecord.version_end_including ? `<= ${cpeRecord.version_end_including}` : '',
      cpeRecord.version_end_excluding ? `< ${cpeRecord.version_end_excluding}` : '',
    ]
      .filter(Boolean)
      .join(' and ');

    return {
      isMatch: true,
      confidence: 0.95,
      matchType: 'CPE_VERSION_BOUND',
      reason: `Potential vulnerability match: Installed package ${installedVendor} ${installedProduct} v${installedVersion} on asset "${assetName}" falls within vulnerable version bounds (${boundDesc}) for ${cpeRecord.cve_id}. Exposure detected (potential vulnerability presence, no active breach confirmed).`,
    };
  }

  // 3. Exact or Wildcard Version Evaluation
  if (cpe.version === '*' || cpe.version === '-') {
    return {
      isMatch: true,
      confidence: 0.85,
      matchType: 'CPE_PRODUCT_WILDCARD',
      reason: `Potential vulnerability match: Installed package ${installedVendor} ${installedProduct} v${installedVersion} on asset "${assetName}" matches wildcard version criteria ${cpeRecord.criteria} for ${cpeRecord.cve_id}. Exposure detected (potential vulnerability presence, no active breach confirmed).`,
    };
  }

  if (compareVersions(installedVersion, cpe.version) === 0) {
    return {
      isMatch: true,
      confidence: 1.0,
      matchType: 'CPE_EXACT_VERSION',
      reason: `Potential vulnerability match: Installed package ${installedVendor} ${installedProduct} v${installedVersion} on asset "${assetName}" exactly matches vulnerable version ${cpe.version} for ${cpeRecord.cve_id}. Exposure detected (potential vulnerability presence, no active breach confirmed).`,
    };
  }

  return { isMatch: false, confidence: 0, reason: 'Version does not match criteria', matchType: 'NONE' };
}
