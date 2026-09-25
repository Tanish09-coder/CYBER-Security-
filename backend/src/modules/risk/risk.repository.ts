// =============================================================================
// CyberRiskOS — Risk Engine Repository Layer
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// =============================================================================

import { query } from '../../db';
import {
  RiskEvaluationResultDTO,
  RiskScoreQueryParams,
  StoredRiskResultRecord,
  RiskScoreItemDTO,
} from './risk.types';

export class RiskRepository {
  /**
   * Persists or updates a deterministic risk evaluation result in risk_results table.
   */
  async upsertRiskResult(
    result: RiskEvaluationResultDTO,
    orgId?: string | null,
    vulnId?: string | null,
    snapshotMeta: Record<string, any> = {}
  ): Promise<StoredRiskResultRecord> {
    const sql = `
      INSERT INTO risk_results (
        organization_id,
        asset_id,
        vulnerability_id,
        cve_id,
        score,
        level,
        base_cvss,
        model_version,
        input_provenance_hash,
        data_completeness,
        factors,
        missing_data_warnings,
        risk_flags,
        snapshot_metadata,
        evaluated_at,
        created_at,
        updated_at
      )
      VALUES (COALESCE($1, (SELECT organization_id FROM assets WHERE id = $2)), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      ON CONFLICT (asset_id, cve_id) DO UPDATE SET
        organization_id = COALESCE(EXCLUDED.organization_id, risk_results.organization_id),
        vulnerability_id = COALESCE(EXCLUDED.vulnerability_id, risk_results.vulnerability_id),
        score = EXCLUDED.score,
        level = EXCLUDED.level,
        base_cvss = EXCLUDED.base_cvss,
        model_version = EXCLUDED.model_version,
        input_provenance_hash = EXCLUDED.input_provenance_hash,
        data_completeness = EXCLUDED.data_completeness,
        factors = EXCLUDED.factors,
        missing_data_warnings = EXCLUDED.missing_data_warnings,
        risk_flags = EXCLUDED.risk_flags,
        snapshot_metadata = EXCLUDED.snapshot_metadata,
        evaluated_at = EXCLUDED.evaluated_at,
        updated_at = NOW()
      RETURNING *;
    `;

    const score = result.riskScore;
    const level = result.severity;
    const dataCompleteness = result.dataCompletenessScore;

    const params = [
      orgId || null,
      result.assetId,
      vulnId || null,
      result.cveId,
      score,
      level,
      result.baseCvss,
      result.modelVersion,
      result.provenanceHash,
      dataCompleteness,
      JSON.stringify(result.factors || []),
      JSON.stringify(result.missingDataWarnings || []),
      JSON.stringify(result.riskFlags || []),
      JSON.stringify(snapshotMeta),
      result.evaluatedAt,
    ];

    const res = await query(sql, params);
    return this.mapRow(res.rows[0]);
  }

  /**
   * Alias for upsertRiskResult to support existing callers.
   */
  async upsertRiskScore(result: RiskEvaluationResultDTO): Promise<StoredRiskResultRecord> {
    return this.upsertRiskResult(result);
  }

  /**
   * Batch upserts risk scores within an execution cycle.
   */
  async upsertBatchRiskScores(
    results: RiskEvaluationResultDTO[]
  ): Promise<StoredRiskResultRecord[]> {
    const saved: StoredRiskResultRecord[] = [];
    for (const r of results) {
      saved.push(await this.upsertRiskResult(r));
    }
    return saved;
  }

  /**
   * Looks up a persisted risk evaluation result by primary record ID.
   */
  async findById(id: string): Promise<StoredRiskResultRecord | null> {
    const sql = `
      SELECT * FROM risk_results
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await query(sql, [id]);
    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRow(res.rows[0]);
  }

  /**
   * Looks up a persisted risk evaluation result for an atomic (asset_id, cve_id) pair.
   * Used for deterministic cache validation.
   */
  async findByAssetAndCve(assetId: string, cveId: string): Promise<StoredRiskResultRecord | null> {
    const sql = `
      SELECT * FROM risk_results
      WHERE asset_id = $1 AND cve_id = $2
      LIMIT 1;
    `;
    const res = await query(sql, [assetId, cveId]);
    if (res.rows.length === 0) {
      return null;
    }
    return this.mapRow(res.rows[0]);
  }

  /**
   * Retrieves paginated risk score records with filtering and clean DTO mapping.
   * Deterministic pagination: ordered by score DESC, evaluated_at DESC, id ASC.
   */
  async getRiskScores(params: RiskScoreQueryParams): Promise<{
    items: RiskScoreItemDTO[];
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
      conditions.push(`asset_id = $${idx++}`);
      values.push(params.assetId);
    }

    if (params.cveId) {
      conditions.push(`cve_id = $${idx++}`);
      values.push(params.cveId);
    }

    const targetLevel = params.level || params.severity;
    if (targetLevel) {
      conditions.push(`level = $${idx++}`);
      values.push(targetLevel);
    }

    if (params.minScore !== undefined) {
      conditions.push(`score >= $${idx++}`);
      values.push(params.minScore);
    }

    if (params.maxScore !== undefined) {
      conditions.push(`score <= $${idx++}`);
      values.push(params.maxScore);
    }

    if (params.modelVersion) {
      conditions.push(`model_version = $${idx++}`);
      values.push(params.modelVersion);
    }

    if (params.organizationId) {
      conditions.push(`organization_id = $${idx++}`);
      values.push(params.organizationId);
    }

    const whereClause = conditions.join(' AND ');

    // Count query on risk_results
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM risk_results
      WHERE ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    // Data query: paginated risk_results with deterministic ordering
    const dataSql = `
      SELECT 
        id,
        asset_id,
        cve_id,
        score,
        level,
        base_cvss,
        model_version,
        input_provenance_hash,
        data_completeness,
        factors,
        missing_data_warnings,
        risk_flags,
        evaluated_at
      FROM risk_results
      WHERE ${whereClause}
      ORDER BY score DESC, evaluated_at DESC, id ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataValues = [...values, limit, offset];
    const dataRes = await query(dataSql, dataValues);

    // Fetch asset names for asset_ids in result batch
    const assetMap = new Map<string, string>();
    const assetIds = Array.from(new Set(dataRes.rows.map((r: any) => r.asset_id).filter(Boolean)));
    if (assetIds.length > 0) {
      try {
        const assetRes = await query(`SELECT id, name FROM assets WHERE id = ANY($1::uuid[])`, [assetIds]);
        for (const a of assetRes.rows) {
          assetMap.set(a.id, a.name);
        }
      } catch {}
    }

    const items: RiskScoreItemDTO[] = dataRes.rows.map((row: any) => {
      const score = row.score !== null && row.score !== undefined ? parseFloat(row.score) : null;
      const dataCompleteness = row.data_completeness !== null && row.data_completeness !== undefined ? parseFloat(row.data_completeness) : 0.0;
      return {
        id: row.id,
        assetId: row.asset_id,
        assetName: assetMap.get(row.asset_id) || undefined,
        cveId: row.cve_id,
        score,
        level: row.level,
        baseCvss: row.base_cvss !== null ? parseFloat(row.base_cvss) : null,
        modelVersion: row.model_version,
        inputProvenanceHash: row.input_provenance_hash,
        dataCompleteness,
        factors: typeof row.factors === 'string' ? JSON.parse(row.factors) : row.factors,
        missingDataWarnings:
          typeof row.missing_data_warnings === 'string'
            ? JSON.parse(row.missing_data_warnings)
            : row.missing_data_warnings,
        riskFlags:
          typeof row.risk_flags === 'string' ? JSON.parse(row.risk_flags) : row.risk_flags,
        evaluatedAt: row.evaluated_at instanceof Date ? row.evaluated_at.toISOString() : String(row.evaluated_at),
        // Documented compatibility aliases
        riskScore: score,
        severity: row.level,
        dataCompletenessScore: dataCompleteness,
        provenanceHash: row.input_provenance_hash,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves aggregated risk summary for an asset.
   */
  async getAssetRiskSummary(assetId: string): Promise<any | null> {
    let assetName = 'Unknown Asset';
    let assetType = 'server';
    let criticalityTier = 3;
    let isInternetFacing = false;

    try {
      const assetSql = `SELECT id, name, asset_type, business_criticality, is_internet_facing FROM assets WHERE id = $1 LIMIT 1`;
      const assetRes = await query(assetSql, [assetId]);
      if (assetRes.rows.length > 0) {
        const a = assetRes.rows[0];
        assetName = a.name;
        assetType = a.asset_type;
        criticalityTier = a.business_criticality;
        isInternetFacing = a.is_internet_facing;
      } else {
        // Asset does not exist in assets table
        return null;
      }
    } catch {
      // If assets table is not queried or in test
    }

    const statsSql = `
      SELECT 
        COUNT(*)::int AS total_vulnerabilities,
        COALESCE(MAX(score), 0.0) AS max_risk_score,
        COALESCE(AVG(score), 0.0) AS avg_risk_score,
        COUNT(CASE WHEN level = 'CRITICAL' THEN 1 END)::int AS critical_count,
        COUNT(CASE WHEN level = 'HIGH' THEN 1 END)::int AS high_count,
        COUNT(CASE WHEN level = 'MEDIUM' THEN 1 END)::int AS medium_count,
        COUNT(CASE WHEN level = 'LOW' THEN 1 END)::int AS low_count
      FROM risk_results
      WHERE asset_id = $1
    `;
    const statsRes = await query(statsSql, [assetId]);
    const stats = statsRes.rows[0];

    const scoresSql = `
      SELECT 
        rr.id,
        rr.asset_id,
        rr.cve_id,
        rr.score,
        rr.level,
        rr.base_cvss,
        rr.model_version,
        rr.input_provenance_hash,
        rr.data_completeness,
        rr.factors,
        rr.missing_data_warnings,
        rr.risk_flags,
        rr.evaluated_at
      FROM risk_results rr
      WHERE rr.asset_id = $1
      ORDER BY rr.score DESC, rr.evaluated_at DESC, rr.id ASC
      LIMIT 50
    `;
    const scoresRes = await query(scoresSql, [assetId]);

    const highestScore = parseFloat(stats.max_risk_score);
    let highestLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (stats.critical_count > 0) highestLevel = 'CRITICAL';
    else if (stats.high_count > 0) highestLevel = 'HIGH';
    else if (stats.medium_count > 0) highestLevel = 'MEDIUM';

    const evaluations = scoresRes.rows.map((r: any) => ({
      id: r.id,
      assetId: r.asset_id,
      cveId: r.cve_id,
      score: parseFloat(r.score),
      level: r.level,
      baseCvss: r.base_cvss !== null ? parseFloat(r.base_cvss) : null,
      modelVersion: r.model_version,
      inputProvenanceHash: r.input_provenance_hash,
      dataCompleteness: parseFloat(r.data_completeness),
      factors: typeof r.factors === 'string' ? JSON.parse(r.factors) : r.factors,
      missingDataWarnings: typeof r.missing_data_warnings === 'string' ? JSON.parse(r.missing_data_warnings) : r.missing_data_warnings,
      riskFlags: typeof r.risk_flags === 'string' ? JSON.parse(r.risk_flags) : r.risk_flags,
      evaluatedAt: r.evaluated_at instanceof Date ? r.evaluated_at.toISOString() : String(r.evaluated_at),
      // Backwards-compatible aliases
      riskScore: parseFloat(r.score),
      severity: r.level,
    }));

    return {
      assetId,
      assetName,
      assetType,
      criticalityTier,
      isInternetFacing,
      totalVulnerabilitiesEvaluated: stats.total_vulnerabilities,
      highestScore,
      highestLevel,
      maxRiskScore: highestScore,
      averageScore: Math.round(parseFloat(stats.avg_risk_score) * 100) / 100,
      avgRiskScore: Math.round(parseFloat(stats.avg_risk_score) * 100) / 100,
      levelDistribution: {
        CRITICAL: stats.critical_count,
        HIGH: stats.high_count,
        MEDIUM: stats.medium_count,
        LOW: stats.low_count,
      },
      severityCounts: {
        critical: stats.critical_count,
        high: stats.high_count,
        medium: stats.medium_count,
        low: stats.low_count,
      },
      evaluations,
      topRiskVulnerabilities: evaluations,
    };
  }

  /**
   * Retrieves risk exposure distribution across assets for a CVE.
   */
  async getVulnerabilityRiskDistribution(cveId: string): Promise<any | null> {
    let cvssBaseScore: number | null = null;
    let cvssBaseSeverity: string | null = null;
    let knownExploited = false;

    try {
      const vulnSql = `SELECT cve_id, cvss_base_score, cvss_base_severity, known_exploited FROM vulnerabilities WHERE cve_id = $1 LIMIT 1`;
      const vulnRes = await query(vulnSql, [cveId]);
      if (vulnRes.rows.length > 0) {
        cvssBaseScore = vulnRes.rows[0].cvss_base_score !== null ? parseFloat(vulnRes.rows[0].cvss_base_score) : null;
        cvssBaseSeverity = vulnRes.rows[0].cvss_base_severity;
        knownExploited = Boolean(vulnRes.rows[0].known_exploited);
      } else {
        // Vulnerability not found in catalog
        return null;
      }
    } catch {
      // If table check fails
    }

    const statsSql = `
      SELECT 
        COUNT(*)::int AS affected_assets_count,
        COALESCE(MAX(score), 0.0) AS max_risk_score,
        COALESCE(AVG(score), 0.0) AS avg_risk_score,
        COUNT(CASE WHEN level = 'CRITICAL' THEN 1 END)::int AS critical_count,
        COUNT(CASE WHEN level = 'HIGH' THEN 1 END)::int AS high_count,
        COUNT(CASE WHEN level = 'MEDIUM' THEN 1 END)::int AS medium_count,
        COUNT(CASE WHEN level = 'LOW' THEN 1 END)::int AS low_count
      FROM risk_results
      WHERE cve_id = $1
    `;
    const statsRes = await query(statsSql, [cveId]);
    const stats = statsRes.rows[0];

    const assetsSql = `
      SELECT 
        rr.id,
        rr.asset_id,
        rr.cve_id,
        rr.score,
        rr.level,
        rr.base_cvss,
        rr.model_version,
        rr.input_provenance_hash,
        rr.data_completeness,
        rr.factors,
        rr.missing_data_warnings,
        rr.risk_flags,
        rr.evaluated_at
      FROM risk_results rr
      WHERE rr.cve_id = $1
      ORDER BY rr.score DESC, rr.evaluated_at DESC, rr.id ASC
      LIMIT 50
    `;
    const assetsRes = await query(assetsSql, [cveId]);

    const highestScore = parseFloat(stats.max_risk_score);
    let highestLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (stats.critical_count > 0) highestLevel = 'CRITICAL';
    else if (stats.high_count > 0) highestLevel = 'HIGH';
    else if (stats.medium_count > 0) highestLevel = 'MEDIUM';

    const evaluations = assetsRes.rows.map((r: any) => ({
      id: r.id,
      assetId: r.asset_id,
      cveId: r.cve_id,
      score: parseFloat(r.score),
      level: r.level,
      baseCvss: r.base_cvss !== null ? parseFloat(r.base_cvss) : null,
      modelVersion: r.model_version,
      inputProvenanceHash: r.input_provenance_hash,
      dataCompleteness: parseFloat(r.data_completeness),
      factors: typeof r.factors === 'string' ? JSON.parse(r.factors) : r.factors,
      missingDataWarnings: typeof r.missing_data_warnings === 'string' ? JSON.parse(r.missing_data_warnings) : r.missing_data_warnings,
      riskFlags: typeof r.risk_flags === 'string' ? JSON.parse(r.risk_flags) : r.risk_flags,
      evaluatedAt: r.evaluated_at instanceof Date ? r.evaluated_at.toISOString() : String(r.evaluated_at),
      riskScore: parseFloat(r.score),
      severity: r.level,
    }));

    return {
      cveId,
      baseCvss: cvssBaseScore,
      baseSeverity: cvssBaseSeverity,
      knownExploited,
      totalAssetsAffected: stats.affected_assets_count,
      totalAffectedAssets: stats.affected_assets_count,
      highestScore,
      highestLevel,
      maxRiskScore: highestScore,
      averageScore: Math.round(parseFloat(stats.avg_risk_score) * 100) / 100,
      avgRiskScore: Math.round(parseFloat(stats.avg_risk_score) * 100) / 100,
      criticalAssetsCount: stats.critical_count,
      highAssetsCount: stats.high_count,
      levelDistribution: {
        CRITICAL: stats.critical_count,
        HIGH: stats.high_count,
        MEDIUM: stats.medium_count,
        LOW: stats.low_count,
      },
      evaluations,
      affectedAssets: evaluations,
    };
  }

  private mapRow(row: any): StoredRiskResultRecord {
    return {
      id: row.id,
      organization_id: row.organization_id || null,
      asset_id: row.asset_id,
      vulnerability_id: row.vulnerability_id || null,
      cve_id: row.cve_id,
      score: row.score !== null && row.score !== undefined ? parseFloat(row.score) : null,
      level: row.level,
      base_cvss: row.base_cvss !== null ? parseFloat(row.base_cvss) : null,
      model_version: row.model_version,
      input_provenance_hash: row.input_provenance_hash,
      data_completeness: parseFloat(row.data_completeness),
      factors:
        typeof row.factors === 'string' ? JSON.parse(row.factors) : row.factors,
      missing_data_warnings:
        typeof row.missing_data_warnings === 'string'
          ? JSON.parse(row.missing_data_warnings)
          : row.missing_data_warnings,
      risk_flags:
        typeof row.risk_flags === 'string' ? JSON.parse(row.risk_flags) : row.risk_flags,
      snapshot_metadata:
        typeof row.snapshot_metadata === 'string'
          ? JSON.parse(row.snapshot_metadata)
          : row.snapshot_metadata || {},
      evaluated_at: row.evaluated_at instanceof Date ? row.evaluated_at.toISOString() : String(row.evaluated_at),
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    };
  }
}

export const riskRepository = new RiskRepository();
