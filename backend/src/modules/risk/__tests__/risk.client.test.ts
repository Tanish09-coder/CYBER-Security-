// =============================================================================
// CyberRiskOS — Risk Engine Client Unit Tests
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Tests:
// - Successful single evaluation
// - Successful batch evaluation
// - Python service unavailable (structured 503)
// - Timeout handling (structured 504)
// - Upstream error handling (400, 502)
// - No secret leakage in error logs or details
// - Deterministic canonical JSON and SHA-256 provenance hashing
// - Changed provenance hash on modified input
// =============================================================================

import axios from 'axios';
import {
  RiskEngineClient,
  RiskEngineServiceError,
  computeProvenanceHash,
  canonicalJsonStringify,
} from '../risk.client';
import { RiskEvaluationInputDTO } from '../risk.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RiskEngineClient Unit Tests', () => {
  let client: RiskEngineClient;
  let mockAxiosInstance: any;

  const sampleInput: RiskEvaluationInputDTO = {
    asset: {
      assetId: '11111111-1111-1111-1111-111111111111',
      assetName: 'Core Banking Switch',
      criticalityTier: 1,
      isInternetFacing: true,
      controls: [{ controlCode: 'MFA', status: 'IMPLEMENTED' }],
    },
    vulnerability: {
      cveId: 'CVE-2021-44228',
      cvssScore: 10.0,
      cvssVersion: '3.1',
      isKnownExploited: true,
      knownRansomwareCampaignUse: 'Known',
    },
  };

  const sampleResult = {
    assetId: '11111111-1111-1111-1111-111111111111',
    assetName: 'Core Banking Switch',
    cveId: 'CVE-2021-44228',
    baseCvss: 10.0,
    riskScore: 100.0,
    severity: 'CRITICAL',
    factors: [],
    missingDataWarnings: [],
    dataCompletenessScore: 1.0,
    riskFlags: ['CISA_KEV_ACTIVE_EXPLOITATION'],
    modelVersion: '1.0.0',
    provenanceHash: 'a'.repeat(64),
    evaluatedAt: '2026-09-24T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new RiskEngineClient('http://localhost:8000', 3000);
  });

  describe('evaluateRisk (Single Evaluation)', () => {
    it('should successfully evaluate an atomic pair when Python service responds', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: sampleResult });

      const result = await client.evaluateRisk(sampleInput);

      expect(result).toEqual(sampleResult);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/risk/evaluate',
        sampleInput
      );
    });

    it('should throw structured 503 when Python Risk Engine is unavailable (connection refused)', async () => {
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:8000');
      mockAxiosInstance.post.mockRejectedValueOnce(networkError);

      await expect(client.evaluateRisk(sampleInput)).rejects.toThrow(RiskEngineServiceError);

      try {
        await client.evaluateRisk(sampleInput);
      } catch (err: any) {
        expect(err.statusCode).toBe(503);
        expect(err.code).toBe('RISK_ENGINE_UNAVAILABLE');
        expect(err.message).toContain('Python Risk Engine is unavailable');
        expect(err.details).toHaveProperty('baseUrl', 'http://localhost:8000');
      }
    });

    it('should throw structured 504 when Python Risk Engine times out', async () => {
      const timeoutError: any = new Error('timeout of 3000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockAxiosInstance.post.mockRejectedValueOnce(timeoutError);

      try {
        await client.evaluateRisk(sampleInput);
        fail('Expected evaluateRisk to throw');
      } catch (err: any) {
        expect(err).toBeInstanceOf(RiskEngineServiceError);
        expect(err.statusCode).toBe(504);
        expect(err.code).toBe('RISK_ENGINE_TIMEOUT');
        expect(err.message).toContain('timed out after 3000ms');
        expect(err.details).toHaveProperty('timeoutMs', 3000);
      }
    });

    it('should throw structured 400 when upstream rejects input with validation error', async () => {
      const badRequestError: any = new Error('Request failed with status code 422');
      badRequestError.response = {
        status: 422,
        data: { detail: 'Criticality tier must be between 1 and 5' },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(badRequestError);

      try {
        await client.evaluateRisk(sampleInput);
        fail('Expected evaluateRisk to throw');
      } catch (err: any) {
        expect(err).toBeInstanceOf(RiskEngineServiceError);
        expect(err.statusCode).toBe(422);
        expect(err.code).toBe('RISK_ENGINE_BAD_REQUEST');
        expect(err.message).toContain('Criticality tier must be between 1 and 5');
      }
    });

    it('should throw structured 502 when upstream encounters internal error', async () => {
      const serverError: any = new Error('Internal Server Error');
      serverError.response = {
        status: 500,
        data: { detail: 'Internal calculator division error' },
      };
      mockAxiosInstance.post.mockRejectedValueOnce(serverError);

      try {
        await client.evaluateRisk(sampleInput);
        fail('Expected evaluateRisk to throw');
      } catch (err: any) {
        expect(err).toBeInstanceOf(RiskEngineServiceError);
        expect(err.statusCode).toBe(502);
        expect(err.code).toBe('RISK_ENGINE_UPSTREAM_ERROR');
      }
    });

    it('should NOT leak secrets or credentials in thrown error details', async () => {
      const sensitiveError: any = new Error('connect ECONNREFUSED with token secret_bearer_token_xyz');
      mockAxiosInstance.post.mockRejectedValueOnce(sensitiveError);

      try {
        await client.evaluateRisk(sampleInput);
      } catch (err: any) {
        const errorJson = JSON.stringify(err.details);
        expect(errorJson).not.toContain('secret_bearer_token');
        expect(errorJson).not.toContain('password');
      }
    });
  });

  describe('evaluateRiskBatch (Batch Evaluation)', () => {
    it('should evaluate batch of atomic pairs via Python Risk Engine', async () => {
      const batchResult = {
        results: [sampleResult],
        totalEvaluated: 1,
        modelVersion: '1.0.0',
      };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: batchResult });

      const res = await client.evaluateRiskBatch({ evaluations: [sampleInput] });
      expect(res.totalEvaluated).toBe(1);
      expect(res.results).toHaveLength(1);
      expect(res.modelVersion).toBe('1.0.0');
    });

    it('should throw 503 if Python service is unavailable during batch', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Network unreachable'));

      await expect(
        client.evaluateRiskBatch({ evaluations: [sampleInput] })
      ).rejects.toThrow(RiskEngineServiceError);
    });
  });

  describe('Provenance Hashing & Canonical JSON Serialization', () => {
    it('should produce identical SHA-256 provenance hash for identical inputs regardless of key order', () => {
      const inputA: RiskEvaluationInputDTO = {
        asset: {
          assetId: 'asset-1',
          assetName: 'Server A',
          criticalityTier: 2,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: 'CVE-2021-44228',
          cvssScore: 7.5,
          isKnownExploited: true,
        },
      };

      // Same data with permuted key insertion order
      const inputB: RiskEvaluationInputDTO = {
        vulnerability: {
          isKnownExploited: true,
          cvssScore: 7.5,
          cveId: 'CVE-2021-44228',
        },
        asset: {
          isInternetFacing: false,
          criticalityTier: 2,
          assetName: 'Server A',
          assetId: 'asset-1',
        },
      };

      const hashA = computeProvenanceHash(inputA);
      const hashB = computeProvenanceHash(inputB);

      expect(hashA).toHaveLength(64);
      expect(hashB).toHaveLength(64);
      expect(hashA).toBe(hashB);
    });

    it('should produce a different provenance hash when any evaluation input changes', () => {
      const original: RiskEvaluationInputDTO = {
        asset: {
          assetId: 'asset-1',
          assetName: 'Server A',
          criticalityTier: 2,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: 'CVE-2021-44228',
          cvssScore: 7.5,
          isKnownExploited: true,
        },
      };

      // 1. Changed CVSS
      const modifiedCvss: RiskEvaluationInputDTO = {
        ...original,
        vulnerability: { ...original.vulnerability, cvssScore: 9.8 },
      };
      expect(computeProvenanceHash(modifiedCvss)).not.toBe(computeProvenanceHash(original));

      // 2. Changed KEV status
      const modifiedKev: RiskEvaluationInputDTO = {
        ...original,
        vulnerability: { ...original.vulnerability, isKnownExploited: false },
      };
      expect(computeProvenanceHash(modifiedKev)).not.toBe(computeProvenanceHash(original));

      // 3. Changed Criticality Tier
      const modifiedCrit: RiskEvaluationInputDTO = {
        ...original,
        asset: { ...original.asset, criticalityTier: 1 },
      };
      expect(computeProvenanceHash(modifiedCrit)).not.toBe(computeProvenanceHash(original));

      // 4. Changed Internet Exposure
      const modifiedExposure: RiskEvaluationInputDTO = {
        ...original,
        asset: { ...original.asset, isInternetFacing: true },
      };
      expect(computeProvenanceHash(modifiedExposure)).not.toBe(computeProvenanceHash(original));
    });
  });
});
