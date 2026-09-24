// =============================================================================
// CyberRiskOS — Attack Path & Blast Radius API Integration Test Suite
// Phase: Phase 7B — Attack Path Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/ATTACK_PATH_MODEL.md
// Tests:
// - GET /api/attack-paths (Topological Attack Graph)
// - POST /api/attack-paths/analyze (Custom Graph Analysis)
// - GET /api/attack-paths/choke-points (Ranked Structural Choke Points)
// - GET /api/attack-paths/asset/:id (Asset Blast Radius & Inbound Vectors)
// - 503 / 504 Upstream Engine Error Propagation
// - 400 Validation Error Handling
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createAttackPathsRouter } from '../attack-paths.routes';
import {
  attackPathEngineClient,
  AttackPathEngineServiceError,
} from '../attack-paths.client';
import { AttackGraphAnalysisResultDTO } from '../attack-paths.types';
import * as dbModule from '../../../db';

let app: express.Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/attack-paths', createAttackPathsRouter());
  app.use('/api/v1/attack-paths', createAttackPathsRouter());
});

describe('Attack Path & Blast Radius API Endpoints (/api/attack-paths)', () => {
  const mockAnalysisResult: AttackGraphAnalysisResultDTO = {
    totalNodes: 4,
    totalEdges: 3,
    totalPathsFound: 2,
    maxPathRisk: 94.0,
    discoveredPaths: [
      {
        pathId: 'path-1',
        nodeIds: ['asset-web', 'asset-app', 'asset-db'],
        edgeIds: ['edge-1', 'edge-2'],
        hopCount: 2,
        cumulativeRiskScore: 94.0,
        entryAssetId: 'asset-web',
        targetAssetId: 'asset-db',
        criticalCves: ['CVE-2021-44228'],
      },
      {
        pathId: 'path-2',
        nodeIds: ['asset-bastion', 'asset-app', 'asset-db'],
        edgeIds: ['edge-3', 'edge-2'],
        hopCount: 2,
        cumulativeRiskScore: 85.0,
        entryAssetId: 'asset-bastion',
        targetAssetId: 'asset-db',
        criticalCves: [],
      },
    ],
    chokePoints: [
      {
        assetId: 'asset-app',
        assetName: 'Core Banking Application Server',
        interceptedPathsCount: 2,
        interceptedRiskScore: 179.0,
        chokePointScore: 1.0,
        remediationRecommendation: "Remediating or segmenting 'asset-app' severs 2 attack paths.",
      },
    ],
    entryPointsCount: 2,
    criticalTargetsCount: 1,
    evaluatedAt: new Date().toISOString(),
    modelVersion: '1.0.0',
  };

  const setupDefaultDbMock = () => {
    return jest.spyOn(dbModule, 'query').mockImplementation(async (sql: string) => {
      if (sql.includes('FROM assets')) {
        return {
          rows: [
            {
              id: 'asset-web',
              name: 'Web Server',
              ip_address: '198.51.100.1',
              business_criticality: 3,
              is_internet_facing: true,
            },
            {
              id: 'asset-db',
              name: 'DB Server',
              ip_address: '10.0.1.1',
              business_criticality: 1,
              is_internet_facing: false,
            },
          ],
        } as any;
      }
      return { rows: [] } as any;
    });
  };

  describe('GET /api/attack-paths', () => {
    it('should return topological attack graph and discovered paths', async () => {
      const dbSpy = setupDefaultDbMock();
      const clientSpy = jest
        .spyOn(attackPathEngineClient, 'analyzeGraph')
        .mockResolvedValueOnce(mockAnalysisResult);

      const res = await request(app).get('/api/attack-paths');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPathsFound).toBe(2);
      expect(res.body.data.maxPathRisk).toBe(94.0);
      expect(res.body.data.discoveredPaths.length).toBe(2);
      expect(res.body.data.chokePoints.length).toBe(1);

      dbSpy.mockRestore();
      clientSpy.mockRestore();
    });

    it('should propagate 503 GRAPH_ENGINE_UNAVAILABLE when Python engine is offline', async () => {
      const dbSpy = setupDefaultDbMock();
      const clientSpy = jest
        .spyOn(attackPathEngineClient, 'analyzeGraph')
        .mockRejectedValueOnce(
          new AttackPathEngineServiceError(
            'Attack Path Graph Engine is unavailable',
            503,
            'GRAPH_ENGINE_UNAVAILABLE'
          )
        );

      const res = await request(app).get('/api/attack-paths');

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('GRAPH_ENGINE_UNAVAILABLE');

      dbSpy.mockRestore();
      clientSpy.mockRestore();
    });
  });

  describe('POST /api/attack-paths/analyze (Custom Graph)', () => {
    it('should analyze ad-hoc graph topology successfully', async () => {
      const clientSpy = jest
        .spyOn(attackPathEngineClient, 'analyzeGraph')
        .mockResolvedValueOnce(mockAnalysisResult);

      const customPayload = {
        nodes: [
          { assetId: 'n1', name: 'Entry', criticalityTier: 3, isInternetFacing: true },
          { assetId: 'n2', name: 'Target', criticalityTier: 1, isInternetFacing: false },
        ],
        edges: [
          {
            edgeId: 'e1',
            sourceAssetId: 'n1',
            targetAssetId: 'n2',
            edgeType: 'NETWORK_EXPOSURE',
            riskWeight: 75.0,
          },
        ],
      };

      const res = await request(app).post('/api/attack-paths/analyze').send(customPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalNodes).toBe(4);

      clientSpy.mockRestore();
    });

    it('should reject invalid payload without nodes with HTTP 400', async () => {
      const res = await request(app).post('/api/attack-paths/analyze').send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/attack-paths/choke-points', () => {
    it('should return ranked choke points respecting limit', async () => {
      const dbSpy = setupDefaultDbMock();
      const clientSpy = jest
        .spyOn(attackPathEngineClient, 'analyzeGraph')
        .mockResolvedValueOnce(mockAnalysisResult);

      const res = await request(app).get('/api/attack-paths/choke-points').query({ limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].assetId).toBe('asset-app');
      expect(res.body.data[0].chokePointScore).toBe(1.0);

      dbSpy.mockRestore();
      clientSpy.mockRestore();
    });
  });

  describe('GET /api/attack-paths/asset/:id', () => {
    it('should return blast radius and inbound paths for an asset', async () => {
      const dbSpy = jest.spyOn(dbModule, 'query').mockImplementation(async (sql: string) => {
        if (sql.includes('SELECT id, name, business_criticality')) {
          return {
            rows: [
              {
                id: 'asset-app',
                name: 'Core Banking Application Server',
                business_criticality: 2,
                is_internet_facing: false,
              },
            ],
          } as any;
        }
        return {
          rows: [
            { id: 'asset-web', name: 'Web', business_criticality: 3, is_internet_facing: true },
            { id: 'asset-app', name: 'App', business_criticality: 2, is_internet_facing: false },
            { id: 'asset-db', name: 'DB', business_criticality: 1, is_internet_facing: false },
          ],
        } as any;
      });

      const clientSpy = jest
        .spyOn(attackPathEngineClient, 'analyzeGraph')
        .mockResolvedValueOnce(mockAnalysisResult);

      const res = await request(app).get('/api/attack-paths/asset/asset-app');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assetId).toBe('asset-app');
      expect(res.body.data.upstreamInboundPaths.length).toBe(2);
      expect(res.body.data.downstreamOutboundPaths.length).toBe(2);
      expect(res.body.data.isChokePoint).toBe(true);
      expect(res.body.data.compromiseRiskScore).toBe(94.0);

      dbSpy.mockRestore();
      clientSpy.mockRestore();
    });

    it('should return 404 when asset does not exist', async () => {
      const dbSpy = jest.spyOn(dbModule, 'query').mockImplementation(async () => {
        return { rows: [] } as any;
      });

      const res = await request(app).get('/api/attack-paths/asset/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Asset Not Found');

      dbSpy.mockRestore();
    });
  });
});
