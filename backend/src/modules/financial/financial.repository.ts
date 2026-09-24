// =============================================================================
// CyberRiskOS — Financial Repository Layer
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Migration: 015_financial_results.sql
// =============================================================================

import { query } from '../../db';
import {
  FinancialExposureResultDTO,
  FinancialExposureQueryParams,
  StoredFinancialResultRecord,
  EnterpriseFinancialSummaryDTO,
} from './financial.types';

export class FinancialRepository {
  /**
   * Persists or updates a deterministic financial evaluation result in financial_results.
   */
  async upsertFinancialResult(
    result: FinancialExposureResultDTO,
    orgId?: string | null,
    vulnId?: string | null
  ): Promise<StoredFinancialResultRecord> {
    const sql = `
      INSERT INTO financial_results (
        organization_id,
        asset_id,
        vulnerability_id,
        cve_id,
        sle,
        alef,
        eal,
        eal_status,
        currency,
        primary_loss,
        secondary_loss,
        estimated_outage_hours,
        hourly_downtime_rate,
        recovery_cost,
        factors,
        missing_data_warnings,
        data_completeness,
        model_version,
        input_provenance_hash,
        is_estimated,
        evaluated_at,
        created_at,
        updated_at
      )
      VALUES (COALESCE($1, (SELECT organization_id FROM assets WHERE id = $2)), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
      ON CONFLICT (asset_id, cve_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, financial_results.organization_id),
        vulnerability_id = COALESCE(EXCLUDED.vulnerability_id, financial_results.vulnerability_id),
        sle = EXCLUDED.sle,
        alef = EXCLUDED.alef,
        eal = EXCLUDED.eal,
        eal_status = EXCLUDED.eal_status,
        currency = EXCLUDED.currency,
        primary_loss = EXCLUDED.primary_loss,
        secondary_loss = EXCLUDED.secondary_loss,
        estimated_outage_hours = EXCLUDED.estimated_outage_hours,
        hourly_downtime_rate = EXCLUDED.hourly_downtime_rate,
        recovery_cost = EXCLUDED.recovery_cost,
        factors = EXCLUDED.factors,
        missing_data_warnings = EXCLUDED.missing_data_warnings,
        data_completeness = EXCLUDED.data_completeness,
        model_version = EXCLUDED.model_version,
        input_provenance_hash = EXCLUDED.input_provenance_hash,
        is_estimated = EXCLUDED.is_estimated,
        evaluated_at = EXCLUDED.evaluated_at,
        updated_at = NOW()
      RETURNING *;
    `;

    const params = [
      orgId || null,
      result.assetId,
      vulnId || null,
      result.cveId,
      result.sle,
      result.alef !== undefined ? result.alef : null,
      result.eal !== undefined ? result.eal : null,
      result.ealStatus || (result.eal !== null && result.eal !== undefined ? 'CALCULATED' : 'NOT_AVAILABLE'),
      result.currency ?? null, // null if org currency was unavailable at evaluation time
      result.primaryLoss,
      result.secondaryLoss,
      result.estimatedOutageHours,
      result.hourlyDowntimeRate,
      result.recoveryCost,
      JSON.stringify(result.factors || []),
      JSON.stringify(result.missingDataWarnings || []),
      result.dataCompletenessScore,
      result.modelVersion,
      result.provenanceHash,
      result.isEstimated !== undefined ? result.isEstimated : true,
      result.evaluatedAt,
    ];

    const res = await query(sql, params);
    return this.mapRow(res.rows[0]);
  }

  async upsertBatchFinancialResults(
    results: FinancialExposureResultDTO[]
  ): Promise<StoredFinancialResultRecord[]> {
    const saved: StoredFinancialResultRecord[] = [];
    for (const r of results) {
      saved.push(await this.upsertFinancialResult(r));
    }
    return saved;
  }

  /**
   * Looks up a persisted financial exposure result by primary record ID.
   */
  async findById(id: string): Promise<StoredFinancialResultRecord | null> {
    const sql = `
      SELECT * FROM financial_results
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRow(res.rows[0]);
  }

  async findByAssetAndCve(
    assetId: string,
    cveId: string
  ): Promise<StoredFinancialResultRecord | null> {
    const sql = `
      SELECT * FROM financial_results
      WHERE asset_id = $1 AND cve_id = $2
      LIMIT 1;
    `;
    const res = await query(sql, [assetId, cveId]);
    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRow(res.rows[0]);
  }

  async getFinancialExposures(params: FinancialExposureQueryParams): Promise<{
    items: FinancialExposureResultDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let idx = 1;

    if (params.assetId) {
      conditions.push(`fr.asset_id = $${idx++}`);
      values.push(params.assetId);
    }

    if (params.cveId) {
      conditions.push(`fr.cve_id = $${idx++}`);
      values.push(params.cveId);
    }

    if (params.minEal !== undefined) {
      conditions.push(`fr.eal >= $${idx++}`);
      values.push(params.minEal);
    }

    if (params.maxEal !== undefined) {
      conditions.push(`fr.eal <= $${idx++}`);
      values.push(params.maxEal);
    }

    if (params.modelVersion) {
      conditions.push(`fr.model_version = $${idx++}`);
      values.push(params.modelVersion);
    }

    if (params.organizationId) {
      conditions.push(`fr.organization_id = $${idx++}`);
      values.push(params.organizationId);
    }

    const whereClause = conditions.join(' AND ');

    const countSql = `SELECT COUNT(*)::int AS total FROM financial_results fr WHERE ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    const dataSql = `
      SELECT fr.*
      FROM financial_results fr
      WHERE ${whereClause}
      ORDER BY fr.eal DESC, fr.evaluated_at DESC, fr.id ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataValues = [...values, limit, offset];
    const dataRes = await query(dataSql, dataValues);

    const assetIds = Array.from(new Set(dataRes.rows.map((r: any) => r.asset_id)));
    const assetNames: Record<string, string> = {};
    if (assetIds.length > 0) {
      try {
        const namesRes = await query(`SELECT id, name FROM assets WHERE id = ANY($1::uuid[])`, [assetIds]);
        for (const nr of namesRes.rows) {
          assetNames[nr.id] = nr.name;
        }
      } catch {
        // Graceful fallback
      }
    }

    const items: FinancialExposureResultDTO[] = dataRes.rows.map((row: any) => ({
      assetId: row.asset_id,
      assetName: assetNames[row.asset_id] || 'Enterprise Asset',
      cveId: row.cve_id,
      sle: parseFloat(row.sle),
      alef: row.alef !== null && row.alef !== undefined ? parseFloat(row.alef) : null,
      eal: row.eal !== null && row.eal !== undefined ? parseFloat(row.eal) : null,
      ealStatus: (row.eal_status as any) || (row.eal !== null && row.eal !== undefined ? 'CALCULATED' : 'NOT_AVAILABLE'),
      currency: row.currency,
      primaryLoss: parseFloat(row.primary_loss),
      secondaryLoss: parseFloat(row.secondary_loss),
      estimatedOutageHours: parseFloat(row.estimated_outage_hours),
      hourlyDowntimeRate: parseFloat(row.hourly_downtime_rate),
      recoveryCost: parseFloat(row.recovery_cost),
      factors: typeof row.factors === 'string' ? JSON.parse(row.factors) : row.factors,
      missingDataWarnings:
        typeof row.missing_data_warnings === 'string'
          ? JSON.parse(row.missing_data_warnings)
          : row.missing_data_warnings,
      dataCompletenessScore: parseFloat(row.data_completeness),
      modelVersion: row.model_version,
      provenanceHash: row.input_provenance_hash,
      isEstimated: row.is_estimated,
      evaluatedAt:
        row.evaluated_at instanceof Date ? row.evaluated_at.toISOString() : String(row.evaluated_at),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getAssetFinancialSummary(assetId: string): Promise<any | null> {
    const statsSql = `
      SELECT 
        COUNT(*)::int AS total_vulnerabilities,
        COALESCE(SUM(eal), 0.0) AS total_eal,
        COALESCE(MAX(sle), 0.0) AS max_sle,
        COALESCE(AVG(alef), 0.0) AS avg_alef,
        COALESCE(SUM(primary_loss), 0.0) AS total_primary_loss,
        COALESCE(SUM(secondary_loss), 0.0) AS total_secondary_loss
      FROM financial_results
      WHERE asset_id = $1
    `;
    const statsRes = await query(statsSql, [assetId]);
    const stats = statsRes.rows[0];

    let assetName = 'Enterprise Asset';
    try {
      const assetSql = `SELECT name FROM assets WHERE id = $1 LIMIT 1`;
      const assetRes = await query(assetSql, [assetId]);
      if (assetRes.rows.length > 0) {
        assetName = assetRes.rows[0].name;
      } else if (stats.total_vulnerabilities === 0) {
        return null;
      }
    } catch {
      if (stats.total_vulnerabilities === 0) return null;
    }

    const rowsSql = `
      SELECT * FROM financial_results
      WHERE asset_id = $1
      ORDER BY eal DESC
      LIMIT 25
    `;
    const rowsRes = await query(rowsSql, [assetId]);

    return {
      assetId,
      assetName,
      totalVulnerabilities: stats.total_vulnerabilities,
      totalModeledEal: Math.round(parseFloat(stats.total_eal) * 100) / 100,
      maxSle: parseFloat(stats.max_sle),
      avgAlef: Math.round(parseFloat(stats.avg_alef) * 10000) / 10000,
      totalPrimaryLoss: Math.round(parseFloat(stats.total_primary_loss) * 100) / 100,
      totalSecondaryLoss: Math.round(parseFloat(stats.total_secondary_loss) * 100) / 100,
      currency: rowsRes.rows[0]?.currency ?? null, // null = currency unavailable
      isEstimated: true,
      topLossVulnerabilities: rowsRes.rows.map((r: any) => ({
        cveId: r.cve_id,
        sle: parseFloat(r.sle),
        alef: parseFloat(r.alef),
        eal: parseFloat(r.eal),
        primaryLoss: parseFloat(r.primary_loss),
        secondaryLoss: parseFloat(r.secondary_loss),
        evaluatedAt:
          r.evaluated_at instanceof Date ? r.evaluated_at.toISOString() : String(r.evaluated_at),
      })),
    };
  }

  async getEnterpriseFinancialSummary(): Promise<EnterpriseFinancialSummaryDTO> {
    const statsSql = `
      SELECT 
        COALESCE(SUM(eal), 0.0) AS total_eal,
        COUNT(DISTINCT asset_id)::int AS total_assets,
        COUNT(*)::int AS total_vulns
      FROM financial_results
    `;
    const statsRes = await query(statsSql);
    const stats = statsRes.rows[0];

    const topAssetSql = `
      SELECT asset_id, SUM(eal) AS asset_eal
      FROM financial_results
      GROUP BY asset_id
      ORDER BY asset_eal DESC
      LIMIT 1
    `;
    const topAssetRes = await query(topAssetSql);
    const topAsset = topAssetRes.rows[0];

    let topAssetName = 'Top Loss Asset';
    if (topAsset) {
      try {
        const assetNameRes = await query(`SELECT name FROM assets WHERE id = $1 LIMIT 1`, [topAsset.asset_id]);
        if (assetNameRes.rows.length > 0) {
          topAssetName = assetNameRes.rows[0].name;
        }
      } catch {
        // Fallback
      }
    }

    const topDrivers = await this.getFinancialExposures({ page: 1, limit: 10 });

    return {
      totalModeledEal: Math.round(parseFloat(stats.total_eal) * 100) / 100,
      currency: topDrivers.items[0]?.currency ?? null, // null = no financial results yet
      totalEvaluatedAssets: stats.total_assets,
      totalEvaluatedVulnerabilities: stats.total_vulns,
      highestEalAsset: topAsset
        ? {
            assetId: topAsset.asset_id,
            assetName: topAsset.asset_name || 'Top Loss Asset',
            eal: Math.round(parseFloat(topAsset.asset_eal) * 100) / 100,
          }
        : null,
      topLossDrivers: topDrivers.items,
      isEstimated: true,
    };
  }

  private mapRow(row: any): StoredFinancialResultRecord {
    return {
      id: row.id,
      organization_id: row.organization_id || null,
      asset_id: row.asset_id,
      vulnerability_id: row.vulnerability_id || null,
      cve_id: row.cve_id,
      sle: row.sle !== null && row.sle !== undefined ? parseFloat(row.sle) : null,
      sle_status: row.sle_status || (row.sle !== null && row.sle !== undefined ? 'CALCULATED' : 'NOT_AVAILABLE'),
      alef: row.alef !== null && row.alef !== undefined ? parseFloat(row.alef) : null,
      eal: row.eal !== null && row.eal !== undefined ? parseFloat(row.eal) : null,
      eal_status: row.eal_status || (row.eal !== null && row.eal !== undefined ? 'CALCULATED' : 'NOT_AVAILABLE'),
      currency: row.currency,
      primary_loss: row.primary_loss !== null && row.primary_loss !== undefined ? parseFloat(row.primary_loss) : null,
      secondary_loss: row.secondary_loss !== null && row.secondary_loss !== undefined ? parseFloat(row.secondary_loss) : null,
      estimated_outage_hours: row.estimated_outage_hours !== null && row.estimated_outage_hours !== undefined ? parseFloat(row.estimated_outage_hours) : null,
      hourly_downtime_rate: row.hourly_downtime_rate !== null && row.hourly_downtime_rate !== undefined ? parseFloat(row.hourly_downtime_rate) : null,
      recovery_cost: row.recovery_cost !== null && row.recovery_cost !== undefined ? parseFloat(row.recovery_cost) : null,
      factors: typeof row.factors === 'string' ? JSON.parse(row.factors) : row.factors,
      missing_data_warnings:
        typeof row.missing_data_warnings === 'string'
          ? JSON.parse(row.missing_data_warnings)
          : row.missing_data_warnings,
      data_completeness: parseFloat(row.data_completeness),
      model_version: row.model_version,
      input_provenance_hash: row.input_provenance_hash,
      is_estimated: row.is_estimated,
      evaluated_at:
        row.evaluated_at instanceof Date ? row.evaluated_at.toISOString() : String(row.evaluated_at),
      created_at:
        row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updated_at:
        row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  }
}

export const financialRepository = new FinancialRepository();
