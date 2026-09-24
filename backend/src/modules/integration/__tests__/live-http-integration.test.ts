// =============================================================================
// CyberRiskOS — Post-Merge Integration Repair Pass Live Verification Suite
// Validates end-to-end integration between Harsh's Enterprise Context and
// Tanish's Risk, Financial, Optimization, Attack Path, Executive & Assistant engines.
// =============================================================================

import request from 'supertest';
import { app } from '../../../server';
import { query, runMigrations } from '../../../db';

describe('Post-Merge Integration Repair Pass — Live HTTP Verification', () => {
  let orgId: string;
  let assetId1: string;
  let assetId2: string;
  let vulnId: string;
  let riskResultId: string;
  let financialResultId: string;
  let optimizationResultId: string;
  let stratA: string;
  let stratB: string;

  beforeAll(async () => {
    await runMigrations();

    // 1. Create Organization with EUR currency
    const orgRes = await query(
      `INSERT INTO organizations (name, industry, employee_count, annual_revenue, currency)
       VALUES ('EuroSec Banking Corp', 'Banking', 4500, 750000000, 'EUR')
       RETURNING id, currency`
    );
    orgId = orgRes.rows[0].id;

    // 2. Create Assets with Risk Missing-Data Semantics (null criticality & null internet facing)
    const asset1Res = await query(
      `INSERT INTO assets (organization_id, name, asset_type, environment, business_criticality, is_internet_facing)
       VALUES ($1, 'Core Transaction Ledger', 'database', 'Production', NULL, NULL)
       RETURNING id, business_criticality, is_internet_facing`,
      [orgId]
    );
    assetId1 = asset1Res.rows[0].id;

    const asset2Res = await query(
      `INSERT INTO assets (organization_id, name, asset_type, environment, business_criticality, is_internet_facing)
       VALUES ($1, 'Public API Gateway', 'web_server', 'Production', 2, true)
       RETURNING id`,
      [orgId]
    );
    assetId2 = asset2Res.rows[0].id;

    // 3. Insert real CVE vulnerability
    const vulnRes = await query(
      `INSERT INTO vulnerabilities (cve_id, description, cvss_base_score, cvss_base_severity)
       VALUES ('CVE-2024-99999', 'Post-merge integration test vulnerability', 9.8, 'CRITICAL')
       ON CONFLICT (cve_id) DO UPDATE SET cvss_base_score = 9.8
       RETURNING id`
    );
    vulnId = vulnRes.rows[0].id;

    // 4. Link vulnerability to asset
    await query(
      `INSERT INTO asset_vulnerabilities (asset_id, vulnerability_id, cve_id, match_reason)
       VALUES ($1, $2, 'CVE-2024-99999', 'Integration test match')`,
      [assetId1, vulnId]
    );
  });

  // ---------------------------------------------------------------------------
  // 1. RISK MISSING-DATA SEMANTICS & HARSH -> RISK EVALUATION
  // ---------------------------------------------------------------------------
  describe('1. Harsh Enterprise Asset → Tanish Risk Engine', () => {
    it('should preserve UNKNOWN semantics for missing criticality & internet exposure', async () => {
      const getAsset = await request(app).get(`/api/assets/${assetId1}`).expect(200);
      expect(getAsset.body.businessCriticality).toBeNull();
      expect(getAsset.body.isInternetFacing).toBeNull();
    });

    it('should evaluate risk, surface missing-data warnings, and persist organization_id', async () => {
      const res = await request(app)
        .post('/api/risk/evaluate')
        .send({
          asset: {
            assetId: assetId1,
            assetName: 'Core Transaction Ledger',
            criticalityTier: null,
            isInternetFacing: null,
          },
          vulnerability: {
            cveId: 'CVE-2024-99999',
            cvssScore: 9.8,
          },
        })
        .expect(200);

      expect(res.body).toHaveProperty('score');
      expect(res.body.missingDataWarnings).toContain('MISSING_ASSET_CRITICALITY');
      expect(res.body.missingDataWarnings).toContain('UNKNOWN_INTERNET_EXPOSURE');

      // Verify organization_id is populated in database from asset
      const checkDb = await query(
        `SELECT id, organization_id, score FROM risk_results WHERE asset_id = $1 LIMIT 1`,
        [assetId1]
      );
      expect(checkDb.rows.length).toBe(1);
      expect(checkDb.rows[0].organization_id).toBe(orgId);
      riskResultId = checkDb.rows[0].id;
    });
  });

  // ---------------------------------------------------------------------------
  // 2. FINANCIAL ENGINE & AUTHORITATIVE ENTERPRISE FINANCIAL INPUTS
  // ---------------------------------------------------------------------------
  describe('2. Harsh Enterprise Financial Inputs → Tanish Financial Engine', () => {
    it('should set authoritative enterprise financial parameters', async () => {
      const res = await request(app)
        .post(`/api/organizations/${orgId}/financial-parameters`)
        .send({
          hourlyDowntimeCost: 75000,
          hourlyRecoveryRate: 1500,
        })
        .expect(200);

      expect(res.body.hourlyDowntimeCost).toBe(75000);
    });

    it('should evaluate correlated financial exposure using authoritative stored currency (EUR), not USD', async () => {
      const res = await request(app)
        .post(`/api/financial/assets/${assetId1}/evaluate`)
        .expect(200);

      // Verify currency is EUR (from organization)
      expect(res.body.currency).toBe('EUR');
      expect(res.body.results.length).toBeGreaterThanOrEqual(1);
      const firstResult = res.body.results[0];
      expect(firstResult.hourlyDowntimeRate).toBe(75000);

      // Verify missing fields remain NOT_AVAILABLE / null (no invented multipliers)
      expect(firstResult.alef).toBeNull();
      expect(firstResult.ealStatus).toBe('NOT_AVAILABLE');
      expect(firstResult.estimatedOutageHours).toBeNull();
      expect(firstResult.recoveryCost).toBeNull();

      // Verify organization_id is persisted in financial_results
      const checkDb = await query(
        `SELECT id, organization_id, currency, hourly_downtime_rate, eal_status
         FROM financial_results WHERE asset_id = $1 LIMIT 1`,
        [assetId1]
      );
      expect(checkDb.rows.length).toBe(1);
      expect(checkDb.rows[0].organization_id).toBe(orgId);
      expect(checkDb.rows[0].currency).toBe('EUR');
      expect(checkDb.rows[0].eal_status).toBe('NOT_AVAILABLE');
      financialResultId = checkDb.rows[0].id;
    });
  });

  // ---------------------------------------------------------------------------
  // 3. OPTIMIZER INTEGRATION & ADAPTER
  // ---------------------------------------------------------------------------
  describe('3. Harsh Remediation Actions + Budget → Tanish Optimizer Adapter', () => {
    it('should create remediation actions for the organization', async () => {
      const actionRes = await request(app)
        .post('/api/remediation-actions')
        .send({
          organizationId: orgId,
          title: 'Implement Multi-Factor Authentication',
          actionType: 'ENABLE_CONTROL',
          targetControlCode: 'MFA',
          affectedAssetIds: [assetId1],
          remediationCost: 25000,
          status: 'PLANNED',
        })
        .expect(201);

      expect(actionRes.body).toHaveProperty('id');
      expect(actionRes.body.remediationCost).toBe(25000);
    });

    it('should solve optimization request without invented benefits and return optimizationResultId', async () => {
      const res = await request(app)
        .post('/api/optimization/solve')
        .send({
          budgetLimit: 50000,
          currency: 'EUR',
          candidateActions: [
            {
              actionId: 'ACT-01',
              actionType: 'ENABLE_CONTROL',
              title: 'Database Encryption at Rest',
              targetAssetId: assetId1,
              cost: 20000,
              estimatedRiskReduction: 35.0,
              estimatedEalReduction: 15000.0,
            },
            {
              actionId: 'ACT-02',
              actionType: 'ENABLE_CONTROL',
              title: 'API Gateway WAF Deployment',
              targetAssetId: assetId2,
              cost: 15000,
              estimatedRiskReduction: 25.0,
              estimatedEalReduction: 10000.0,
            },
          ],
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('optimizationResultId');
      expect(res.body.data.strategies.length).toBeGreaterThan(1);
      optimizationResultId = res.body.data.optimizationResultId;
      stratA = res.body.data.strategies[0].strategyId;
      stratB = res.body.data.strategies[1].strategyId;
    });
  });

  // ---------------------------------------------------------------------------
  // 4. ATTACK PATHS TOPOLOGY ALIGNMENT
  // ---------------------------------------------------------------------------
  describe('4. Harsh Topology Dependencies → Tanish Attack Path Engine', () => {
    it('should create asset dependency using actual schema columns', async () => {
      const depRes = await request(app)
        .post(`/api/assets/${assetId2}/dependencies`)
        .send({
          targetAssetId: assetId1,
          dependencyType: 'NETWORK_PATH',
          propagationWeight: 0.85,
        })
        .expect(201);

      expect(depRes.body.sourceAssetId).toBe(assetId2);
      expect(depRes.body.targetAssetId).toBe(assetId1);
      expect(depRes.body.dependencyType).toBe('NETWORK_PATH');
    });

    it('should query attack paths by joining assets on organization_id without error', async () => {
      const graphRes = await request(app)
        .get(`/api/attack-paths?organizationId=${orgId}`)
        .expect(200);

      expect(graphRes.body.success).toBe(true);
      expect(graphRes.body.data.totalNodes).toBeGreaterThanOrEqual(2);
      expect(graphRes.body.data.totalEdges).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. EXECUTIVE DASHBOARD & PERSISTED RESULTS FILTERING
  // ---------------------------------------------------------------------------
  describe('5. Persisted Results → Executive Decision Engine', () => {
    it('should return executive posture filtered by organization_id', async () => {
      const res = await request(app)
        .get(`/api/executive/posture?organizationId=${orgId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalAssetsEvaluated).toBeGreaterThanOrEqual(1);
    });

    it('should return executive financial summary filtered by organization_id', async () => {
      const res = await request(app)
        .get(`/api/executive/financial-summary?organizationId=${orgId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('availableEalCount');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. AI ASSISTANT REAL STRATEGY COMPARISON & AUTHORITATIVE RESOLUTION
  // ---------------------------------------------------------------------------
  describe('6. Optimization Results → AI Assistant Strategy Comparison', () => {
    it('should resolve real optimization strategies without hardcoded numbers', async () => {
      const res = await request(app)
        .post('/api/assistant/compare-strategies')
        .send({
          optimizationResultId,
          strategyIds: [stratA, stratB],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.explanation).toBeDefined();
      // Must NOT contain the old hardcoded arbitrary numbers (50000, 45000, 125000, 90000, 177.78, 350)
      expect(res.body.data.explanation).not.toContain('$125,000');
      expect(res.body.data.explanation).not.toContain('$90,000');
    });

    it('should use authoritative stored currency in financial explanation', async () => {
      const res = await request(app)
        .post('/api/assistant/explain-financial')
        .send({
          financialResultId,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.promptGroundingCitation).toContain('EUR');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. COMPLIANCE ROUTES (CANONICAL & /api/v1 ALIASES)
  // ---------------------------------------------------------------------------
  describe('7. Compliance Routes Accessibility', () => {
    it('should return 200 for canonical GET /api/compliance/frameworks', async () => {
      const res = await request(app).get('/api/compliance/frameworks').expect(200);
      expect(res.body).toHaveProperty('frameworks');
      expect(Array.isArray(res.body.frameworks)).toBe(true);
    });

    it('should return 200 for alias GET /api/v1/compliance/frameworks (NOT 501)', async () => {
      const res = await request(app).get('/api/v1/compliance/frameworks').expect(200);
      expect(res.body).toHaveProperty('frameworks');
      expect(Array.isArray(res.body.frameworks)).toBe(true);
    });

    it('should return 200 for canonical GET /api/compliance and /api/v1/compliance', async () => {
      await request(app).get('/api/compliance').expect(200);
      await request(app).get('/api/v1/compliance').expect(200);
    });
  });
});
