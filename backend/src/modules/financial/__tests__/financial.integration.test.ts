// =============================================================================
// CyberRiskOS — Financial Engine API Integration Test Suite
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Migration: 015_financial_results.sql
// Tests:
// - POST /api/financial/evaluate (Single Evaluation, persistence & deterministic caching)
// - POST /api/financial/evaluate (Service Unavailable 503 & Timeout 504 propagation)
// - POST /api/financial/evaluate/batch (Batch Evaluation with caching)
// - GET /api/financial/exposure (Deterministic pagination & multi-criteria filtering)
// - GET /api/financial/summary (Enterprise-level aggregated financial metrics)
// - GET /api/financial/assets/:assetId (Asset financial profile & 404 handling)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createFinancialRouter } from '../financial.routes';
import { createOrganizationRouter } from '../../organizations/organizations.routes';
import { createAssetRouter } from '../../assets/assets.routes';
import { initMemoryDb, query } from '../../../db';
import {
  financialEngineClient,
  FinancialEngineServiceError,
  computeFinancialProvenanceHash,
} from '../financial.client';
import { FinancialExposureResultDTO, BatchFinancialExposureResultDTO } from '../financial.types';

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
  app.use('/api/financial', createFinancialRouter());
  app.use('/api/v1/financial', createFinancialRouter());

  // 1. Setup Test Organization
  const orgRes = await request(app)
    .post('/api/organizations')
    .send({ name: 'Financial Test Org' });
  testOrgId = orgRes.body.id;

  // 2. Setup Test Assets
  const asset1Res = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Primary Transaction Switch',
      hostname: 'tx-switch-01.corp',
      business_criticality: 1, // Tier 1
      is_internet_facing: true,
    });
  testAsset1Id = asset1Res.body.id;

  const asset2Res = await request(app)
    .post('/api/assets')
    .send({
      organization_id: testOrgId,
      name: 'Analytics Worker Node',
      hostname: 'worker-03.internal',
      business_criticality: 3, // Tier 3
      is_internet_facing: false,
    });
  testAsset2Id = asset2Res.body.id;

  // 3. Ensure Vulnerabilities Exist in DB
  await query(
    `INSERT INTO vulnerabilities (
      cve_id, description, cvss_version, cvss_base_score, cvss_base_severity,
      known_exploited, kev_known_ransomware_campaign_use, source, source_record_id
    ) VALUES 
    ($1, 'Log4Shell Financial Impact', '3.1', 10.0, 'CRITICAL', true, 'Known', 'NVD', 'rec-fin-001'),
    ($2, 'MOVEit Financial Impact', '3.1', 9.8, 'CRITICAL', true, 'Known', 'NVD', 'rec-fin-002')
    ON CONFLICT (cve_id) DO NOTHING;`,
    [testCveId1, testCveId2]
  );
});

describe('Financial Engine API Endpoints (/api/financial)', () => {
  describe('POST /api/financial/evaluate (Single Evaluation)', () => {
    it('should evaluate and persist financial exposure with isEstimated=true', async () => {
      const payload = {
        asset: {
          assetId: testAsset1Id,
          assetName: 'Primary Transaction Switch',
          criticalityTier: 1 as const,
          isInternetFacing: true,
          hourlyDowntimeCost: 15000,
          recoveryCost: 60000,
          currency: 'USD',
        },
        vulnerability: {
          cveId: testCveId1,
          cvssScore: 10.0,
          availabilityImpact: 'HIGH' as const,
          scope: 'CHANGED' as const,
          isKnownExploited: true,
          knownRansomwareCampaignUse: 'Known',
        },
      };

      const mockResult: FinancialExposureResultDTO = {
        assetId: testAsset1Id,
        assetName: 'Primary Transaction Switch',
        cveId: testCveId1,
        sle: 420000,
        alef: 1.0,
        eal: 420000,
        ealStatus: 'CALCULATED',
        currency: 'USD',
        primaryLoss: 360000,
        secondaryLoss: 60000,
        estimatedOutageHours: 24,
        hourlyDowntimeRate: 15000,
        recoveryCost: 60000,
        factors: [
          {
            name: 'Primary Loss (Outage)',
            category: 'PRIMARY_LOSS',
            value: 360000,
            amount: 360000,
            rationale: '24h outage at $15000/hr',
          },
        ],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        modelVersion: '1.0.0',
        provenanceHash: computeFinancialProvenanceHash(payload),
        isEstimated: true,
        evaluatedAt: new Date().toISOString(),
      };

      const clientSpy = jest
        .spyOn(financialEngineClient, 'evaluateFinancialExposure')
        .mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/financial/evaluate')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.assetId).toBe(testAsset1Id);
      expect(res.body.cveId).toBe(testCveId1);
      expect(res.body.eal).toBe(420000);
      expect(res.body.sle).toBe(420000);
      expect(res.body.isEstimated).toBe(true);
      expect(res.body.isCached).toBe(false);
      expect(clientSpy).toHaveBeenCalledTimes(1);

      // Verify persistence in PostgreSQL memory DB
      const dbRes = await query(
        'SELECT * FROM financial_results WHERE asset_id = $1 AND cve_id = $2',
        [testAsset1Id, testCveId1]
      );
      expect(dbRes.rows.length).toBe(1);
      expect(parseFloat(dbRes.rows[0].eal)).toBe(420000);
      expect(dbRes.rows[0].is_estimated).toBe(true);

      clientSpy.mockRestore();
    });

    it('should return cached result without calling microservice if inputs are unchanged', async () => {
      const payload = {
        asset: {
          assetId: testAsset1Id,
          assetName: 'Primary Transaction Switch',
          criticalityTier: 1 as const,
          isInternetFacing: true,
          hourlyDowntimeCost: 15000,
          recoveryCost: 60000,
          currency: 'USD',
        },
        vulnerability: {
          cveId: testCveId1,
          cvssScore: 10.0,
          availabilityImpact: 'HIGH' as const,
          scope: 'CHANGED' as const,
          isKnownExploited: true,
          knownRansomwareCampaignUse: 'Known',
        },
      };

      const clientSpy = jest.spyOn(financialEngineClient, 'evaluateFinancialExposure');

      const res = await request(app)
        .post('/api/financial/evaluate')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.isCached).toBe(true);
      expect(res.body.eal).toBe(420000);
      expect(res.body.isEstimated).toBe(true);
      expect(clientSpy).not.toHaveBeenCalled();

      clientSpy.mockRestore();
    });

    it('should invalidate cache and recompute when financial parameters change', async () => {
      const modifiedPayload = {
        asset: {
          assetId: testAsset1Id,
          assetName: 'Primary Transaction Switch',
          criticalityTier: 1 as const,
          isInternetFacing: true,
          hourlyDowntimeCost: 20000, // Modified hourly rate
          recoveryCost: 80000, // Modified recovery cost
          currency: 'USD',
        },
        vulnerability: {
          cveId: testCveId1,
          cvssScore: 10.0,
          availabilityImpact: 'HIGH' as const,
          scope: 'CHANGED' as const,
          isKnownExploited: true,
          knownRansomwareCampaignUse: 'Known',
        },
      };

      const mockRecomputed: FinancialExposureResultDTO = {
        assetId: testAsset1Id,
        assetName: 'Primary Transaction Switch',
        cveId: testCveId1,
        sle: 560000,
        alef: 1.0,
        eal: 560000,
        ealStatus: 'CALCULATED',
        currency: 'USD',
        primaryLoss: 480000,
        secondaryLoss: 80000,
        estimatedOutageHours: 24,
        hourlyDowntimeRate: 20000,
        recoveryCost: 80000,
        factors: [],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        modelVersion: '1.0.0',
        provenanceHash: computeFinancialProvenanceHash(modifiedPayload),
        isEstimated: true,
        evaluatedAt: new Date().toISOString(),
      };

      const clientSpy = jest
        .spyOn(financialEngineClient, 'evaluateFinancialExposure')
        .mockResolvedValueOnce(mockRecomputed);

      const res = await request(app)
        .post('/api/financial/evaluate')
        .send(modifiedPayload);

      expect(res.status).toBe(200);
      expect(res.body.isCached).toBe(false);
      expect(res.body.eal).toBe(560000);
      expect(clientSpy).toHaveBeenCalledTimes(1);

      // Verify database updated with new EAL
      const dbRes = await query(
        'SELECT * FROM financial_results WHERE asset_id = $1 AND cve_id = $2',
        [testAsset1Id, testCveId1]
      );
      expect(parseFloat(dbRes.rows[0].eal)).toBe(560000);

      clientSpy.mockRestore();
    });

    it('should propagate 503 SERVICE_UNAVAILABLE when Python microservice is offline', async () => {
      const payload = {
        asset: {
          assetId: testAsset2Id,
          assetName: 'Analytics Worker Node',
          criticalityTier: 3 as const,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: testCveId2,
          cvssScore: 9.8,
          isKnownExploited: true,
        },
      };

      const clientSpy = jest
        .spyOn(financialEngineClient, 'evaluateFinancialExposure')
        .mockRejectedValueOnce(
          new FinancialEngineServiceError(
            'Financial Exposure Engine is unavailable',
            503,
            'FINANCIAL_ENGINE_UNAVAILABLE'
          )
        );

      const res = await request(app)
        .post('/api/financial/evaluate')
        .send(payload);

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
      expect(res.body.code).toBe('FINANCIAL_ENGINE_UNAVAILABLE');

      clientSpy.mockRestore();
    });

    it('should reject invalid payloads with 400 Validation Error', async () => {
      const invalidPayload = {
        asset: {
          assetId: '', // Invalid empty asset ID
          criticalityTier: 99, // Invalid tier
        },
        vulnerability: {},
      };

      const res = await request(app)
        .post('/api/financial/evaluate')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details).toBeDefined();
    });
  });

  describe('POST /api/financial/evaluate/batch (Batch Evaluation)', () => {
    it('should evaluate a batch of asset-vulnerability financial pairs', async () => {
      const batchPayload = {
        evaluations: [
          {
            asset: {
              assetId: testAsset2Id,
              assetName: 'Analytics Worker Node',
              criticalityTier: 3 as const,
              isInternetFacing: false,
            },
            vulnerability: {
              cveId: testCveId2,
              cvssScore: 9.8,
              isKnownExploited: true,
            },
          },
        ],
      };

      const mockBatchResult: BatchFinancialExposureResultDTO = {
        results: [
          {
            assetId: testAsset2Id,
            assetName: 'Analytics Worker Node',
            cveId: testCveId2,
            sle: 25000,
            alef: 0.8,
            eal: 20000,
            ealStatus: 'CALCULATED',
            currency: 'USD',
            primaryLoss: 15000,
            secondaryLoss: 10000,
            estimatedOutageHours: 6,
            hourlyDowntimeRate: 2500,
            recoveryCost: 10000,
            factors: [],
            missingDataWarnings: [],
            dataCompletenessScore: 0.9,
            modelVersion: '1.0.0',
            provenanceHash: 'mock-batch-hash-2',
            isEstimated: true,
            evaluatedAt: new Date().toISOString(),
          },
        ],
        totalEvaluated: 1,
        totalModeledEal: 20000,
        currency: 'USD',
        modelVersion: '1.0.0',
      };

      const clientSpy = jest
        .spyOn(financialEngineClient, 'evaluateFinancialBatch')
        .mockResolvedValueOnce(mockBatchResult);

      const res = await request(app)
        .post('/api/financial/evaluate/batch')
        .send(batchPayload);

      expect(res.status).toBe(200);
      expect(res.body.totalEvaluated).toBe(1);
      expect(res.body.totalModeledEal).toBe(20000);
      expect(res.body.results[0].assetId).toBe(testAsset2Id);

      clientSpy.mockRestore();
    });
  });

  describe('GET /api/financial/exposure (Queries & Pagination)', () => {
    it('should retrieve paginated financial exposures with sorting and filtering', async () => {
      const res = await request(app)
        .get('/api/financial/exposure')
        .query({
          limit: 10,
          page: 1,
          sortBy: 'eal',
          sortOrder: 'desc',
        });

      expect(res.status).toBe(200);
      expect(res.body.results).toBeInstanceOf(Array);
      expect(res.body.results.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(1);
    });

    it('should filter financial exposures by assetId', async () => {
      const res = await request(app)
        .get('/api/financial/exposure')
        .query({ assetId: testAsset1Id });

      expect(res.status).toBe(200);
      expect(res.body.results.length).toBe(1);
      expect(res.body.results[0].assetId).toBe(testAsset1Id);
    });
  });

  describe('GET /api/financial/summary (Enterprise Loss Summary)', () => {
    it('should return aggregated enterprise financial metrics with isEstimated=true', async () => {
      const res = await request(app).get('/api/financial/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalModeledEal).toBeGreaterThanOrEqual(560000);
      expect(res.body.currency).toBe('USD');
      expect(res.body.isEstimated).toBe(true);
      expect(res.body.totalEvaluatedVulnerabilities).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/financial/assets/:assetId (Asset Profile)', () => {
    it('should return financial summary for a specific asset', async () => {
      const res = await request(app).get(`/api/financial/assets/${testAsset1Id}`);

      expect(res.status).toBe(200);
      expect(res.body.assetId).toBe(testAsset1Id);
      expect(res.body.totalModeledEal).toBeGreaterThanOrEqual(560000);
      expect(res.body.isEstimated).toBe(true);
      expect(res.body.topLossVulnerabilities).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent asset ID', async () => {
      const res = await request(app).get('/api/financial/assets/00000000-0000-0000-0000-000000000099');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Asset not found');
    });
  });
});
