// =============================================================================
// CyberRiskOS — AI Explanation Assistant Service Unit Tests
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
//
// TEST COVERAGE:
//   - Prompt grounding assertions (exact values injected into AI prompt)
//   - PromptSanitizer PII / secret redaction
//   - Authoritative resolution via database repositories
//   - Template explanation grounding (deterministic, no AI needed)
//   - Anti-hallucination validation (wrong values → GROUNDING_FAILED)
//   - AI provider timeout handling (PROVIDER_ERROR + template fallback)
// =============================================================================

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { validateGrounding, AssistantService } from '../assistant.service';
import { PromptSanitizer } from '../assistant.sanitizer';
import {
  buildRiskExplanationPrompt,
  buildFinancialExplanationPrompt,
  buildStrategyComparisonPrompt,
} from '../assistant.prompt-builder';
import {
  ResolvedRiskContext,
  ResolvedFinancialContext,
  ResolvedStrategyComparisonContext,
  GroundingAnchor,
  StructuredClaimDTO,
} from '../assistant.types';
import { riskRepository } from '../../risk/risk.repository';
import { financialRepository } from '../../financial/financial.repository';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('axios');
jest.mock('../../risk/risk.repository');
jest.mock('../../financial/financial.repository');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockRiskRepo = riskRepository as jest.Mocked<typeof riskRepository>;
const mockFinancialRepo = financialRepository as jest.Mocked<typeof financialRepository>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockRiskContext: ResolvedRiskContext = {
  riskResultId: 'rr-100',
  assetId: 'asset-prod-001',
  assetName: 'Production API Gateway',
  cveId: 'CVE-2021-44228',
  riskScore: 82.5,
  severity: 'HIGH',
  factors: [
    { factorName: 'Technical CVSS Severity', contribution: 100.0, description: 'CVSS 10.0 × 10.0 scalar' },
  ],
  dataCompleteness: 0.95,
  missingDataWarnings: [],
  modelVersion: '1.0.0',
  evaluatedAt: new Date().toISOString(),
};

const mockFinancialContext: ResolvedFinancialContext = {
  financialResultId: 'fr-100',
  assetId: 'asset-prod-001',
  assetName: 'Production API Gateway',
  cveId: 'CVE-2021-44228',
  sle: 250000.0,
  alef: 0.15,
  eal: 37500.0,
  ealStatus: 'CALCULATED',
  currency: 'USD',
  primaryLoss: 200000.0,
  secondaryLoss: 50000.0,
  estimatedOutageHours: 40.0,
  dataCompleteness: 1.0,
  modelVersion: '1.0.0',
};

const mockStrategyContext: ResolvedStrategyComparisonContext = {
  optimizationResultId: 'opt-100',
  strategyA: {
    strategyId: 'STRATEGY_A',
    strategyName: 'Maximum Risk & Loss Reduction',
    totalCost: 45000.0,
    totalRiskReduction: 35.5,
    totalEalReduction: 280000.0,
    ealStatus: 'CALCULATED',
    rosiPct: 522.22,
    actionCount: 3,
    description: 'Aggressively maximizes EAL savings.',
  },
  strategyB: {
    strategyId: 'STRATEGY_B',
    strategyName: 'Balanced Capital Efficiency',
    totalCost: 20000.0,
    totalRiskReduction: 22.0,
    totalEalReduction: 210000.0,
    ealStatus: 'CALCULATED',
    rosiPct: 950.0,
    actionCount: 2,
    description: 'Maximizes ROSI per dollar spent.',
  },
  budgetLimit: 50000.0,
  currency: 'USD',
};

// ---------------------------------------------------------------------------
// 1. Prompt Sanitizer Tests
// ---------------------------------------------------------------------------

describe('PromptSanitizer', () => {
  it('should redact DB connection strings, bearer tokens, and internal IPs', () => {
    const raw = 'Conn: postgresql://admin:secret@db.internal:5432/db with token Bearer sk-1234567890abcdef12345 on node 10.0.0.5';
    const clean = PromptSanitizer.sanitize(raw);
    expect(clean).toContain('[REDACTED_DB_CONNECTION_STRING]');
    expect(clean).toContain('[REDACTED_SECRET_KEY]');
    expect(clean).toContain('[REDACTED_INTERNAL_IP]');
    expect(clean).not.toContain('postgresql://');
    expect(clean).not.toContain('10.0.0.5');
  });

  it('should mask email addresses and phone numbers', () => {
    const raw = 'Contact user@example.com or call 555-123-4567 for help.';
    const clean = PromptSanitizer.sanitize(raw);
    expect(clean).toContain('[REDACTED_EMAIL]');
    expect(clean).toContain('[REDACTED_PHONE]');
    expect(clean).not.toContain('user@example.com');
  });
});

// ---------------------------------------------------------------------------
// 2. Prompt Grounding Assertions
// ---------------------------------------------------------------------------

describe('PromptBuilder — Risk Explanation Prompt Grounding', () => {
  it('should inject exact risk score into prompt', () => {
    const built = buildRiskExplanationPrompt(mockRiskContext);
    expect(built.aiPrompt).toContain('82.50');
    expect(built.aiPrompt).toContain('CVE-2021-44228');
    expect(built.aiPrompt).toContain('HIGH');
  });

  it('should include grounding anchor for risk score', () => {
    const built = buildRiskExplanationPrompt(mockRiskContext);
    const anchor = built.groundingAnchors.find((a) => a.field === 'riskScore');
    expect(anchor).toBeDefined();
    expect(anchor!.expectedValue).toBe(82.5);
  });
});

describe('PromptBuilder — Financial Explanation Prompt Grounding', () => {
  it('should inject SLE, ALEF, and EAL values into prompt', () => {
    const built = buildFinancialExplanationPrompt(mockFinancialContext);
    expect(built.aiPrompt).toContain('250000.00');
    expect(built.aiPrompt).toContain('0.1500');
    expect(built.aiPrompt).toContain('37500.00');
  });
});

// ---------------------------------------------------------------------------
// 3. Authoritative Backend Resolution Tests
// ---------------------------------------------------------------------------

describe('AssistantService — Authoritative Backend Resolution', () => {
  let service: AssistantService;

  beforeEach(() => {
    service = new AssistantService();
    jest.clearAllMocks();
  });

  it('should resolve risk record by ID from repository', async () => {
    mockRiskRepo.findById.mockResolvedValue({
      id: 'rr-100',
      assetId: 'asset-1',
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

    const res = await service.explainRisk({ riskResultId: 'rr-100' });
    expect(mockRiskRepo.findById).toHaveBeenCalledWith('rr-100');
    expect(res.explanationStatus).toBe('TEMPLATE_GENERATED');
    expect(res.explanation).toContain('82.50');
  });

  it('should throw 404 when risk result is not found in database', async () => {
    mockRiskRepo.findById.mockResolvedValue(null);
    await expect(service.explainRisk({ riskResultId: 'rr-missing' })).rejects.toThrow(
      'Authoritative risk result record not found'
    );
  });

  it('should resolve financial record by asset and CVE from repository', async () => {
    mockFinancialRepo.findByAssetAndCve.mockResolvedValue({
      id: 'fr-100',
      assetId: 'asset-1',
      cveId: 'CVE-2021-44228',
      sle: 250000.0,
      alef: 0.15,
      eal: 37500.0,
      ealStatus: 'CALCULATED',
      currency: 'USD',
      modelVersion: '1.0.0',
    } as any);

    const res = await service.explainFinancial({ assetId: 'asset-1', cveId: 'CVE-2021-44228' });
    expect(mockFinancialRepo.findByAssetAndCve).toHaveBeenCalledWith('asset-1', 'CVE-2021-44228');
    expect(res.explanation).toContain('37500');
  });
});

// ---------------------------------------------------------------------------
// 4. Grounding & Anti-Hallucination Tests
// ---------------------------------------------------------------------------

describe('validateGrounding', () => {
  it('should PASS when anchor value is present in text', () => {
    const text = 'The risk score is 82.50.';
    const result = validateGrounding(text, [{ field: 'riskScore', expectedValue: 82.5 }]);
    expect(result.passed).toBe(true);
  });

  it('should FAIL when anchor value is missing (detecting hallucination)', () => {
    const text = 'The risk score is 99.99.';
    const result = validateGrounding(text, [{ field: 'riskScore', expectedValue: 42.5 }]);
    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Provider Timeout & Anti-Hallucination Fallback Tests
// ---------------------------------------------------------------------------

describe('AssistantService — Provider Timeout & Error Fallback', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    process.env.AI_EXPLANATION_PROVIDER = 'OPENAI';
    process.env.OPENAI_API_KEY = 'test-mock-key';
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = origEnv;
  });

  it('should fall back to safe template and return PROVIDER_ERROR on timeout', async () => {
    mockRiskRepo.findById.mockResolvedValue({
      id: 'rr-100',
      assetId: 'asset-1',
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

    mockAxios.post.mockRejectedValueOnce({
      code: 'ECONNABORTED',
      message: 'timeout of 8000ms exceeded',
    });

    const service = new AssistantService();
    const res = await service.explainRisk({ riskResultId: 'rr-100' });

    expect(res.explanationStatus).toBe('PROVIDER_ERROR');
    expect(res.explanation).toContain('82.50');
    expect(res.warnings[0]).toContain('timed out');
  });

  it('should detect AI hallucination and return GROUNDING_FAILED with safe template', async () => {
    mockRiskRepo.findById.mockResolvedValue({
      id: 'rr-100',
      assetId: 'asset-1',
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

    mockAxios.post.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: 'The hallucinated risk score for this asset is 12.34 out of 100.',
            },
          },
        ],
      },
    });

    const service = new AssistantService();
    const res = await service.explainRisk({ riskResultId: 'rr-100' });

    expect(res.explanationStatus).toBe('GROUNDING_FAILED');
    expect(res.groundingValidation.passed).toBe(false);
    expect(res.warnings[0]).toContain('grounding validation FAILED');
    expect(res.explanation).toContain('82.50');
  });
});

// ---------------------------------------------------------------------------
// 6. Shared Golden Test Vectors (TypeScript)
// ---------------------------------------------------------------------------

describe('Shared Golden Test Vectors (TypeScript)', () => {
  it('should satisfy all shared golden test vectors', () => {
    const jsonPath = path.resolve(__dirname, '../../../../../data/grounding_golden_vectors.json');
    const vectors = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    for (const vector of vectors) {
      const ctx = vector.authoritativeContext || {};
      const text = vector.candidateText || '';
      const expectedPassed = vector.expectedPassed ?? true;

      const anchors: GroundingAnchor[] = [];
      const structuredClaims: StructuredClaimDTO[] = [];

      if ('riskScore' in ctx) {
        anchors.push({ field: 'riskScore', expectedValue: ctx.riskScore, tolerancePct: 1.0 });
      }
      if ('sle' in ctx && ctx.sle !== null) {
        anchors.push({ field: 'sle', expectedValue: ctx.sle, tolerancePct: 1.0 });
      }
      if ('alef' in ctx && ctx.alef !== null) {
        anchors.push({ field: 'alef', expectedValue: ctx.alef, tolerancePct: 5.0 });
      }
      if ('eal' in ctx && ctx.eal !== null) {
        anchors.push({ field: 'eal', expectedValue: ctx.eal, tolerancePct: 1.0 });
      }
      if ('ealStatus' in ctx && ctx.ealStatus === 'NOT_AVAILABLE') {
        structuredClaims.push({ sourceField: 'ealStatus', claimedValue: 'NOT AVAILABLE', expectedValue: 'NOT AVAILABLE', isVerified: false });
      }
      if ('strategyACost' in ctx) {
        anchors.push({ field: 'strategyACost', expectedValue: ctx.strategyACost, tolerancePct: 1.0 });
      }
      if ('strategyBCost' in ctx) {
        anchors.push({ field: 'strategyBCost', expectedValue: ctx.strategyBCost, tolerancePct: 1.0 });
      }

      const res = validateGrounding(text, anchors, structuredClaims);
      expect(res.passed).toBe(expectedPassed);
    }
  });
});
