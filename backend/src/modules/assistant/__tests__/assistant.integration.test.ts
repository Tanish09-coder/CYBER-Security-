// =============================================================================
// CyberRiskOS — AI Explanation Assistant HTTP Integration Tests
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
//
// TESTS:
//   - POST /api/assistant/explain-risk (200 with ID resolution or 404 when missing)
//   - POST /api/assistant/explain-financial (200 with ID resolution or 404 when missing)
//   - POST /api/assistant/compare-strategies (200 + no-winner guarantee)
//   - 400 Validation Errors (missing mandatory IDs or invalid parameters)
// =============================================================================

import request from 'supertest';
import express from 'express';
import { createAssistantRouter } from '../assistant.routes';
import { riskRepository } from '../../risk/risk.repository';
import { financialRepository } from '../../financial/financial.repository';

jest.mock('../../risk/risk.repository');
jest.mock('../../financial/financial.repository');

const mockRiskRepo = riskRepository as jest.Mocked<typeof riskRepository>;
const mockFinancialRepo = financialRepository as jest.Mocked<typeof financialRepository>;

let app: express.Application;

beforeAll(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_EXPLANATION_PROVIDER;

  app = express();
  app.use(express.json());
  app.use('/api/assistant', createAssistantRouter());
  app.use('/api/v1/assistant', createAssistantRouter());
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/assistant/explain-risk', () => {
  it('should return 200 with TEMPLATE_GENERATED when riskResultId is resolved', async () => {
    mockRiskRepo.findById.mockResolvedValue({
      id: 'rr-100',
      assetId: 'asset-001',
      cveId: 'CVE-2021-44228',
      score: 82.5,
      level: 'HIGH',
      modelVersion: '1.0.0',
      factors: [],
      missingDataWarnings: [],
      dataCompleteness: 1.0,
      inputProvenanceHash: 'hash',
      evaluatedAt: new Date().toISOString(),
    } as any);

    const res = await request(app)
      .post('/api/assistant/explain-risk')
      .send({ riskResultId: 'rr-100' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requestType).toBe('EXPLAIN_RISK');
    expect(res.body.data.explanationStatus).toBe('TEMPLATE_GENERATED');
    expect(res.body.data.explanation).toContain('82.50');
  });

  it('should return 404 when riskResultId is not found', async () => {
    mockRiskRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/assistant/explain-risk')
      .send({ riskResultId: 'rr-missing' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Resource Not Found');
  });

  it('should return 400 when neither riskResultId nor (assetId+cveId) is provided', async () => {
    const res = await request(app)
      .post('/api/assistant/explain-risk')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });
});

describe('POST /api/assistant/explain-financial', () => {
  it('should return 200 when financialResultId is resolved', async () => {
    mockFinancialRepo.findById.mockResolvedValue({
      id: 'fr-100',
      assetId: 'asset-001',
      cveId: 'CVE-2021-44228',
      sle: 250000.0,
      alef: 0.15,
      eal: 37500.0,
      ealStatus: 'CALCULATED',
      currency: 'USD',
      modelVersion: '1.0.0',
    } as any);

    const res = await request(app)
      .post('/api/assistant/explain-financial')
      .send({ financialResultId: 'fr-100' });

    expect(res.status).toBe(200);
    expect(res.body.data.requestType).toBe('EXPLAIN_FINANCIAL');
    expect(res.body.data.explanation).toContain('37500');
  });

  it('should return 404 when financialResultId is not found', async () => {
    mockFinancialRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/assistant/explain-financial')
      .send({ financialResultId: 'fr-missing' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/assistant/compare-strategies', () => {
  it('should return 200 with grounded strategy comparison and no winner recommendation', async () => {
    const res = await request(app)
      .post('/api/assistant/compare-strategies')
      .send({ budgetLimit: 50000.0, currency: 'USD' });

    expect(res.status).toBe(200);
    expect(res.body.data.requestType).toBe('COMPARE_STRATEGIES');
    expect(res.body.data.explanation).toContain('does not recommend a single winner');
  });
});
