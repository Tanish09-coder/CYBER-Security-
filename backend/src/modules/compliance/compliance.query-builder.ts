// =============================================================================
// CyberRiskOS — Compliance Query Builder & Indexing Layer
// Phase: Phase 7A — Compliance Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P7A-01)
// =============================================================================

import {
  ComplianceFrameworkCoverageFilter,
  ComplianceGapsFilter,
  ComplianceEvidenceFilter,
  ParameterizedQuery,
} from './compliance.types';

export class ComplianceQueryBuilder {
  /**
   * Builds an optimized parameterized SQL query to compute framework coverage metrics.
   * Cross-references compliance frameworks, requirements, control mappings, and asset control postures.
   */
  buildFrameworkCoverageQuery(filter: ComplianceFrameworkCoverageFilter = {}): ParameterizedQuery {
    const values: any[] = [];
    const whereClauses: string[] = [];

    if (filter.organizationId) {
      values.push(filter.organizationId);
      whereClauses.push(`a.organization_id = $${values.length}`);
    }

    if (filter.frameworkCode) {
      values.push(filter.frameworkCode.toUpperCase());
      whereClauses.push(`UPPER(cf.code) = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const text = `
      SELECT
        cf.code AS framework_code,
        cf.name AS framework_name,
        COUNT(DISTINCT cr.id)::int AS total_requirements,
        COUNT(DISTINCT CASE WHEN ac.status = 'IMPLEMENTED' THEN cr.id END)::int AS implemented_requirements,
        COUNT(DISTINCT CASE WHEN ac.status = 'PARTIAL' THEN cr.id END)::int AS partial_requirements,
        COUNT(DISTINCT CASE WHEN ac.status = 'NOT_IMPLEMENTED' OR ac.status IS NULL THEN cr.id END)::int AS missing_requirements,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT CASE WHEN ac.status = 'IMPLEMENTED' THEN cr.id END)::numeric / 
             NULLIF(COUNT(DISTINCT cr.id), 0)::numeric) * 100.0,
            0.0
          ),
          2
        )::float AS compliance_percentage
      FROM compliance_frameworks cf
      JOIN compliance_requirements cr ON cr.framework_id = cf.id
      JOIN compliance_control_mappings ccm ON ccm.requirement_id = cr.id
      JOIN security_controls sc ON sc.code = ccm.control_code
      LEFT JOIN asset_controls ac ON ac.control_code = sc.code
      LEFT JOIN assets a ON a.id = ac.asset_id
      ${whereSql}
      GROUP BY cf.code, cf.name
      ORDER BY cf.code ASC;
    `.trim();

    return { text, values };
  }

  /**
   * Builds an optimized query to identify high-priority compliance gaps across enterprise assets.
   * Prioritized by asset business criticality and unmitigated control status.
   */
  buildComplianceGapsQuery(filter: ComplianceGapsFilter = {}): ParameterizedQuery {
    const values: any[] = [];
    const whereClauses: string[] = [
      "(ac.status IN ('NOT_IMPLEMENTED', 'UNKNOWN', 'PARTIAL') OR ac.status IS NULL)",
    ];

    if (filter.organizationId) {
      values.push(filter.organizationId);
      whereClauses.push(`a.organization_id = $${values.length}`);
    }

    if (filter.frameworkCode) {
      values.push(filter.frameworkCode.toUpperCase());
      whereClauses.push(`UPPER(cf.code) = $${values.length}`);
    }

    if (filter.minAssetCriticality !== undefined) {
      values.push(filter.minAssetCriticality);
      whereClauses.push(`a.business_criticality <= $${values.length}`);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const limit = Math.max(1, Math.min(100, filter.limit ?? 25));
    values.push(limit);
    const limitClause = `LIMIT $${values.length}`;

    const offset = Math.max(0, filter.offset ?? 0);
    values.push(offset);
    const offsetClause = `OFFSET $${values.length}`;

    const text = `
      SELECT
        cr.id AS requirement_id,
        cr.code AS requirement_code,
        cr.title AS requirement_title,
        sc.code AS control_code,
        sc.name AS control_name,
        a.id AS asset_id,
        a.name AS asset_name,
        a.business_criticality AS asset_criticality,
        COALESCE(ac.status, 'NOT_IMPLEMENTED') AS status,
        COALESCE(ac.effectiveness_score, 0.0)::float AS effectiveness_score
      FROM compliance_frameworks cf
      JOIN compliance_requirements cr ON cr.framework_id = cf.id
      JOIN compliance_control_mappings ccm ON ccm.requirement_id = cr.id
      JOIN security_controls sc ON sc.code = ccm.control_code
      CROSS JOIN assets a
      LEFT JOIN asset_controls ac ON ac.asset_id = a.id AND ac.control_code = sc.code
      ${whereSql}
      ORDER BY a.business_criticality ASC, cr.code ASC
      ${limitClause}
      ${offsetClause};
    `.trim();

    return { text, values };
  }

  /**
   * Builds an audit-ready query aggregating verification evidence for compliance reporting.
   */
  buildEvidenceAggregationQuery(filter: ComplianceEvidenceFilter = {}): ParameterizedQuery {
    const values: any[] = [];
    const whereClauses: string[] = [];

    if (filter.organizationId) {
      values.push(filter.organizationId);
      whereClauses.push(`a.organization_id = $${values.length}`);
    }

    if (filter.frameworkCode) {
      values.push(filter.frameworkCode.toUpperCase());
      whereClauses.push(`UPPER(cf.code) = $${values.length}`);
    }

    if (filter.controlCode) {
      values.push(filter.controlCode.toUpperCase());
      whereClauses.push(`UPPER(ac.control_code) = $${values.length}`);
    }

    if (filter.requirementCode) {
      values.push(filter.requirementCode.toUpperCase());
      whereClauses.push(`UPPER(cr.code) = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const limit = Math.max(1, Math.min(200, filter.limit ?? 50));
    values.push(limit);
    const limitClause = `LIMIT $${values.length}`;

    const offset = Math.max(0, filter.offset ?? 0);
    values.push(offset);
    const offsetClause = `OFFSET $${values.length}`;

    const text = `
      SELECT
        ac.id AS evidence_id,
        ac.control_code,
        sc.name AS control_name,
        a.id AS asset_id,
        a.name AS asset_name,
        ac.source,
        ac.status,
        ac.last_verified_at,
        ac.notes
      FROM asset_controls ac
      JOIN security_controls sc ON sc.code = ac.control_code
      JOIN assets a ON a.id = ac.asset_id
      LEFT JOIN compliance_control_mappings ccm ON ccm.control_code = sc.code
      LEFT JOIN compliance_requirements cr ON cr.id = ccm.requirement_id
      LEFT JOIN compliance_frameworks cf ON cf.id = cr.framework_id
      ${whereSql}
      ORDER BY ac.last_verified_at DESC
      ${limitClause}
      ${offsetClause};
    `.trim();

    return { text, values };
  }

  /**
   * Builds an aggregation query computing compliance score per asset.
   *
   * Quantitative Semantics & Scoring Formula:
   * - Numerator: COUNT of distinct mapped controls with status = 'IMPLEMENTED' (passing controls).
   * - Denominator: COUNT of all distinct assessed controls for asset (excluding NOT_APPLICABLE).
   * - Applicable controls only: Controls marked 'NOT_APPLICABLE' are excluded from the denominator.
   * - UNKNOWN treatment: Included in denominator, 0 credit in numerator (treated as non-passing until verified).
   * - PARTIAL treatment: Included in denominator, 0 credit in numerator in standard binary mode.
   *
   * DISCLAIMER:
   * This platform-generated score is an internal security control posture metric only.
   * It DOES NOT constitute or imply formal regulatory compliance certification, audit sign-off, or legal compliance status.
   */
  buildAssetComplianceScoreQuery(organizationId?: string): ParameterizedQuery {
    const values: any[] = [];
    const whereClause = organizationId ? `WHERE a.organization_id = $1` : '';
    if (organizationId) {
      values.push(organizationId);
    }

    const text = `
      SELECT
        a.id AS asset_id,
        a.name AS asset_name,
        a.business_criticality,
        COUNT(DISTINCT ac.control_code)::int AS assessed_controls_count,
        COUNT(DISTINCT CASE WHEN ac.status = 'IMPLEMENTED' THEN ac.control_code END)::int AS implemented_controls_count,
        ROUND(
          COALESCE(
            (COUNT(DISTINCT CASE WHEN ac.status = 'IMPLEMENTED' THEN ac.control_code END)::numeric / 
             NULLIF(COUNT(DISTINCT ac.control_code), 0)::numeric) * 100.0,
            0.0
          ),
          2
        )::float AS compliance_score
      FROM assets a
      LEFT JOIN asset_controls ac ON ac.asset_id = a.id AND ac.status != 'NOT_APPLICABLE'
      ${whereClause}
      GROUP BY a.id, a.name, a.business_criticality
      ORDER BY compliance_score ASC, a.business_criticality ASC;
    `.trim();

    return { text, values };
  }

  /**
   * Returns recommended composite indexes intended to improve query performance across joined compliance queries.
   */
  getRecommendedOptimizationIndexes(): string[] {
    return [
      `CREATE INDEX IF NOT EXISTS idx_asset_controls_perf_comp ON asset_controls (asset_id, control_code, status);`,
      `CREATE INDEX IF NOT EXISTS idx_compliance_mappings_comp ON compliance_control_mappings (requirement_id, control_code);`,
      `CREATE INDEX IF NOT EXISTS idx_compliance_req_framework ON compliance_requirements (framework_id, code);`,
      `CREATE INDEX IF NOT EXISTS idx_assets_org_criticality ON assets (organization_id, business_criticality);`,
    ];
  }
}

export const complianceQueryBuilder = new ComplianceQueryBuilder();
