// =============================================================================
// CyberRiskOS — AI Explanation Assistant Zod Validation Schemas
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: ID-Based Authoritative Backend Resolution
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/assistant/explain-risk
// Require riskResultId OR (assetId + cveId)
// ---------------------------------------------------------------------------

export const riskExplanationSchema = z
  .object({
    riskResultId: z.string().optional(),
    assetId: z.string().optional(),
    cveId: z.string().optional(),
    assetName: z.string().optional(),
    modelVersion: z.string().optional(),
  })
  .refine(
    (data) => data.riskResultId || (data.assetId && data.cveId),
    {
      message: 'Either riskResultId OR both assetId and cveId must be provided for authoritative backend resolution.',
      path: ['riskResultId'],
    }
  );

export type RiskExplanationInput = z.infer<typeof riskExplanationSchema>;

// ---------------------------------------------------------------------------
// POST /api/assistant/explain-financial
// Require financialResultId OR assetId
// ---------------------------------------------------------------------------

export const financialExplanationSchema = z
  .object({
    financialResultId: z.string().optional(),
    assetId: z.string().optional(),
    cveId: z.string().optional(),
    currency: z.string().max(10).optional(),
  })
  .refine(
    (data) => data.financialResultId || data.assetId,
    {
      message: 'Either financialResultId OR assetId must be provided for authoritative backend resolution.',
      path: ['financialResultId'],
    }
  );

export type FinancialExplanationInput = z.infer<typeof financialExplanationSchema>;

// ---------------------------------------------------------------------------
// POST /api/assistant/compare-strategies
// Require optimizationResultId + strategyIds OR budgetLimit
// ---------------------------------------------------------------------------

export const strategyComparisonSchema = z
  .object({
    optimizationResultId: z.string().optional(),
    strategyIds: z.array(z.string()).length(2).optional(),
    budgetLimit: z.number().min(0.0).optional(),
    currency: z.string().max(10).optional(),
    candidateActions: z.array(z.any()).optional(),
  })
  .refine(
    (data) =>
      (data.optimizationResultId && data.strategyIds && data.strategyIds.length === 2) ||
      data.budgetLimit !== undefined,
    {
      message:
        'Either optimizationResultId with strategyIds OR budgetLimit must be provided for authoritative backend resolution.',
      path: ['optimizationResultId'],
    }
  );

export type StrategyComparisonInput = z.infer<typeof strategyComparisonSchema>;

// ---------------------------------------------------------------------------
// POST /api/assistant/contain-breach
// Active Breach Containment AI Agent Schema
// ---------------------------------------------------------------------------

export const breachContainmentSchema = z.object({
  serverId: z.string().min(1, 'Server ID is required.'),
  serverName: z.string().min(1, 'Server name is required.'),
  ipAddress: z.string().optional(),
  osEnvironment: z.string().optional(),
  incidentType: z.string().min(1, 'Incident type is required.'),
  threatSeverity: z.string().default('CRITICAL'),
  detectedAnomalies: z.array(z.string()).optional(),
  affectedServices: z.array(z.string()).optional(),
});

export type BreachContainmentInput = z.infer<typeof breachContainmentSchema>;

