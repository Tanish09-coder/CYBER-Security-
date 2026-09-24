// =============================================================================
// CyberRiskOS — Compliance Query Builder Test Suite
// Phase: Phase 7A — Compliance Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P7A-01)
// =============================================================================

import { complianceQueryBuilder, ComplianceQueryBuilder } from '../compliance.query-builder';

describe('ComplianceQueryBuilder (Phase 7A)', () => {
  let builder: ComplianceQueryBuilder;

  beforeEach(() => {
    builder = new ComplianceQueryBuilder();
  });

  describe('buildFrameworkCoverageQuery', () => {
    it('should generate valid unparameterized query when no filters provided', () => {
      const { text, values } = builder.buildFrameworkCoverageQuery();

      expect(text).toContain('SELECT');
      expect(text).toContain('compliance_frameworks cf');
      expect(text).toContain('compliance_percentage');
      expect(text).toContain('GROUP BY cf.code, cf.name');
      expect(values).toHaveLength(0);
    });

    it('should safely parameterize organizationId and frameworkCode filters', () => {
      const { text, values } = builder.buildFrameworkCoverageQuery({
        organizationId: 'org-uuid-1234',
        frameworkCode: 'NIST_CSF',
      });

      expect(text).toContain('a.organization_id = $1');
      expect(text).toContain('UPPER(cf.code) = $2');
      expect(values).toEqual(['org-uuid-1234', 'NIST_CSF']);
    });
  });

  describe('buildComplianceGapsQuery', () => {
    it('should include default limit and offset', () => {
      const { text, values } = builder.buildComplianceGapsQuery();

      expect(text).toContain('LIMIT $1');
      expect(text).toContain('OFFSET $2');
      expect(values).toEqual([25, 0]);
    });

    it('should filter by criticality, framework, and organization', () => {
      const { text, values } = builder.buildComplianceGapsQuery({
        organizationId: 'org-abc',
        frameworkCode: 'ISO_27001',
        minAssetCriticality: 2,
        limit: 10,
        offset: 5,
      });

      expect(text).toContain('a.organization_id = $1');
      expect(text).toContain('UPPER(cf.code) = $2');
      expect(text).toContain('a.business_criticality <= $3');
      expect(text).toContain('LIMIT $4');
      expect(text).toContain('OFFSET $5');
      expect(values).toEqual(['org-abc', 'ISO_27001', 2, 10, 5]);
    });

    it('should clamp limit between 1 and 100', () => {
      const { values: lowValues } = builder.buildComplianceGapsQuery({ limit: -10 });
      expect(lowValues[0]).toBe(1);

      const { values: highValues } = builder.buildComplianceGapsQuery({ limit: 500 });
      expect(highValues[0]).toBe(100);
    });
  });

  describe('buildEvidenceAggregationQuery', () => {
    it('should generate audit evidence aggregation query with multiple filters', () => {
      const { text, values } = builder.buildEvidenceAggregationQuery({
        organizationId: 'org-99',
        frameworkCode: 'CIS_V8',
        controlCode: 'MFA',
        requirementCode: 'REQ-1.1',
        limit: 50,
      });

      expect(text).toContain('a.organization_id = $1');
      expect(text).toContain('UPPER(cf.code) = $2');
      expect(text).toContain('UPPER(ac.control_code) = $3');
      expect(text).toContain('UPPER(cr.code) = $4');
      expect(text).toContain('LIMIT $5');
      expect(text).toContain('OFFSET $6');
      expect(values).toEqual(['org-99', 'CIS_V8', 'MFA', 'REQ-1.1', 50, 0]);
    });
  });

  describe('buildAssetComplianceScoreQuery', () => {
    it('should aggregate compliance score per asset without filter', () => {
      const { text, values } = builder.buildAssetComplianceScoreQuery();

      expect(text).toContain('compliance_score');
      expect(text).toContain('GROUP BY a.id, a.name, a.business_criticality');
      expect(values).toHaveLength(0);
    });

    it('should filter by organizationId when provided', () => {
      const { text, values } = builder.buildAssetComplianceScoreQuery('org-target');

      expect(text).toContain('WHERE a.organization_id = $1');
      expect(values).toEqual(['org-target']);
    });
  });

  describe('getRecommendedOptimizationIndexes', () => {
    it('should return non-empty list of valid composite index DDLs', () => {
      const indexes = builder.getRecommendedOptimizationIndexes();

      expect(indexes.length).toBeGreaterThanOrEqual(4);
      for (const idx of indexes) {
        expect(idx).toMatch(/^CREATE INDEX IF NOT EXISTS/);
      }
    });
  });
});
