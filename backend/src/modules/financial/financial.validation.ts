// =============================================================================
// CyberRiskOS — Financial Exposure & EAL Zod Validation Schemas
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// =============================================================================

import { z } from 'zod';

export const financialAssetInputSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  assetName: z.string().min(1, 'Asset name is required'),
  criticalityTier: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  isInternetFacing: z.boolean().default(false),
  hourlyDowntimeCost: z.number().min(0.0).optional().nullable(),
  recoveryCost: z.number().min(0.0).optional().nullable(),
  estimatedOutageHours: z.number().min(0.0).optional().nullable(),
  annualizedLossEventFrequency: z.number().min(0.0).optional().nullable(),
  currency: z.string().max(10).default('USD'),
});

export const financialVulnerabilityInputSchema = z.object({
  cveId: z
    .string()
    .min(1, 'CVE ID is required')
    .regex(/^CVE-\d{4}-\d{4,}$/i, 'Invalid CVE format (e.g. CVE-2021-44228)'),
  cvssScore: z.number().min(0.0).max(10.0).optional().nullable(),
  availabilityImpact: z.enum(['HIGH', 'LOW', 'NONE']).optional().nullable().default('HIGH'),
  scope: z.enum(['UNCHANGED', 'CHANGED']).optional().nullable().default('UNCHANGED'),
  isKnownExploited: z.boolean().default(false),
  knownRansomwareCampaignUse: z.string().optional().nullable(),
  annualizedLossEventFrequency: z.number().min(0.0).optional().nullable(),
});

export const financialExposureInputSchema = z.object({
  asset: financialAssetInputSchema,
  vulnerability: financialVulnerabilityInputSchema,
});

export const batchFinancialExposureInputSchema = z.object({
  evaluations: z
    .array(financialExposureInputSchema)
    .min(1, 'At least one evaluation item is required')
    .max(500, 'Batch capped at 500 items per request'),
});

export const financialExposureQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  assetId: z.string().optional(),
  cveId: z.string().optional(),
  minEal: z.coerce.number().min(0).optional(),
  maxEal: z.coerce.number().min(0).optional(),
  modelVersion: z.string().optional(),
  organizationId: z.string().optional(),
});
