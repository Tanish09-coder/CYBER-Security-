// =============================================================================
// CyberRiskOS — Executive Dashboard API Integration Test Suite
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-02)
// Tests:
// - GET /api/executive/posture
// - GET /api/executive/top-risks
// - GET /api/executive/financial-summary
// - Error handling & parameter validation
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createExecutiveRouter } from '../executive.routes';
import { executiveRepository } from '../executive.repository';
import {
  ExecutivePostureDTO,
  ExecutiveTopRiskDTO,
  ExecutiveFinancialSummaryDTO,
} from '../executive.types';

let app: express.Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/executive', createExecutiveRouter());
  app.use('/api/v1/executive', createExecutiveRouter());
});

describe('Executive Dashboard API Endpoints (/api/executive)', () => {
  describe('GET /api/executive/posture', () => {
    it('should return enterprise aggregated risk posture', async () => {
      const mockPosture: ExecutivePostureDTO = {
        overallRiskScore: 68.5,
        riskSeverity: 'MEDIUM',
        riskDistribution: {
          low: 30,
          medium: 50,
          high: 30,
          critical: 10,
        },
        totalAssetsEvaluated: 45,
        totalVulnerabilitiesEvaluated: 80,
        kevExposureCount: 8,
        ransomwareAssociatedCount: 3,
        internetFacingAssetCount: 12,
        businessUnitRollups: [
          {
            businessUnitId: 'bu-1',
            businessUnitName: 'Core Banking',
            avgRiskScore: 78.4,
            totalAssets: 20,
            criticalFlawsCount: 6,
          },
        ],
        dataFreshnessTimestamp: new Date().toISOString(),
        modelVersion: '1.0.0',
      };

      const spy = jest
        .spyOn(executiveRepository, 'getExecutivePosture')
        .mockResolvedValueOnce(mockPosture);

      const res = await request(app).get('/api/executive/posture');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallRiskScore).toBe(68.5);
      expect(res.body.data.riskDistribution.critical).toBe(10);
      expect(res.body.data.kevExposureCount).toBe(8);

      spy.mockRestore();
    });

    it('should pass organizationId parameter to repository', async () => {
      const spy = jest
        .spyOn(executiveRepository, 'getExecutivePosture')
        .mockResolvedValueOnce({
          overallRiskScore: 40.0,
          riskSeverity: 'MEDIUM',
          riskDistribution: { low: 5, medium: 5, high: 0, critical: 0 },
          totalAssetsEvaluated: 5,
          totalVulnerabilitiesEvaluated: 5,
          kevExposureCount: 0,
          ransomwareAssociatedCount: 0,
          internetFacingAssetCount: 1,
          businessUnitRollups: [],
          dataFreshnessTimestamp: new Date().toISOString(),
          modelVersion: '1.0.0',
        });

      const res = await request(app)
        .get('/api/executive/posture')
        .query({ organizationId: 'org-test-123' });

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith('org-test-123');

      spy.mockRestore();
    });

    it('should return 500 when repository throws an error', async () => {
      const spy = jest
        .spyOn(executiveRepository, 'getExecutivePosture')
        .mockRejectedValueOnce(new Error('Database query failure'));

      const res = await request(app).get('/api/executive/posture');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Executive Posture Failed');
      expect(res.body.message).toBe('Database query failure');

      spy.mockRestore();
    });
  });

  describe('GET /api/executive/top-risks', () => {
    it('should return top critical risks with default limit of 5', async () => {
      const mockTopRisks: ExecutiveTopRiskDTO[] = [
        {
          rank: 1,
          assetId: 'asset-1',
          assetName: 'Payment Switch Alpha',
          criticalityTier: 1,
          isInternetFacing: true,
          cveId: 'CVE-2021-44228',
          cvssScore: 10.0,
          isKnownExploited: true,
          ransomwareCampaignUse: 'Known',
          riskScore: 98.5,
          severity: 'CRITICAL',
          eal: 150000.0,
          currency: 'USD',
        },
      ];

      const spy = jest
        .spyOn(executiveRepository, 'getTopRisks')
        .mockResolvedValueOnce(mockTopRisks);

      const res = await request(app).get('/api/executive/top-risks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].cveId).toBe('CVE-2021-44228');
      expect(spy).toHaveBeenCalledWith(5, undefined);

      spy.mockRestore();
    });

    it('should clamp limit between 1 and 20', async () => {
      const spy = jest
        .spyOn(executiveRepository, 'getTopRisks')
        .mockResolvedValueOnce([]);

      await request(app).get('/api/executive/top-risks').query({ limit: 50 });

      // Service clamps Math.min(20, limit)
      expect(spy).toHaveBeenCalledWith(20, undefined);

      spy.mockRestore();
    });
  });

  describe('GET /api/executive/financial-summary', () => {
    it('should return modeled financial exposure summary', async () => {
      const mockSummary: ExecutiveFinancialSummaryDTO = {
        totalModeledEal: 420000.0,
        availableEalCount: 15,
        currency: 'USD',
        totalPrimaryLoss: 300000.0,
        totalSecondaryLoss: 120000.0,
        averageOutageHours: 4.5,
        highestLossAsset: {
          assetId: 'asset-1',
          assetName: 'Core DB',
          eal: 200000.0,
        },
        topLossDrivers: [
          {
            assetId: 'asset-1',
            assetName: 'Core DB',
            cveId: 'CVE-2021-44228',
            eal: 200000.0,
          },
        ],
        isEstimated: true,
      };

      const spy = jest
        .spyOn(executiveRepository, 'getFinancialSummary')
        .mockResolvedValueOnce(mockSummary);

      const res = await request(app).get('/api/executive/financial-summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalModeledEal).toBe(420000.0);
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.isEstimated).toBe(true);

      spy.mockRestore();
    });

    it('should return 500 when financial summary fails', async () => {
      const spy = jest
        .spyOn(executiveRepository, 'getFinancialSummary')
        .mockRejectedValueOnce(new Error('Connection lost'));

      const res = await request(app).get('/api/executive/financial-summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Executive Financial Summary Failed');

      spy.mockRestore();
    });
  });
});
