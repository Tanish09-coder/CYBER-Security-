// =============================================================================
// CyberRiskOS — Executive Dashboard Repository Layer
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-01)
// =============================================================================

import { query } from '../../db';
import {
  ExecutivePostureDTO,
  ExecutiveTopRiskDTO,
  ExecutiveFinancialSummaryDTO,
  BusinessUnitRollupDTO,
} from './executive.types';

export class ExecutiveRepository {
  /**
   * Computes the aggregated executive posture from authentic database records.
   */
  async getExecutivePosture(orgId?: string): Promise<ExecutivePostureDTO> {
    const params: any[] = orgId ? [orgId] : [];
    const orgFilter = orgId ? 'WHERE r.organization_id = $1' : '';
    const assetOrgFilter = orgId ? 'WHERE a.organization_id = $1' : '';

    // 1. Overall risk score & severity distribution
    const statsSql = `
      SELECT 
        COUNT(*)::int AS total_evaluations,
        COALESCE(AVG(r.score), 0.0) AS avg_risk_score,
        COUNT(CASE WHEN r.level = 'LOW' THEN 1 END)::int AS low_count,
        COUNT(CASE WHEN r.level = 'MEDIUM' THEN 1 END)::int AS medium_count,
        COUNT(CASE WHEN r.level = 'HIGH' THEN 1 END)::int AS high_count,
        COUNT(CASE WHEN r.level = 'CRITICAL' THEN 1 END)::int AS critical_count,
        COUNT(DISTINCT r.asset_id)::int AS total_assets_evaluated,
        COUNT(DISTINCT r.cve_id)::int AS total_vulns_evaluated,
        MAX(r.evaluated_at) AS latest_evaluation
      FROM risk_results r
      ${orgFilter};
    `;
    const statsRes = await query(statsSql, params);
    const row = statsRes.rows[0] || {};

    const avgRisk = Math.round(parseFloat(row.avg_risk_score || '0.0') * 10) / 10;
    const severity =
      avgRisk >= 90.0
        ? 'CRITICAL'
        : avgRisk >= 70.0
        ? 'HIGH'
        : avgRisk >= 40.0
        ? 'MEDIUM'
        : 'LOW';

    // 2. KEV & Ransomware exposures
    const threatSql = `
      SELECT 
        COUNT(DISTINCT CASE WHEN v.known_exploited = TRUE THEN av.asset_id END)::int AS kev_asset_count,
        COUNT(DISTINCT CASE WHEN LOWER(v.kev_known_ransomware_campaign_use) = 'known' THEN av.asset_id END)::int AS ransomware_asset_count
      FROM asset_vulnerabilities av
      JOIN vulnerabilities v ON v.cve_id = av.cve_id
      JOIN assets a ON a.id = av.asset_id
      ${assetOrgFilter};
    `;
    const threatRes = await query(threatSql, params);
    const threatRow = threatRes.rows[0] || {};

    // 3. Internet facing asset count
    const edgeSql = `
      SELECT COUNT(*)::int AS edge_count
      FROM assets a
      ${orgId ? 'WHERE a.organization_id = $1 AND a.is_internet_facing = TRUE' : 'WHERE a.is_internet_facing = TRUE'};
    `;
    const edgeRes = await query(edgeSql, params);
    const edgeCount = edgeRes.rows[0]?.edge_count || 0;

    // 4. Business unit rollups
    const buRollups: BusinessUnitRollupDTO[] = [];
    try {
      const buSql = `
        SELECT 
          bu.id AS bu_id,
          bu.name AS bu_name,
          COALESCE(AVG(r.score), 0.0) AS avg_bu_risk,
          COUNT(DISTINCT a.id)::int AS total_assets,
          COUNT(CASE WHEN r.level = 'CRITICAL' THEN 1 END)::int AS critical_flaws
        FROM business_units bu
        JOIN assets a ON a.business_unit_id = bu.id
        LEFT JOIN risk_results r ON r.asset_id = a.id
        ${orgId ? 'WHERE bu.organization_id = $1' : ''}
        GROUP BY bu.id, bu.name
        ORDER BY avg_bu_risk DESC
        LIMIT 10;
      `;
      const buRes = await query(buSql, params);
      for (const r of buRes.rows) {
        buRollups.push({
          businessUnitId: r.bu_id,
          businessUnitName: r.bu_name,
          avgRiskScore: Math.round(parseFloat(r.avg_bu_risk || '0') * 10) / 10,
          totalAssets: r.total_assets || 0,
          criticalFlawsCount: r.critical_flaws || 0,
        });
      }
    } catch {
      // Graceful fallback if business_units table is unpopulated
    }

    return {
      overallRiskScore: avgRisk,
      riskSeverity: severity,
      riskDistribution: {
        low: row.low_count || 0,
        medium: row.medium_count || 0,
        high: row.high_count || 0,
        critical: row.critical_count || 0,
      },
      totalAssetsEvaluated: row.total_assets_evaluated || 0,
      totalVulnerabilitiesEvaluated: row.total_vulns_evaluated || 0,
      kevExposureCount: threatRow.kev_asset_count || 0,
      ransomwareAssociatedCount: threatRow.ransomware_asset_count || 0,
      internetFacingAssetCount: edgeCount,
      businessUnitRollups: buRollups,
      dataFreshnessTimestamp: row.latest_evaluation
        ? new Date(row.latest_evaluation).toISOString()
        : null,
      modelVersion: '1.0.0',
    };
  }

  /**
   * Retrieves the Top 5 to 10 enterprise risk exposures.
   */
  async getTopRisks(limit: number = 5, orgId?: string): Promise<ExecutiveTopRiskDTO[]> {
    const params: any[] = [limit];
    let orgFilter = '';
    if (orgId) {
      params.push(orgId);
      orgFilter = 'WHERE r.organization_id = $2';
    }

    const sql = `
      SELECT 
        r.asset_id,
        a.name AS asset_name,
        a.business_criticality,
        a.is_internet_facing,
        r.cve_id,
        r.score,
        r.level,
        v.cvss_base_score,
        v.known_exploited,
        v.kev_known_ransomware_campaign_use,
        f.eal,
        COALESCE(f.currency, 'USD') AS currency
      FROM risk_results r
      JOIN assets a ON a.id = r.asset_id
      LEFT JOIN vulnerabilities v ON v.cve_id = r.cve_id
      LEFT JOIN financial_results f ON (f.asset_id = r.asset_id AND f.cve_id = r.cve_id)
      ${orgFilter}
      ORDER BY r.score DESC NULLS LAST, f.eal DESC NULLS LAST
      LIMIT $1;
    `;
    const res = await query(sql, params);

    return res.rows.map((row: any, idx: number) => {
      let critTier = 3;
      if (typeof row.business_criticality === 'number') {
        critTier = row.business_criticality;
      } else if (typeof row.business_criticality === 'string') {
        const match = row.business_criticality.match(/\d+/);
        critTier = match ? parseInt(match[0], 10) : 3;
      }

      return {
        rank: idx + 1,
        assetId: row.asset_id,
        assetName: row.asset_name || 'Enterprise Asset',
        criticalityTier: critTier,
        isInternetFacing: Boolean(row.is_internet_facing),
        cveId: row.cve_id,
        cvssScore: row.cvss_base_score ? parseFloat(row.cvss_base_score) : null,
        riskScore: row.score !== null && row.score !== undefined ? parseFloat(row.score) : 0.0,
        severity: row.level || 'UNKNOWN',
        isKnownExploited: Boolean(row.known_exploited),
        ransomwareCampaignUse: row.kev_known_ransomware_campaign_use || null,
        eal: row.eal !== null && row.eal !== undefined ? parseFloat(row.eal) : null,
        currency: row.currency || 'USD',
      };
    });
  }

  /**
   * Retrieves enterprise financial risk summary for executive overview.
   */
  async getFinancialSummary(orgId?: string): Promise<ExecutiveFinancialSummaryDTO> {
    const params: any[] = orgId ? [orgId] : [];
    const orgFilter = orgId ? 'WHERE organization_id = $1' : '';

    const sql = `
      SELECT 
        COUNT(*)::int AS total_evaluations,
        COUNT(CASE WHEN eal IS NOT NULL THEN 1 END)::int AS available_eal_count,
        COALESCE(SUM(eal), 0.0) AS total_eal,
        COALESCE(SUM(primary_loss), 0.0) AS total_primary,
        COALESCE(SUM(secondary_loss), 0.0) AS total_secondary,
        COALESCE(AVG(estimated_outage_hours), 0.0) AS avg_outage,
        COALESCE(MAX(currency), 'USD') AS currency
      FROM financial_results
      ${orgFilter};
    `;
    const res = await query(sql, params);
    const row = res.rows[0] || {};

    const totalCount = row.total_evaluations || 0;
    const availableCount = row.available_eal_count || 0;
    const totalEal = availableCount > 0 ? Math.round(parseFloat(row.total_eal) * 100) / 100 : null;
    const isPartial = totalCount > availableCount;
    const coverageNote = isPartial
      ? `Known EAL reflects partial coverage (${availableCount}/${totalCount} evaluated vulnerabilities) and does not represent total enterprise loss.`
      : undefined;

    // Highest loss asset - fixed double WHERE clause
    const topAssetSql = `
      SELECT f.asset_id, a.name AS asset_name, SUM(f.eal) AS asset_eal
      FROM financial_results f
      JOIN assets a ON a.id = f.asset_id
      WHERE ${orgId ? 'f.organization_id = $1 AND ' : ''}f.eal IS NOT NULL
      GROUP BY f.asset_id, a.name
      ORDER BY asset_eal DESC
      LIMIT 1;
    `;
    const topAssetRes = await query(topAssetSql, params);
    const topAssetRow = topAssetRes.rows[0];
    const highestLossAsset = topAssetRow
      ? {
          assetId: topAssetRow.asset_id,
          assetName: topAssetRow.asset_name || 'Top Loss Asset',
          eal: Math.round(parseFloat(topAssetRow.asset_eal) * 100) / 100,
        }
      : null;

    // Top 5 loss drivers - fixed double WHERE clause
    const driversSql = `
      SELECT f.asset_id, a.name AS asset_name, f.cve_id, f.eal
      FROM financial_results f
      JOIN assets a ON a.id = f.asset_id
      WHERE ${orgId ? 'f.organization_id = $1 AND ' : ''}f.eal IS NOT NULL
      ORDER BY f.eal DESC
      LIMIT 5;
    `;
    const driversRes = await query(driversSql, params);
    const topLossDrivers = driversRes.rows.map((r: any) => ({
      assetId: r.asset_id,
      assetName: r.asset_name || 'Enterprise Asset',
      cveId: r.cve_id,
      eal: parseFloat(r.eal),
    }));

    return {
      totalModeledEal: totalEal,
      availableEalCount: availableCount,
      totalEvaluatedCount: totalCount,
      isPartialCoverage: isPartial,
      coverageNote,
      currency: row.currency || 'USD',
      totalPrimaryLoss: Math.round(parseFloat(row.total_primary || '0') * 100) / 100,
      totalSecondaryLoss: Math.round(parseFloat(row.total_secondary || '0') * 100) / 100,
      averageOutageHours: Math.round(parseFloat(row.avg_outage || '0') * 10) / 10,
      highestLossAsset,
      topLossDrivers,
      isEstimated: true,
    };
  }
}

export const executiveRepository = new ExecutiveRepository();
