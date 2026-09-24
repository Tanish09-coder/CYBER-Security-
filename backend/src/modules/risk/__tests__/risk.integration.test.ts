// =============================================================================
// CyberRiskOS — Risk Engine API Integration Test Suite
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// Tests:
// - POST /api/risk/evaluate (Single Evaluation, persistence & cache validation)
// - POST /api/risk/evaluate (Service Unavailable 503 & Timeout 504 propagation)
// - POST /api/risk/evaluate/batch (Batch Evaluation)
// - GET /api/risk/scores (Deterministic pagination & multi-criteria filtering)
// - GET /api/risk/assets/:assetId (Asset summary & 404 handling)
// - GET /api/risk/vulnerabilities/:cveId (CVE impact distribution & 404 handling)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createRiskRouter } from '../risk.routes';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { initMemoryDb, query } from '../../../db';
import { riskEngineClient, RiskEngineServiceError, computeProvenanceHash } from '../risk.client';
import { RiskEvaluationResultDTO } from '../risk.types';

let app: express.Application;
let testOrgId: string;
let testAsset1Id: string;
let testAsset2Id: string;
const testCveId1 = 'CVE-2021-44228';
const testCveId2 = 'CVE-2023-34362';

beforeAll(async () => {
  process.env.USE_MEMORY_DB = 'true';
  await initMemoryDb();

  app = express();
  app.use(express.json());
  app.use('/api/organizations', createOrganizationRouter());
  app.use('/api/assets', createAssetRouter());
  app.use('/api/risk', createRiskRouter());
  app.use('/api/v1/risk', createRiskRouter());

  // 1. Setup Test Organization
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Risk Integration Org' });
  testOrgId = orgRes.body.id;

  // 2. Setup Test Assets
  const asset1Res = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'SWIFT Core Payment Switch',
      hostname: 'swift-core-01.corp',
      business_criticality: 1, // Tier 1: 1.40 weight
      is_internet_facing: true,
    });
  testAsset1Id = asset1Res.body.id;

  const asset2Res = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Internal Dev Workstation',
      hostname: 'dev-box-05.corp',
      business_criticality: 5, // Tier 5: 0.60 weight
      is_internet_facing: false,
    });
  testAsset2Id = asset2Res.body.id;

  // 3. Ensure Vulnerabilities Exist in DB
  await query(
    `INSERT INTO vulnerabilities (
      cve_id, description, cvss_version, cvss_base_score, cvss_base_severity,
      known_exploited, kev_known_ransomware_campaign_use, source, source_record_id
    ) VALUES 
    ($1, 'Log4Shell RCE', '3.1', 10.0, 'CRITICAL', true, 'Known', 'NVD', 'rec-001'),
    ($2, 'MOVEit Transfer SQLi', '3.1', 9.8, 'CRITICAL', true, 'Known', 'NVD', 'rec-002')
    ON CONFLICT (cve_id) DO NOTHING;`,
    [testCveId1, testCveId2]
  );
});

describe('Risk Engine API Endpoints (/api/risk)', () => {
  describe('POST /api/risk/evaluate (Single Evaluation)', () => {
    it('should evaluate and persist an atomic pair deterministically', async () => {
      const payload = {
        asset: {
          assetId: testAsset1Id,
          assetName: 'SWIFT Core Payment Switch',
          criticalityTier: 1 as const,
          isInternetFacing: true,
          controls: [
            { controlCode: 'MFA', status: 'IMPLEMENTED' as const },
            { controlCode: 'EDR', status: 'IMPLEMENTED' as const },
          ],
        },
        vulnerability: {
          cveId: testCveId1,
          cvssScore: 7.0, // 70.0 * 1.40 = 98.00
          cvssVersion: '3.1',
          isKnownExploited: true,
          knownRansomwareCampaignUse: 'Known',
        },
      };

      const computedHash = computeProvenanceHash(payload);

      const mockResponse: RiskEvaluationResultDTO = {
        assetId: testAsset1Id,
        assetName: 'SWIFT Core Payment Switch',
        cveId: testCveId1,
        baseCvss: 7.0,
        riskScore: 98.0,
        severity: 'CRITICAL',
        factors: [
          {
            name: 'CVSS_TECHNICAL_SEVERITY',
            category: 'TECHNICAL_SEVERITY',
            value: 7.0,
            weight: 1.0,
            contribution: 70.0,
            rationale: 'Base CVSS 7.0',
          },
        ],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        riskFlags: [
          'CISA_KEV_ACTIVE_EXPLOITATION',
          'RANSOMWARE_CAMPAIGN_ASSOCIATED',
          'INTERNET_FACING_PERIMETER',
        ],
        modelVersion: '1.0.0',
        provenanceHash: computedHash,
        evaluatedAt: new Date().toISOString(),
      };

      const spy = jest
        .spyOn(riskEngineClient, 'evaluateRisk')
        .mockResolvedValueOnce(mockResponse);

      const res = await request(app)
        .post('/api/risk/evaluate')
        .send(payload)
        .expect(200);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(res.body.assetId).toBe(testAsset1Id);
      expect(res.body.cveId).toBe(testCveId1);
      expect(res.body.score).toBe(98.0);
      expect(res.body.level).toBe('CRITICAL');
      expect(res.body.modelVersion).toBe('1.0.0');
      expect(res.body.inputProvenanceHash).toBe(computedHash);
      expect(res.body.dataCompleteness).toBe(1.0);
      expect(res.body.riskFlags).toContain('CISA_KEV_ACTIVE_EXPLOITATION');
      expect(res.body.isCached).toBe(false);

      // Verify second identical call triggers CACHE HIT without invoking Python client
      const cacheRes = await request(app)
        .post('/api/risk/evaluate')
        .send(payload)
        .expect(200);

      expect(spy).toHaveBeenCalledTimes(1); // Still 1, not called again!
      expect(cacheRes.body.isCached).toBe(true);
      expect(cacheRes.body.score).toBe(98.0);

      spy.mockRestore();
    });

    it('should return structured HTTP 503 when Python Risk Engine is unavailable', async () => {
      const payload = {
        asset: {
          assetId: testAsset2Id,
          assetName: 'Internal Dev Workstation',
          criticalityTier: 5 as const,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: testCveId2,
          cvssScore: 8.0,
          isKnownExploited: false,
        },
      };

      const spy = jest
        .spyOn(riskEngineClient, 'evaluateRisk')
        .mockRejectedValueOnce(
          new RiskEngineServiceError('Python Risk Engine unavailable', 503, 'RISK_ENGINE_UNAVAILABLE')
        );

      const res = await request(app)
        .post('/api/risk/evaluate')
        .send(payload)
        .expect(503);

      expect(res.body.error).toBe('Service Unavailable');
      expect(res.body.code).toBe('RISK_ENGINE_UNAVAILABLE');
      expect(res.body.message).toContain('Python Risk Engine unavailable');

      spy.mockRestore();
    });

    it('should return structured HTTP 504 when Python Risk Engine times out', async () => {
      const payload = {
        asset: {
          assetId: testAsset2Id,
          assetName: 'Internal Dev Workstation',
          criticalityTier: 5 as const,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: testCveId2,
          cvssScore: 8.0,
          isKnownExploited: false,
        },
      };

      const spy = jest
        .spyOn(riskEngineClient, 'evaluateRisk')
        .mockRejectedValueOnce(
          new RiskEngineServiceError('Risk Engine timed out', 504, 'RISK_ENGINE_TIMEOUT')
        );

      const res = await request(app)
        .post('/api/risk/evaluate')
        .send(payload)
        .expect(504);

      expect(res.body.code).toBe('RISK_ENGINE_TIMEOUT');

      spy.mockRestore();
    });

    it('should reject invalid payload with HTTP 400', async () => {
      const invalidPayload = {
        asset: {
          assetId: testAsset1Id,
          // Missing assetName and criticalityTier
        },
        vulnerability: {
          cveId: 'INVALID-CVE',
        },
      };

      const res = await request(app)
        .post('/api/risk/evaluate')
        .send(invalidPayload)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(Array.isArray(res.body.details)).toBe(true);
    });
  });

  describe('POST /api/risk/evaluate/batch (Batch Evaluation)', () => {
    it('should evaluate and persist multiple atomic pairs', async () => {
      const batchPayload = {
        evaluations: [
          {
            asset: {
              assetId: testAsset1Id,
              assetName: 'SWIFT Core Payment Switch',
              criticalityTier: 1 as const,
              isInternetFacing: true,
            },
            vulnerability: {
              cveId: testCveId2,
              cvssScore: 10.0,
              isKnownExploited: true,
            },
          },
          {
            asset: {
              assetId: testAsset2Id,
              assetName: 'Internal Dev Workstation',
              criticalityTier: 5 as const,
              isInternetFacing: false,
            },
            vulnerability: {
              cveId: testCveId1,
              cvssScore: 5.0,
              isKnownExploited: false,
            },
          },
        ],
      };

      const mockBatchResponse = {
        results: [
          {
            assetId: testAsset1Id,
            assetName: 'SWIFT Core Payment Switch',
            cveId: testCveId2,
            baseCvss: 10.0,
            riskScore: 100.0,
            severity: 'CRITICAL' as const,
            factors: [],
            missingDataWarnings: [],
            dataCompletenessScore: 1.0,
            riskFlags: ['CISA_KEV_ACTIVE_EXPLOITATION'],
            modelVersion: '1.0.0',
            provenanceHash: computeProvenanceHash(batchPayload.evaluations[0]),
            evaluatedAt: new Date().toISOString(),
          },
          {
            assetId: testAsset2Id,
            assetName: 'Internal Dev Workstation',
            cveId: testCveId1,
            baseCvss: 5.0,
            riskScore: 30.0,
            severity: 'LOW' as const,
            factors: [],
            missingDataWarnings: [],
            dataCompletenessScore: 1.0,
            riskFlags: [],
            modelVersion: '1.0.0',
            provenanceHash: computeProvenanceHash(batchPayload.evaluations[1]),
            evaluatedAt: new Date().toISOString(),
          },
        ],
        totalEvaluated: 2,
        modelVersion: '1.0.0',
      };

      const spy = jest
        .spyOn(riskEngineClient, 'evaluateRiskBatch')
        .mockResolvedValueOnce(mockBatchResponse);

      const res = await request(app)
        .post('/api/risk/evaluate/batch')
        .send(batchPayload)
        .expect(200);

      expect(res.body.totalEvaluated).toBe(2);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].score).toBe(100.0);
      expect(res.body.items[0].level).toBe('CRITICAL');
      expect(res.body.items[1].score).toBe(30.0);
      expect(res.body.items[1].level).toBe('LOW');

      spy.mockRestore();
    });

    it('should reject empty batch with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/risk/evaluate/batch')
        .send({ evaluations: [] })
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('GET /api/risk/scores (Screen N8 Query API)', () => {
    it('should return paginated risk scores with metadata', async () => {
      const res = await request(app)
        .get('/api/risk/scores?page=1&limit=10')
        .expect(200);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.total).toBeGreaterThanOrEqual(1);

      const first = res.body.items[0];
      expect(first).toHaveProperty('assetId');
      expect(first).toHaveProperty('cveId');
      expect(first).toHaveProperty('score');
      expect(first).toHaveProperty('level');
      expect(first).toHaveProperty('inputProvenanceHash');
      expect(first).toHaveProperty('modelVersion');
      expect(first).toHaveProperty('dataCompleteness');
    });

    it('should filter scores by level / severity', async () => {
      const res = await request(app)
        .get('/api/risk/scores?level=CRITICAL')
        .expect(200);

      expect(res.body.items.every((r: any) => r.level === 'CRITICAL')).toBe(true);
    });

    it('should filter scores by minScore and maxScore', async () => {
      const res = await request(app)
        .get('/api/risk/scores?minScore=90&maxScore=100')
        .expect(200);

      for (const item of res.body.items) {
        expect(item.score).toBeGreaterThanOrEqual(90);
        expect(item.score).toBeLessThanOrEqual(100);
      }
    });

    it('should filter scores by assetId', async () => {
      const res = await request(app)
        .get(`/api/risk/scores?assetId=${testAsset1Id}`)
        .expect(200);

      expect(res.body.items.every((r: any) => r.assetId === testAsset1Id)).toBe(true);
    });

    it('should filter scores by cveId', async () => {
      const res = await request(app)
        .get(`/api/risk/scores?cveId=${testCveId1}`)
        .expect(200);

      expect(res.body.items.every((r: any) => r.cveId === testCveId1)).toBe(true);
    });
  });

  describe('GET /api/risk/assets/:assetId (Asset Risk Summary)', () => {
    it('should return aggregate risk summary for an asset', async () => {
      const res = await request(app)
        .get(`/api/risk/assets/${testAsset1Id}`)
        .expect(200);

      expect(res.body.assetId).toBe(testAsset1Id);
      expect(res.body.assetName).toBe('SWIFT Core Payment Switch');
      expect(res.body.criticalityTier).toBe(1);
      expect(res.body.isInternetFacing).toBe(true);
      expect(res.body.totalVulnerabilitiesEvaluated).toBeGreaterThanOrEqual(1);
      expect(res.body.highestScore).toBeGreaterThanOrEqual(98.0);
      expect(res.body).toHaveProperty('levelDistribution');
      expect(Array.isArray(res.body.evaluations)).toBe(true);
    });

    it('should return 404 for non-existent asset', async () => {
      await request(app)
        .get('/api/risk/assets/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/risk/vulnerabilities/:cveId (Vulnerability Risk Distribution)', () => {
    it('should return impact distribution across enterprise assets for a CVE', async () => {
      const res = await request(app)
        .get(`/api/risk/vulnerabilities/${testCveId1}`)
        .expect(200);

      expect(res.body.cveId).toBe(testCveId1);
      expect(res.body.totalAssetsAffected).toBeGreaterThanOrEqual(1);
      expect(res.body).toHaveProperty('highestScore');
      expect(res.body).toHaveProperty('averageScore');
      expect(Array.isArray(res.body.affectedAssets)).toBe(true);
    });

    it('should return 404 for non-existent CVE', async () => {
      await request(app)
        .get('/api/risk/vulnerabilities/CVE-1999-99999')
        .expect(404);
    });
  });
});
