// =============================================================================
// CyberRiskOS — CPE Matching Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query, withTransaction } from '../../db';
import {
  StoredAssetVulnerability,
  VulnerabilityCpeRecord,
  CorrelatedVulnerabilityResponse,
} from './cpe-matching.types';

export class CpeMatchingRepository {
  /**
   * Fetches all active vulnerability CPE records joined with CVE metadata
   */
  async getAllCpeCriteria(): Promise<VulnerabilityCpeRecord[]> {
    const result = await query<VulnerabilityCpeRecord>(
      `SELECT
        vc.id,
        vc.vulnerability_id,
        vc.criteria,
        vc.vulnerable,
        vc.version_start_including,
        vc.version_start_excluding,
        vc.version_end_including,
        vc.version_end_excluding,
        v.cve_id
       FROM vulnerability_cpes vc
       JOIN vulnerabilities v ON vc.vulnerability_id = v.id
       WHERE vc.vulnerable = TRUE`
    );
    return result.rows;
  }

  /**
   * Upserts an asset-vulnerability correlation
   */
  async upsertAssetVulnerability(data: {
    asset_id: string;
    software_id?: string | null;
    vulnerability_id: string;
    cve_id: string;
    cpe_criteria_id?: string | null;
    match_confidence: number;
    match_type: string;
    match_reason: string;
  }): Promise<StoredAssetVulnerability> {
    const result = await query<StoredAssetVulnerability>(
      `INSERT INTO asset_vulnerabilities (
        asset_id, software_id, vulnerability_id, cve_id, cpe_criteria_id,
        match_confidence, match_type, match_reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'POTENTIAL_VULNERABILITY_MATCH')
      ON CONFLICT (asset_id, vulnerability_id, software_id)
      DO UPDATE SET
        match_confidence = EXCLUDED.match_confidence,
        match_type = EXCLUDED.match_type,
        match_reason = EXCLUDED.match_reason,
        matched_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        data.asset_id,
        data.software_id || null,
        data.vulnerability_id,
        data.cve_id,
        data.cpe_criteria_id || null,
        data.match_confidence,
        data.match_type,
        data.match_reason,
      ]
    );

    return result.rows[0];
  }

  /**
   * Retrieves enriched correlated vulnerabilities for a specific asset
   */
  async getCorrelatedVulnerabilitiesByAsset(
    assetId: string
  ): Promise<CorrelatedVulnerabilityResponse[]> {
    const result = await query(
      `SELECT
        av.id,
        av.asset_id,
        av.software_id,
        av.vulnerability_id,
        av.cve_id,
        av.match_confidence,
        av.match_type,
        av.match_reason,
        av.status,
        av.matched_at,
        v.description,
        v.cvss_base_score,
        v.cvss_base_severity,
        v.attack_vector,
        v.known_exploited,
        v.kev_due_date,
        v.kev_known_ransomware_campaign_use,
        sw.vendor AS software_vendor,
        sw.product AS software_product,
        sw.version AS software_version
       FROM asset_vulnerabilities av
       JOIN vulnerabilities v ON av.vulnerability_id = v.id
       LEFT JOIN installed_software sw ON av.software_id = sw.id
       WHERE av.asset_id = $1
       ORDER BY v.known_exploited DESC, v.cvss_base_score DESC NULLS LAST`,
      [assetId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      assetId: row.asset_id,
      softwareId: row.software_id,
      vulnerabilityId: row.vulnerability_id,
      cveId: row.cve_id,
      matchConfidence: parseFloat(row.match_confidence || '1.0'),
      matchType: row.match_type,
      matchReason: row.match_reason,
      status: row.status,
      matchedAt: row.matched_at,
      description: row.description,
      cvssScore: row.cvss_base_score ? parseFloat(row.cvss_base_score) : null,
      cvssSeverity: row.cvss_base_severity,
      attackVector: row.attack_vector,
      isKev: !!row.known_exploited,
      kevDueDate: row.kev_due_date,
      ransomwareCampaignUse: row.kev_known_ransomware_campaign_use,
      softwareVendor: row.software_vendor,
      softwareProduct: row.software_product,
      softwareVersion: row.software_version,
    }));
  }
}
