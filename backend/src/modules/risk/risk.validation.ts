// =============================================================================
// CyberRiskOS — Risk Engine v1 Zod Validation Schemas
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// =============================================================================

import { z } from 'zod';
import {
  RISK_SEVERITIES,
  FACTOR_CATEGORIES,
  CONTROL_STATUSES,
  CONTROL_SOURCES,
} from './risk.types';

// -----------------------------------------------------------------------------
// Sub-schemas
// -----------------------------------------------------------------------------

export const controlContextSchema = z.object({
  controlCode: z.string().min(1, 'Control code is required').trim(),
  status: z.enum(CONTROL_STATUSES),
  source: z.enum(CONTROL_SOURCES).optional(),
});

export const vulnerabilityRiskInputSchema = z.object({
  cveId: z
    .string()
    .min(1, 'CVE ID is required')
    .regex(/^CVE-\d{4}-\d{4,}$/i, 'Invalid CVE format (e.g. CVE-2021-44228)'),
  cvssScore: z
    .number()
    .min(0.0, 'CVSS score cannot be less than 0.0')
    .max(10.0, 'CVSS score cannot exceed 10.0')
    .nullable(),
  cvssVersion: z.string().optional().nullable(),
  isKnownExploited: z.boolean().default(false),
  knownRansomwareCampaignUse: z.string().optional().nullable(),
  sourceIdentifier: z.string().optional().nullable(),
});

export const assetRiskInputSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  assetName: z.string().min(1, 'Asset name is required'),
  criticalityTier: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ])
    .optional()
    .nullable(),
  isInternetFacing: z.boolean().optional().nullable(),
  businessUnitId: z.string().optional().nullable(),
  businessUnitName: z.string().optional().nullable(),
  controls: z.array(controlContextSchema).optional().nullable().default([]),
});

export const riskEvaluationInputSchema = z.object({
  asset: assetRiskInputSchema,
  vulnerability: vulnerabilityRiskInputSchema,
});

export const batchRiskEvaluationInputSchema = z.object({
  evaluations: z
    .array(riskEvaluationInputSchema)
    .min(1, 'At least one evaluation pair is required')
    .max(500, 'Batch evaluation capped at 500 items per request'),
});

// -----------------------------------------------------------------------------
// Result Schemas
// -----------------------------------------------------------------------------

export const factorExplanationSchema = z.object({
  name: z.string().min(1),
  category: z.enum(FACTOR_CATEGORIES),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  weight: z.number(),
  contribution: z.number().nullable(),
  rationale: z.string(),
});

export const riskEvaluationResultSchema = z.object({
  assetId: z.string().min(1),
  assetName: z.string().optional(),
  cveId: z.string().min(1),
  baseCvss: z.number().min(0.0).max(10.0).nullable(),
  riskScore: z.number().min(0.0).max(100.0).nullable(),
  evaluationStatus: z.enum(['CALCULATED', 'NOT_CALCULABLE', 'INCOMPLETE']).optional(),
  severity: z.enum(RISK_SEVERITIES),
  factors: z.array(factorExplanationSchema),
  missingDataWarnings: z.array(z.string()),
  dataCompletenessScore: z.number().min(0.0).max(1.0),
  riskFlags: z.array(z.string()),
  modelVersion: z.string(),
  provenanceHash: z.string().regex(/^[a-f0-9]{64}$/i, 'Must be valid SHA-256 hex digest'),
  evaluatedAt: z.string().min(1),
  isCached: z.boolean().optional(),
});

export const batchRiskEvaluationResultSchema = z.object({
  results: z.array(riskEvaluationResultSchema),
  totalEvaluated: z.number().int().min(0),
  modelVersion: z.string(),
});

// -----------------------------------------------------------------------------
// Query Params Schema
// -----------------------------------------------------------------------------

export const riskScoreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  assetId: z.string().optional(),
  cveId: z.string().optional(),
  level: z.enum(RISK_SEVERITIES).optional(),
  severity: z.enum(RISK_SEVERITIES).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  modelVersion: z.string().optional(),
  organizationId: z.string().optional(),
  isKnownExploited: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
  isInternetFacing: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});
