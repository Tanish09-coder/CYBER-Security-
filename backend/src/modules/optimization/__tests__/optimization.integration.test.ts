// =============================================================================
// CyberRiskOS — Investment Optimization API Integration Test Suite
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// Tests:
// - POST /api/optimization/solve (Multi-Strategy Solve)
// - GET /api/optimization/strategies (Strategy Definitions)
// - POST /api/optimization/compare (Side-by-side Trade-Off Comparison)
// - 503 / 504 Microservice Error Propagation
// - 400 Validation Error Handling
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createOptimizationRouter } from '../optimization.routes';
import {
  optimizationEngineClient,
  OptimizationEngineServiceError,
} from '../optimization.client';
import { OptimizationResultDTO } from '../optimization.types';

let app: express.Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/optimization', createOptimizationRouter());
  app.use('/api/v1/optimization', createOptimizationRouter());
});

describe('Investment Optimization API Endpoints (/api/optimization)', () => {
  describe('POST /api/optimization/solve', () => {
    it('should solve multi-strategy optimization candidates within budget', async () => {
      const mockResult: OptimizationResultDTO = {
        budgetLimit: 50000.0,
        currency: 'USD',
        totalCandidates: 3,
        evaluatedAt: new Date().toISOString(),
        modelVersion: '1.0.0',
        strategies: [
          {
            strategyId: 'STRATEGY_A_MAX_REDUCTION',
            strategyName: 'Maximum Risk & Loss Reduction',
            strategyType: 'MAX_REDUCTION',
            description: 'Maximizes absolute risk reduction',
            selectedActions: [
              {
                actionId: 'act-1',
                actionType: 'PATCH_VULNERABILITY',
                targetAssetId: 'asset-1',
                targetCveId: 'CVE-2021-44228',
                cost: 25000.0,
                estimatedRiskReduction: 25.0,
                estimatedEalReduction: 200000.0,
                title: 'Patch Log4Shell',
              },
            ],
            totalCost: 25000.0,
            remainingBudget: 25000.0,
            totalRiskReduction: 25.0,
            totalEalReduction: 200000.0,
            netFinancialBenefit: 175000.0,
            rosiPct: 700.0,
            rosiRatio: 7.0,
            actionCount: 1,
          },
          {
            strategyId: 'STRATEGY_B_BALANCED_ROSI',
            strategyName: 'Balanced Capital Efficiency',
            strategyType: 'BALANCED_ROSI',
            description: 'Maximizes ROSI per dollar spent',
            selectedActions: [],
            totalCost: 10000.0,
            remainingBudget: 40000.0,
            totalRiskReduction: 15.0,
            totalEalReduction: 120000.0,
            netFinancialBenefit: 110000.0,
            rosiPct: 1100.0,
            rosiRatio: 11.0,
            actionCount: 1,
          },
          {
            strategyId: 'STRATEGY_C_QUICK_WINS',
            strategyName: 'Quick Wins',
            strategyType: 'QUICK_WINS',
            description: 'Low-cost rapid mitigations',
            selectedActions: [],
            totalCost: 5000.0,
            remainingBudget: 45000.0,
            totalRiskReduction: 8.0,
            totalEalReduction: 50000.0,
            netFinancialBenefit: 45000.0,
            rosiPct: 900.0,
            rosiRatio: 9.0,
            actionCount: 1,
          },
        ],
      };

      const clientSpy = jest
        .spyOn(optimizationEngineClient, 'solveOptimization')
        .mockResolvedValueOnce(mockResult);

      const payload = {
        budgetLimit: 50000.0,
        currency: 'USD',
        candidateActions: [
          {
            actionId: 'act-1',
            actionType: 'PATCH_VULNERABILITY',
            targetAssetId: 'asset-1',
            cost: 25000.0,
            estimatedRiskReduction: 25.0,
            estimatedEalReduction: 200000.0,
            title: 'Patch Log4Shell',
          },
        ],
      };

      const res = await request(app).post('/api/optimization/solve').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.strategies.length).toBe(3);
      expect(res.body.data.budgetLimit).toBe(50000.0);

      clientSpy.mockRestore();
    });

    it('should propagate 503 SERVICE_UNAVAILABLE when Python engine is offline', async () => {
      const clientSpy = jest
        .spyOn(optimizationEngineClient, 'solveOptimization')
        .mockRejectedValueOnce(
          new OptimizationEngineServiceError(
            'Optimization Engine is offline',
            503,
            'OPTIMIZATION_ENGINE_UNAVAILABLE'
          )
        );

      const res = await request(app)
        .post('/api/optimization/solve')
        .send({
          budgetLimit: 10000.0,
          candidateActions: [
            {
              actionId: 'act-1',
              actionType: 'PATCH_VULNERABILITY',
              targetAssetId: 'asset-1',
              cost: 5000.0,
              title: 'Patch Flaw',
            },
          ],
        });

      expect(res.status).toBe(503);
      expect(res.body.code).toBe('OPTIMIZATION_ENGINE_UNAVAILABLE');

      clientSpy.mockRestore();
    });

    it('should reject negative budget with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/optimization/solve')
        .send({
          budgetLimit: -500.0,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/optimization/strategies', () => {
    it('should return metadata and descriptions of canonical strategies', async () => {
      const res = await request(app).get('/api/optimization/strategies');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);

      const ids = res.body.data.map((s: any) => s.id);
      expect(ids).toContain('STRATEGY_A_MAX_REDUCTION');
      expect(ids).toContain('STRATEGY_B_BALANCED_ROSI');
      expect(ids).toContain('STRATEGY_C_QUICK_WINS');
    });
  });

  describe('POST /api/optimization/compare', () => {
    it('should compare two strategies side-by-side with trade-off analysis', async () => {
      const payload = {
        budgetLimit: 50000.0,
        strategyA: {
          strategyId: 'STRATEGY_A_MAX_REDUCTION',
          strategyName: 'Maximum Reduction',
          totalCost: 45000.0,
          totalEalReduction: 300000.0,
          rosiPct: 566.67,
        },
        strategyB: {
          strategyId: 'STRATEGY_B_BALANCED_ROSI',
          strategyName: 'Balanced ROSI',
          totalCost: 20000.0,
          totalEalReduction: 220000.0,
          rosiPct: 1000.0,
        },
      };

      const res = await request(app).post('/api/optimization/compare').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.costDelta).toBe(25000.0);
      expect(res.body.data.ealReductionDelta).toBe(80000.0);
      expect(res.body.data.tradeOffSummary).toContain('Maximum Reduction achieves');
    });
  });
});
