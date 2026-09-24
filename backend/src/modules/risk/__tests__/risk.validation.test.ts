// =============================================================================
// CyberRiskOS — Risk Engine v1 Validation Tests
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// =============================================================================

import {
  riskEvaluationInputSchema,
  riskEvaluationResultSchema,
  batchRiskEvaluationInputSchema,
  riskScoreQuerySchema,
  vulnerabilityRiskInputSchema,
  assetRiskInputSchema,
} from '../risk.validation';

describe('Risk Engine v1 Schemas & Validation', () => {
  describe('VulnerabilityRiskInputSchema', () => {
    it('should validate a complete vulnerability input payload', () => {
      const validPayload = {
        cveId: 'CVE-2021-44228',
        cvssScore: 10.0,
        cvssVersion: '3.1',
        isKnownExploited: true,
        knownRansomwareCampaignUse: 'Known',
        sourceIdentifier: 'cve@mitre.org',
      };

      const result = vulnerabilityRiskInputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cveId).toBe('CVE-2021-44228');
        expect(result.data.cvssScore).toBe(10.0);
        expect(result.data.isKnownExploited).toBe(true);
        expect(result.data.knownRansomwareCampaignUse).toBe('Known');
      }
    });

    it('should accept null for cvssScore (missing data protocol - never invent scores)', () => {
      const payload = {
        cveId: 'CVE-2026-12345',
        cvssScore: null,
        isKnownExploited: false,
      };

      const result = vulnerabilityRiskInputSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cvssScore).toBeNull();
      }
    });

    it('should reject CVSS scores out of range (< 0.0 or > 10.0)', () => {
      const invalidLow = {
        cveId: 'CVE-2021-44228',
        cvssScore: -0.1,
      };
      const invalidHigh = {
        cveId: 'CVE-2021-44228',
        cvssScore: 10.1,
      };

      expect(vulnerabilityRiskInputSchema.safeParse(invalidLow).success).toBe(false);
      expect(vulnerabilityRiskInputSchema.safeParse(invalidHigh).success).toBe(false);
    });

    it('should reject invalid CVE identifier formats', () => {
      const invalidCve = {
        cveId: 'NOT-A-CVE',
        cvssScore: 7.5,
      };

      const result = vulnerabilityRiskInputSchema.safeParse(invalidCve);
      expect(result.success).toBe(false);
    });
  });

  describe('AssetRiskInputSchema', () => {
    it('should validate a valid asset input with criticality tiers 1 to 5', () => {
      for (const tier of [1, 2, 3, 4, 5] as const) {
        const payload = {
          assetId: `asset-uuid-${tier}`,
          assetName: `Server ${tier}`,
          criticalityTier: tier,
          isInternetFacing: true,
          controls: [
            {
              controlCode: 'MFA',
              status: 'IMPLEMENTED',
              source: 'AUDIT_VERIFIED',
            },
          ],
        };

        const result = assetRiskInputSchema.safeParse(payload);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid criticality tiers (e.g. 0, 6, 2.5)', () => {
      const invalidTiers = [0, 6, 2.5, -1, 10];
      for (const tier of invalidTiers) {
        const payload = {
          assetId: 'asset-1',
          assetName: 'Server',
          criticalityTier: tier,
        };
        const result = assetRiskInputSchema.safeParse(payload);
        expect(result.success).toBe(false);
      }
    });

    it('should reject invalid control status', () => {
      const payload = {
        assetId: 'asset-1',
        assetName: 'Server',
        criticalityTier: 3,
        controls: [
          {
            controlCode: 'MFA',
            status: 'SUPER_SECURE', // Invalid enum
          },
        ],
      };
      const result = assetRiskInputSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('RiskEvaluationInputSchema (Atomic Evaluation Unit)', () => {
    it('should validate an atomic (asset_id, vulnerability_id) input pair', () => {
      const atomicPair = {
        asset: {
          assetId: 'srv-001',
          assetName: 'Core Banking Gateway',
          criticalityTier: 1,
          isInternetFacing: true,
          controls: [
            { controlCode: 'EDR', status: 'IMPLEMENTED' },
            { controlCode: 'MFA', status: 'PARTIAL' },
          ],
        },
        vulnerability: {
          cveId: 'CVE-2021-44228',
          cvssScore: 10.0,
          cvssVersion: '3.1',
          isKnownExploited: true,
          knownRansomwareCampaignUse: 'Known',
        },
      };

      const result = riskEvaluationInputSchema.safeParse(atomicPair);
      expect(result.success).toBe(true);
    });

    it('should reject when either asset or vulnerability is missing', () => {
      expect(riskEvaluationInputSchema.safeParse({ asset: {} }).success).toBe(false);
      expect(riskEvaluationInputSchema.safeParse({ vulnerability: {} }).success).toBe(false);
    });
  });

  describe('BatchRiskEvaluationInputSchema', () => {
    it('should reject empty batch evaluations array', () => {
      const result = batchRiskEvaluationInputSchema.safeParse({ evaluations: [] });
      expect(result.success).toBe(false);
    });

    it('should accept valid batch of evaluation pairs', () => {
      const batch = {
        evaluations: [
          {
            asset: {
              assetId: 'srv-001',
              assetName: 'Core Banking Gateway',
              criticalityTier: 1,
              isInternetFacing: true,
            },
            vulnerability: {
              cveId: 'CVE-2021-44228',
              cvssScore: 10.0,
              isKnownExploited: true,
            },
          },
        ],
      };

      const result = batchRiskEvaluationInputSchema.safeParse(batch);
      expect(result.success).toBe(true);
    });
  });

  describe('RiskEvaluationResultSchema', () => {
    it('should validate a compliant deterministic risk result object', () => {
      const resultPayload = {
        assetId: 'srv-001',
        assetName: 'Core Banking Gateway',
        cveId: 'CVE-2021-44228',
        baseCvss: 10.0,
        riskScore: 100.0,
        severity: 'CRITICAL',
        factors: [
          {
            name: 'CVSS_TECHNICAL_SEVERITY',
            category: 'TECHNICAL_SEVERITY',
            value: 10.0,
            weight: 1.0,
            contribution: 100.0,
            rationale: 'Maximum technical flaw severity from NIST NVD (CVSS 10.0).',
          },
          {
            name: 'ASSET_CRITICALITY_CONSEQUENCE',
            category: 'BUSINESS_CONTEXT',
            value: 1,
            weight: 1.4,
            contribution: 0.0,
            rationale: 'Tier 1 mission-critical consequence scaling (Model-Policy Construct: weight 1.40). Clamped at 100.0 max.',
          },
          {
            name: 'CISA_KEV_EXPLOITATION_EVIDENCE',
            category: 'THREAT_INTEL',
            value: true,
            weight: 0.0,
            contribution: 0.0,
            rationale: 'Active exploitation in the wild confirmed by CISA; establishes qualitative severity floor.',
          },
        ],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        riskFlags: ['RANSOMWARE_CAMPAIGN_ASSOCIATED'],
        modelVersion: '1.0.0',
        provenanceHash: 'a'.repeat(64),
        evaluatedAt: new Date().toISOString(),
      };

      const result = riskEvaluationResultSchema.safeParse(resultPayload);
      expect(result.success).toBe(true);
    });

    it('should reject risk scores exceeding 100.0 or below 0.0', () => {
      const base = {
        assetId: 'srv-001',
        assetName: 'Server',
        cveId: 'CVE-2021-44228',
        baseCvss: 10.0,
        severity: 'CRITICAL',
        factors: [],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        riskFlags: [],
        modelVersion: '1.0.0',
        provenanceHash: 'b'.repeat(64),
        evaluatedAt: new Date().toISOString(),
      };

      expect(riskEvaluationResultSchema.safeParse({ ...base, riskScore: 100.1 }).success).toBe(false);
      expect(riskEvaluationResultSchema.safeParse({ ...base, riskScore: -0.1 }).success).toBe(false);
    });

    it('should reject invalid provenance hashes (not 64-char hex)', () => {
      const base = {
        assetId: 'srv-001',
        assetName: 'Server',
        cveId: 'CVE-2021-44228',
        baseCvss: 10.0,
        riskScore: 85.0,
        severity: 'HIGH',
        factors: [],
        missingDataWarnings: [],
        dataCompletenessScore: 1.0,
        riskFlags: [],
        modelVersion: '1.0.0',
        provenanceHash: 'not-a-sha256',
        evaluatedAt: new Date().toISOString(),
      };

      expect(riskEvaluationResultSchema.safeParse(base).success).toBe(false);
    });
  });

  describe('RiskScoreQuerySchema', () => {
    it('should parse query parameters and coerce strings properly', () => {
      const query = {
        page: '2',
        limit: '50',
        severity: 'HIGH',
        isKnownExploited: 'true',
        isInternetFacing: 'false',
        minScore: '60',
        maxScore: '90',
      };

      const result = riskScoreQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.severity).toBe('HIGH');
        expect(result.data.isKnownExploited).toBe(true);
        expect(result.data.isInternetFacing).toBe(false);
        expect(result.data.minScore).toBe(60);
        expect(result.data.maxScore).toBe(90);
      }
    });
  });
});
