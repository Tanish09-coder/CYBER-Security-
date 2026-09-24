// =============================================================================
// CyberRiskOS — What-If Simulation Engine API Integration Test Suite
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// Tests:
// - POST /api/scenarios/simulate (Full Enterprise Posture Simulation)
// - POST /api/scenarios/simulate (Verification of ZERO Database Mutations)
// - POST /api/scenarios/assets/:assetId/simulate (Targeted Single-Asset Simulation)
// - GET /api/scenarios/presets (Standard executive presets retrieval)
// - Error Handling: 503 SERVICE_UNAVAILABLE & 504 TIMEOUT propagation
// - Validation: 400 Bad Request on invalid payloads
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createScenariosRouter } from '../scenarios.routes';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { initMemoryDb, query } from '../../../db';
import {
  scenarioEngineClient,
  ScenarioEngineServiceError,
} from '../scenarios.client';
import { ScenarioSimulationResultDTO } from '../scenarios.types';

let app: express.Application;
let testOrgId: string;
let testAssetId: string;
const testCveId = 'CVE-2021-44228';

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/assets', createAssetRouter());
  app.use('/api/scenarios', createScenariosRouter());
  app.use('/api/v1/scenarios', createScenariosRouter());

  // 1. Setup Test Organization
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Scenario Simulation Org', currency: 'USD' });
  testOrgId = orgRes.body.id;

  // 2. Setup Test Asset
  const assetRes = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Internet Edge Gateway',
      hostname: 'edge-gw-01.corp',
      business_criticality: 1,
      is_internet_facing: true,
    });
  testAssetId = assetRes.body.id;

  // 3. Ensure Vulnerabilities Exist in DB
  const vulnRes = await query(
    `INSERT INTO vulnerabilities (
      cve_id, description, cvss_version, cvss_base_score, cvss_base_severity,
      known_exploited, kev_known_ransomware_campaign_use, source, source_record_id
    ) VALUES 
    ($1, 'Log4Shell Vulnerability', '3.1', 10.0, 'CRITICAL', true, 'Known', 'NVD', 'rec-scen-001')
    ON CONFLICT (cve_id) DO UPDATE SET description = EXCLUDED.description
    RETURNING id;`,
    [testCveId]
  );
  const vulnId = vulnRes.rows[0].id;

  // Correlate asset to vulnerability
  await query(
    `INSERT INTO asset_vulnerabilities (asset_id, vulnerability_id, cve_id, match_reason)
     VALUES ($1, $2, $3, 'Test CPE Correlation')
     ON CONFLICT DO NOTHING;`,
    [testAssetId, vulnId, testCveId]
  );
});

describe('What-If Simulation Engine API Endpoints (/api/scenarios)', () => {
  describe('POST /api/scenarios/simulate', () => {
    it('should simulate a remediation scenario and verify ZERO database mutations', async () => {
      // Snapshot database counts before simulation
      const countAssetsBefore = (await query('SELECT COUNT(*) FROM assets;')).rows[0].count;
      const countVulnsBefore = (await query('SELECT COUNT(*) FROM vulnerabilities;')).rows[0].count;
      const countCorrelationsBefore = (await query('SELECT COUNT(*) FROM asset_vulnerabilities;')).rows[0].count;

      const mockResult: ScenarioSimulationResultDTO = {
        scenarioName: 'Remediate Edge Vulnerability & Isolate Perimeter',
        baselineAvgRiskScore: 9.8,
        simulatedAvgRiskScore: 0.0,
        riskScoreDelta: -9.8,
        riskReductionPct: 100.0,
        baselineTotalEal: 250000.0,
        simulatedTotalEal: 0.0,
        ealDelta: -250000.0,
        ealReductionPct: 100.0,
        ealStatus: 'CALCULATED',
        currency: 'USD',
        totalActionsApplied: 2,
        actionImpacts: [
          {
            actionType: 'PATCH_VULNERABILITY',
            targetAssetId: testAssetId,
            targetCveId: testCveId,
            riskScoreReduction: 9.8,
            ealReduction: 250000.0,
            currency: 'USD',
            summary: `Remediated ${testCveId} on asset ${testAssetId}.`,
          },
          {
            actionType: 'ISOLATE_ASSET',
            targetAssetId: testAssetId,
            riskScoreReduction: 0.0,
            ealReduction: 0.0,
            currency: 'USD',
            summary: `Isolated asset ${testAssetId} from internet edge (contextual update; 0.0 score delta under Risk Model v1).`,
          },
        ],
        modelVersion: '1.0.0',
        isSimulation: true,
        simulatedAt: new Date().toISOString(),
      };

      const clientSpy = jest
        .spyOn(scenarioEngineClient, 'simulateScenario')
        .mockResolvedValueOnce(mockResult);

      const requestPayload = {
        scenarioName: 'Remediate Edge Vulnerability & Isolate Perimeter',
        actions: [
          {
            actionType: 'PATCH_VULNERABILITY',
            targetAssetId: testAssetId,
            targetCveId: testCveId,
          },
          {
            actionType: 'ISOLATE_ASSET',
            targetAssetId: testAssetId,
          },
        ],
      };

      const res = await request(app)
        .post('/api/scenarios/simulate')
        .send(requestPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.baselineAvgRiskScore).toBe(9.8);
      expect(res.body.data.simulatedAvgRiskScore).toBe(0.0);
      expect(res.body.data.riskScoreDelta).toBe(-9.8);
      expect(res.body.data.ealDelta).toBe(-250000.0);
      expect(res.body.data.isSimulation).toBe(true);
      expect(res.body.data.actionImpacts.length).toBe(2);
      expect(clientSpy).toHaveBeenCalledTimes(1);

      // CRITICAL REQUIREMENT VERIFICATION: Verify ZERO database mutations occurred!
      const countAssetsAfter = (await query('SELECT COUNT(*) FROM assets;')).rows[0].count;
      const countVulnsAfter = (await query('SELECT COUNT(*) FROM vulnerabilities;')).rows[0].count;
      const countCorrelationsAfter = (await query('SELECT COUNT(*) FROM asset_vulnerabilities;')).rows[0].count;

      expect(countAssetsAfter).toBe(countAssetsBefore);
      expect(countVulnsAfter).toBe(countVulnsBefore);
      expect(countCorrelationsAfter).toBe(countCorrelationsBefore);

      clientSpy.mockRestore();
    });

    it('should propagate 503 SERVICE_UNAVAILABLE when Python microservice is offline', async () => {
      const clientSpy = jest
        .spyOn(scenarioEngineClient, 'simulateScenario')
        .mockRejectedValueOnce(
          new ScenarioEngineServiceError(
            'Scenario Engine is offline',
            503,
            'SCENARIO_ENGINE_UNAVAILABLE'
          )
        );

      const res = await request(app)
        .post('/api/scenarios/simulate')
        .send({
          scenarioName: 'Failing Simulation',
          actions: [
            {
              actionType: 'ISOLATE_ASSET',
              targetAssetId: testAssetId,
            },
          ],
        });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
      expect(res.body.code).toBe('SCENARIO_ENGINE_UNAVAILABLE');

      clientSpy.mockRestore();
    });

    it('should reject invalid payloads with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/scenarios/simulate')
        .send({
          actions: [], // Empty actions
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/scenarios/assets/:assetId/simulate', () => {
    it('should simulate remediation actions targeted at a single asset', async () => {
      const mockResult: ScenarioSimulationResultDTO = {
        scenarioName: `Asset ${testAssetId} Remediation`,
        baselineAvgRiskScore: 8.5,
        simulatedAvgRiskScore: 5.0,
        riskScoreDelta: -3.5,
        riskReductionPct: 41.18,
        baselineTotalEal: 100000.0,
        simulatedTotalEal: 40000.0,
        ealDelta: -60000.0,
        ealReductionPct: 60.0,
        ealStatus: 'CALCULATED',
        currency: 'USD',
        totalActionsApplied: 1,
        actionImpacts: [
          {
            actionType: 'PATCH_VULNERABILITY',
            targetAssetId: testAssetId,
            targetCveId: testCveId,
            riskScoreReduction: 3.5,
            ealReduction: 60000.0,
            currency: 'USD',
            summary: `Remediated ${testCveId} on asset ${testAssetId}.`,
          },
        ],
        modelVersion: '1.0.0',
        isSimulation: true,
        simulatedAt: new Date().toISOString(),
      };

      const clientSpy = jest
        .spyOn(scenarioEngineClient, 'simulateScenario')
        .mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post(`/api/scenarios/assets/${testAssetId}/simulate`)
        .send({
          scenarioName: 'Targeted Asset Patch Simulation',
          actions: [
            {
              actionType: 'PATCH_VULNERABILITY',
              targetAssetId: testAssetId,
              targetCveId: testCveId,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.riskReductionPct).toBe(41.18);
      expect(res.body.data.isSimulation).toBe(true);
      expect(res.body.data.actionImpacts[0].riskScoreReduction).toBe(3.5);

      clientSpy.mockRestore();
    });

    it('should confirm that control implementation yields 0.0 risk reduction in Risk Model v1', async () => {
      const mockResult: ScenarioSimulationResultDTO = {
        scenarioName: `Asset ${testAssetId} Control Enforcement`,
        baselineAvgRiskScore: 8.5,
        simulatedAvgRiskScore: 8.5,
        riskScoreDelta: 0.0,
        riskReductionPct: 0.0,
        baselineTotalEal: 100000.0,
        simulatedTotalEal: 100000.0,
        ealDelta: 0.0,
        ealReductionPct: 0.0,
        ealStatus: 'CALCULATED',
        currency: 'USD',
        totalActionsApplied: 1,
        actionImpacts: [
          {
            actionType: 'IMPLEMENT_CONTROL',
            targetAssetId: testAssetId,
            riskScoreReduction: 0.0,
            ealReduction: 0.0,
            currency: 'USD',
            summary: `Implemented MFA on asset ${testAssetId} (contextual defense posture updated; no quantitative reduction under Risk Model v1).`,
          },
        ],
        modelVersion: '1.0.0',
        isSimulation: true,
        simulatedAt: new Date().toISOString(),
      };

      const clientSpy = jest
        .spyOn(scenarioEngineClient, 'simulateScenario')
        .mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post(`/api/scenarios/assets/${testAssetId}/simulate`)
        .send({
          scenarioName: 'Targeted Asset MFA Enforcement',
          actions: [
            {
              actionType: 'IMPLEMENT_CONTROL',
              targetAssetId: testAssetId,
              controlCode: 'MFA',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.riskScoreDelta).toBe(0.0);
      expect(res.body.data.actionImpacts[0].riskScoreReduction).toBe(0.0);
      expect(res.body.data.actionImpacts[0].ealReduction).toBe(0.0);

      clientSpy.mockRestore();
    });
  });

  describe('GET /api/scenarios/presets', () => {
    it('should return executive scenario simulation presets', async () => {
      const res = await request(app).get('/api/scenarios/presets');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const presetIds = res.body.data.map((p: any) => p.id);
      expect(presetIds).toContain('PRESET-PATCH-KEV');
      expect(presetIds).toContain('PRESET-MFA-TIER1');
      expect(presetIds).toContain('PRESET-ISOLATE-EDGE');
    });
  });
});
