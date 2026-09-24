// =============================================================================
// CyberRiskOS — Risk Service Cache & Invalidation Unit Tests
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md (Section 7.1 Cache Staleness Protocol)
// Tests:
// - Identical input/model hash behavior (Cache Hit)
// - Changed provenance hash behavior (Cache Invalidation & Recalculation)
// - Model version upgrade behavior (Cache Invalidation)
// - Batch evaluation with mixed cache hits and misses
// =============================================================================

import { RiskService } from '../risk.service';
import { RiskEngineClient, computeProvenanceHash } from '../risk.client';
import { RiskRepository } from '../risk.repository';
import { RiskEvaluationInputDTO, RiskEvaluationResultDTO, StoredRiskResultRecord } from '../risk.types';

describe('RiskService Cache & Staleness Protocol', () => {
  let service: RiskService;
  let mockClient: jest.Mocked<RiskEngineClient>;
  let mockRepo: jest.Mocked<RiskRepository>;

  const sampleInput: RiskEvaluationInputDTO = {
    asset: {
      assetId: 'asset-111',
      assetName: 'Core Banking API Gateway',
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

  const expectedHash = computeProvenanceHash(sampleInput);

  const mockPythonResult: RiskEvaluationResultDTO = {
    assetId: 'asset-111',
    assetName: 'Core Banking API Gateway',
    cveId: 'CVE-2021-44228',
    baseCvss: 10.0,
    riskScore: 100.0,
    severity: 'CRITICAL',
    factors: [],
    missingDataWarnings: [],
    dataCompletenessScore: 1.0,
    riskFlags: ['CISA_KEV_ACTIVE_EXPLOITATION'],
    modelVersion: '1.0.0',
    provenanceHash: expectedHash,
    evaluatedAt: '2026-09-24T12:00:00Z',
  };

  const mockExistingRecord: StoredRiskResultRecord = {
    id: 'res-1',
    organization_id: 'org-1',
    asset_id: 'asset-111',
    vulnerability_id: 'vuln-1',
    cve_id: 'CVE-2021-44228',
    score: 100.0,
    level: 'CRITICAL',
    base_cvss: 10.0,
    model_version: '1.0.0',
    input_provenance_hash: expectedHash,
    data_completeness: 1.0,
    factors: [],
    missing_data_warnings: [],
    risk_flags: ['CISA_KEV_ACTIVE_EXPLOITATION'],
    snapshot_metadata: {},
    evaluated_at: '2026-09-24T10:00:00Z',
    created_at: '2026-09-24T10:00:00Z',
    updated_at: '2026-09-24T10:00:00Z',
  };

  beforeEach(() => {
    mockClient = {
      evaluateRisk: jest.fn(),
      evaluateRiskBatch: jest.fn(),
      baseUrl: 'http://localhost:8000',
      timeoutMs: 3000,
    } as any;

    mockRepo = {
      findByAssetAndCve: jest.fn(),
      upsertRiskResult: jest.fn(),
      upsertBatchRiskScores: jest.fn(),
      getRiskScores: jest.fn(),
      getAssetRiskSummary: jest.fn(),
      getVulnerabilityRiskDistribution: jest.fn(),
    } as any;

    service = new RiskService(mockClient, mockRepo);
  });

  describe('evaluateAndPersist (Cache Validation)', () => {
    it('CACHE HIT: returns cached result without invoking Python engine when input hash and model version match', async () => {
      mockRepo.findByAssetAndCve.mockResolvedValueOnce(mockExistingRecord);

      const result = await service.evaluateAndPersist(sampleInput);

      expect(mockRepo.findByAssetAndCve).toHaveBeenCalledWith('asset-111', 'CVE-2021-44228');
      expect(mockClient.evaluateRisk).not.toHaveBeenCalled();
      expect(mockRepo.upsertRiskResult).not.toHaveBeenCalled();
      expect(result.isCached).toBe(true);
      expect(result.riskScore).toBe(100.0);
      expect(result.severity).toBe('CRITICAL');
      expect(result.provenanceHash).toBe(expectedHash);
    });

    it('CACHE MISS (Changed Hash): calls Python engine and persists when input has changed (e.g. CVSS modified)', async () => {
      // Existing record has an older/different hash
      const staleRecord: StoredRiskResultRecord = {
        ...mockExistingRecord,
        input_provenance_hash: 'old_stale_hash_from_previous_evaluation_input',
        score: 70.0,
        level: 'HIGH',
      };
      mockRepo.findByAssetAndCve.mockResolvedValueOnce(staleRecord);
      mockClient.evaluateRisk.mockResolvedValueOnce(mockPythonResult);
      mockRepo.upsertRiskResult.mockResolvedValueOnce(mockExistingRecord);

      const result = await service.evaluateAndPersist(sampleInput);

      expect(mockRepo.findByAssetAndCve).toHaveBeenCalledWith('asset-111', 'CVE-2021-44228');
      expect(mockClient.evaluateRisk).toHaveBeenCalledWith(sampleInput);
      expect(mockRepo.upsertRiskResult).toHaveBeenCalledWith(mockPythonResult);
      expect(result.isCached).toBe(false);
      expect(result.riskScore).toBe(100.0);
    });

    it('CACHE MISS (New Asset/Vulnerability): calls Python engine when no previous record exists', async () => {
      mockRepo.findByAssetAndCve.mockResolvedValueOnce(null);
      mockClient.evaluateRisk.mockResolvedValueOnce(mockPythonResult);
      mockRepo.upsertRiskResult.mockResolvedValueOnce(mockExistingRecord);

      const result = await service.evaluateAndPersist(sampleInput);

      expect(mockClient.evaluateRisk).toHaveBeenCalledWith(sampleInput);
      expect(mockRepo.upsertRiskResult).toHaveBeenCalledWith(mockPythonResult);
      expect(result.isCached).toBe(false);
    });

    it('CACHE MISS (Model Version Bump): re-evaluates when model version changes', async () => {
      const olderModelRecord: StoredRiskResultRecord = {
        ...mockExistingRecord,
        model_version: '0.9.0', // Older model version
      };
      mockRepo.findByAssetAndCve.mockResolvedValueOnce(olderModelRecord);
      mockClient.evaluateRisk.mockResolvedValueOnce(mockPythonResult);
      mockRepo.upsertRiskResult.mockResolvedValueOnce(mockExistingRecord);

      const result = await service.evaluateAndPersist(sampleInput);

      expect(mockClient.evaluateRisk).toHaveBeenCalledWith(sampleInput);
      expect(result.isCached).toBe(false);
    });
  });

  describe('evaluateBatchAndPersist (Batch Caching)', () => {
    it('should return cached items directly and only send cache misses to Python engine', async () => {
      const inputItem1 = sampleInput;
      const inputItem2: RiskEvaluationInputDTO = {
        asset: {
          assetId: 'asset-222',
          assetName: 'Internal Server',
          criticalityTier: 3,
          isInternetFacing: false,
        },
        vulnerability: {
          cveId: 'CVE-2023-34362',
          cvssScore: 8.0,
          isKnownExploited: false,
        },
      };

      // Item 1: Cache Hit
      mockRepo.findByAssetAndCve.mockImplementation(async (assetId, cveId) => {
        if (assetId === 'asset-111' && cveId === 'CVE-2021-44228') {
          return mockExistingRecord;
        }
        return null; // Item 2 is a cache miss
      });

      const pythonItem2Result: RiskEvaluationResultDTO = {
        assetId: 'asset-222',
        assetName: 'Internal Server',
        cveId: 'CVE-2023-34362',
        baseCvss: 8.0,
        riskScore: 80.0,
        severity: 'HIGH',
        factors: [],
        missingDataWarnings: [],
        dataCompletenessScore: 0.75,
        riskFlags: [],
        modelVersion: '1.0.0',
        provenanceHash: computeProvenanceHash(inputItem2),
        evaluatedAt: '2026-09-24T12:00:00Z',
      };

      mockClient.evaluateRiskBatch.mockResolvedValueOnce({
        results: [pythonItem2Result],
        totalEvaluated: 1,
        modelVersion: '1.0.0',
      });

      const batchResult = await service.evaluateBatchAndPersist({
        evaluations: [inputItem1, inputItem2],
      });

      expect(batchResult.totalEvaluated).toBe(2);
      expect(batchResult.results[0].isCached).toBe(true);
      expect(batchResult.results[0].assetId).toBe('asset-111');
      expect(batchResult.results[1].isCached).toBe(false);
      expect(batchResult.results[1].assetId).toBe('asset-222');

      // Python client only evaluated the 1 miss, not the cached item
      expect(mockClient.evaluateRiskBatch).toHaveBeenCalledWith({
        evaluations: [inputItem2],
      });
    });
  });
});
