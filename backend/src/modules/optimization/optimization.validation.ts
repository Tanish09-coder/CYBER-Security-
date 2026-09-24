// =============================================================================
// CyberRiskOS — Investment Optimization Zod Validation Schemas
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// =============================================================================

import { z } from 'zod';

export const remediationCandidateActionSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
  actionType: z.string().min(1, 'Action type is required'),
  targetAssetId: z.string().min(1, 'Target Asset ID is required'),
  targetCveId: z.string().optional().nullable(),
  controlCode: z.string().optional().nullable(),
  cost: z.number().min(0.0, 'Action cost must be non-negative'),
  estimatedRiskReduction: z.number().min(0.0).default(0.0),
  estimatedEalReduction: z.number().min(0.0).default(0.0),
  dependencies: z.array(z.string()).default([]),
  conflictsWith: z.array(z.string()).default([]),
  title: z.string().min(1, 'Action title is required'),
  description: z.string().optional().nullable(),
});

export const optimizationRequestSchema = z.object({
  budgetLimit: z.number().min(0.0, 'Budget limit must be non-negative'),
  currency: z.string().max(10).default('USD'),
  candidateActions: z.array(remediationCandidateActionSchema).optional(),
  baselinePortfolioRisk: z.number().min(0.0).max(100.0).optional().nullable(),
  baselinePortfolioEal: z.number().min(0.0).optional().nullable(),
});

export const strategyComparisonSchema = z.object({
  budgetLimit: z.number().min(0.0),
  strategyA: z.record(z.string(), z.any()),
  strategyB: z.record(z.string(), z.any()),
});
