// =============================================================================
// CyberRiskOS — Risk Repository Unit & Persistence Tests
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// Tests:
// - Repository persistence in risk_results table
// - Upsert on conflict (asset_id, cve_id)
// - findByAssetAndCve cache lookup
// - Deterministic pagination (page, limit, total, totalPages)
// - Deterministic ordering (score DESC, evaluated_at DESC, id ASC)
// - Multi-criteria filtering (assetId, cveId, level, minScore, maxScore, modelVersion)
// - Null-safe factor fields
// - Model version preservation (1.0.0)
// - Aggregated asset risk summary and CVE impact distribution
// =============================================================================

import { initMemoryDb, query } from '../../../db';
import { RiskRepository } from '../risk.repository';
import { RiskEvaluationResultDTO } from '../risk.types';

describe('RiskRepository (014_risk_results persistence)', () => {
  let repo: RiskRepository;
  const testOrgId = '22222222-2222-2222-2222-222222222222';
  const testAsset1Id = '33333333-3333-3333-3333-333333333331';
  const testAsset2Id = '33333333-3333-3333-3333-333333333332';
  const testCveId1 = 'CVE-2021-44228';
  const testCveId2 = 'CVE-2023-34362';

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await initMemoryDb();
    repo = new RiskRepository();

    // 1. Seed test organization
    await query(
      `INSERT INTO organizations (id, name) VALUES ($1, 'Repo Test Org') ON CONFLICT (id) DO NOTHING;`,
      [testOrgId]
    );

    // 2. Seed test assets
    await query(
      `INSERT INTO assets (id, organization_id, name, business_criticality, is_internet_facing)
       VALUES ($1, $2, 'Primary Switch', 1, true)
       ON CONFLICT (id) DO NOTHING;`,
      [testAsset1Id, testOrgId]
    );
    await query(
      `INSERT INTO assets (id, organization_id, name, business_criticality, is_internet_facing)
       VALUES ($1, $2, 'Secondary Database', 3, false)
       ON CONFLICT (id) DO NOTHING;`,
      [testAsset2Id, testOrgId]
    );

    // 3. Seed test vulnerabilities
    await query(
      `INSERT INTO vulnerabilities (cve_id, description, cvss_base_score, cvss_base_severity, known_exploited)
       VALUES ($1, 'Log4j RCE', 10.0, 'CRITICAL', true),
              ($2, 'MOVEit SQLi', 9.8, 'CRITICAL', true)
       ON CONFLICT (cve_id) DO NOTHING;`,
      [testCveId1, testCveId2]
    );
  });

  const sampleResult1: RiskEvaluationResultDTO = {
    assetId: testAsset1Id,
    assetName: 'Primary Switch',
    cveId: testCveId1,
    baseCvss: 10.0,
    riskScore: 100.0,
    severity: 'CRITICAL',
    factors: [
      {
        name: 'CVSS_TECHNICAL_SEVERITY',
        category: 'TECHNICAL_SEVERITY',
        value: 10.0,
        weight: 1.0,
        contribution: 100.0,
        rationale: 'NIST NVD Base Score',
      },
    ],
    missingDataWarnings: [],
    dataCompletenessScore: 1.0,
    riskFlags: ['CISA_KEV_ACTIVE_EXPLOITATION'],
    modelVersion: '1.0.0',
    provenanceHash: '1111111111111111111111111111111111111111111111111111111111111111',
    evaluatedAt: '2026-09-24T12:00:00.000Z',
  };

  const sampleResult2: RiskEvaluationResultDTO = {
    assetId: testAsset1Id,
    assetName: 'Primary Switch',
    cveId: testCveId2,
    baseCvss: 5.0,
    riskScore: 70.0,
    severity: 'HIGH',
    factors: [],
    missingDataWarnings: ['MISSING_CONTROLS'],
    dataCompletenessScore: 0.75,
    riskFlags: [],
    modelVersion: '1.0.0',
    provenanceHash: '2222222222222222222222222222222222222222222222222222222222222222',
    evaluatedAt: '2026-09-24T12:01:00.000Z',
  };

  describe('upsertRiskResult and findByAssetAndCve', () => {
    it('should persist a deterministic risk result into risk_results table', async () => {
      const saved = await repo.upsertRiskResult(sampleResult1, testOrgId);

      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.asset_id).toBe(testAsset1Id);
      expect(saved.cve_id).toBe(testCveId1);
      expect(saved.score).toBe(100.0);
      expect(saved.level).toBe('CRITICAL');
      expect(saved.model_version).toBe('1.0.0');
      expect(saved.input_provenance_hash).toBe(sampleResult1.provenanceHash);
      expect(saved.data_completeness).toBe(1.0);
      expect(saved.factors).toHaveLength(1);
      expect(saved.risk_flags).toContain('CISA_KEV_ACTIVE_EXPLOITATION');
    });

    it('should retrieve persisted record by asset_id and cve_id', async () => {
      const found = await repo.findByAssetAndCve(testAsset1Id, testCveId1);

      expect(found).not.toBeNull();
      expect(found?.asset_id).toBe(testAsset1Id);
      expect(found?.cve_id).toBe(testCveId1);
      expect(found?.score).toBe(100.0);
      expect(found?.input_provenance_hash).toBe(sampleResult1.provenanceHash);
    });

    it('should return null when looking up non-existent asset or CVE', async () => {
      const found = await repo.findByAssetAndCve(testAsset1Id, 'CVE-9999-99999');
      expect(found).toBeNull();
    });

    it('should update existing record on conflict (asset_id, cve_id) with new score and hash', async () => {
      const updatedInput: RiskEvaluationResultDTO = {
        ...sampleResult1,
        riskScore: 84.0,
        severity: 'HIGH',
        provenanceHash: '3333333333333333333333333333333333333333333333333333333333333333',
      };

      const updated = await repo.upsertRiskResult(updatedInput, testOrgId);
      expect(updated.score).toBe(84.0);
      expect(updated.level).toBe('HIGH');
      expect(updated.input_provenance_hash).toBe(updatedInput.provenanceHash);

      // Verify DB has only 1 record for this pair
      const found = await repo.findByAssetAndCve(testAsset1Id, testCveId1);
      expect(found?.score).toBe(84.0);
      expect(found?.level).toBe('HIGH');
    });

    it('should handle null-safe factor fields correctly', async () => {
      const nullSafeInput: RiskEvaluationResultDTO = {
        assetId: testAsset2Id,
        cveId: testCveId1,
        baseCvss: null,
        riskScore: 0.0,
        severity: 'LOW',
        factors: [],
        missingDataWarnings: ['MISSING_CVSS_SCORE'],
        dataCompletenessScore: 0.5,
        riskFlags: [],
        modelVersion: '1.0.0',
        provenanceHash: '4444444444444444444444444444444444444444444444444444444444444444',
        evaluatedAt: '2026-09-24T12:05:00.000Z',
      };

      const saved = await repo.upsertRiskResult(nullSafeInput, null, null);
      expect(saved.base_cvss).toBeNull();
      expect(saved.score).toBe(0.0);
      expect(saved.level).toBe('LOW');
      expect(saved.factors).toEqual([]);
      expect(saved.missing_data_warnings).toContain('MISSING_CVSS_SCORE');
    });
  });

  describe('getRiskScores (Pagination, Ordering & Filtering)', () => {
    beforeAll(async () => {
      // Seed sampleResult2
      await repo.upsertRiskResult(sampleResult2, testOrgId);
    });

    it('should return deterministic pagination metadata', async () => {
      const res = await repo.getRiskScores({ page: 1, limit: 1 });

      expect(res.page).toBe(1);
      expect(res.limit).toBe(1);
      expect(res.total).toBeGreaterThanOrEqual(2);
      expect(res.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.items).toHaveLength(1);
    });

    it('should order results deterministically by score DESC', async () => {
      const res = await repo.getRiskScores({ page: 1, limit: 10 });

      for (let i = 0; i < res.items.length - 1; i++) {
        expect(res.items[i].score!).toBeGreaterThanOrEqual(res.items[i + 1].score!);
      }
    });

    it('should filter scores by assetId', async () => {
      const res = await repo.getRiskScores({ assetId: testAsset1Id });
      expect(res.items.every((item) => item.assetId === testAsset1Id)).toBe(true);
    });

    it('should filter scores by cveId', async () => {
      const res = await repo.getRiskScores({ cveId: testCveId1 });
      expect(res.items.every((item) => item.cveId === testCveId1)).toBe(true);
    });

    it('should filter scores by level', async () => {
      const res = await repo.getRiskScores({ level: 'HIGH' });
      expect(res.items.every((item) => item.level === 'HIGH')).toBe(true);
    });

    it('should filter scores by minScore and maxScore range', async () => {
      const res = await repo.getRiskScores({ minScore: 60, maxScore: 90 });
      for (const item of res.items) {
        expect(item.score).toBeGreaterThanOrEqual(60);
        expect(item.score).toBeLessThanOrEqual(90);
      }
    });

    it('should preserve model_version = 1.0.0 across all records', async () => {
      const res = await repo.getRiskScores({ modelVersion: '1.0.0' });
      expect(res.items.every((item) => item.modelVersion === '1.0.0')).toBe(true);
    });
  });

  describe('getAssetRiskSummary', () => {
    it('should return aggregated asset risk summary', async () => {
      const summary = await repo.getAssetRiskSummary(testAsset1Id);

      expect(summary).not.toBeNull();
      expect(summary.assetId).toBe(testAsset1Id);
      expect(summary.assetName).toBe('Primary Switch');
      expect(summary.totalVulnerabilitiesEvaluated).toBeGreaterThanOrEqual(1);
      expect(summary.highestScore).toBeGreaterThanOrEqual(70.0);
      expect(summary.levelDistribution).toBeDefined();
      expect(summary.evaluations).toBeDefined();
    });

    it('should return null for non-existent asset ID', async () => {
      const summary = await repo.getAssetRiskSummary('00000000-0000-0000-0000-000000000000');
      expect(summary).toBeNull();
    });
  });

  describe('getVulnerabilityRiskDistribution', () => {
    it('should return exposure distribution across assets for a CVE', async () => {
      const dist = await repo.getVulnerabilityRiskDistribution(testCveId1);

      expect(dist).not.toBeNull();
      expect(dist.cveId).toBe(testCveId1);
      expect(dist.totalAssetsAffected).toBeGreaterThanOrEqual(1);
      expect(dist.maxRiskScore).toBeGreaterThanOrEqual(0.0);
      expect(dist.levelDistribution).toBeDefined();
      expect(dist.affectedAssets).toBeDefined();
    });

    it('should return null for non-existent CVE', async () => {
      const dist = await repo.getVulnerabilityRiskDistribution('CVE-9999-99999');
      expect(dist).toBeNull();
    });
  });
});
