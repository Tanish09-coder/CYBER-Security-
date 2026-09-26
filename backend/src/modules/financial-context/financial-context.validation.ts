// =============================================================================
// CyberRiskOS — Enterprise Financial Context Zod Validation Schemas
// Owner: HARSH
// =============================================================================

import { z } from 'zod';

export const financialParametersSchema = z.object({
  hourlyDowntimeCost: z.number().min(0).nullable().optional(),
  hourlyRecoveryRate: z.number().min(0).nullable().optional(),
  costPerSensitiveRecord: z.number().min(0).nullable().optional(),
  regulatoryBreachPenalty: z.number().min(0).nullable().optional(),
  dailyTransactionVolume: z.number().min(0).nullable().optional(),
});

export const remediationActionSchema = z.object({
  organizationId: z.string({ message: 'organizationId is required' }),
  title: z.string().min(1, { message: 'title is required' }),
  description: z.string().optional(),
  actionType: z.enum(['ENABLE_CONTROL', 'PATCH_CVE', 'SEGMENT_NETWORK', 'REMEDIATE_VULNERABILITY']),
  remediationCost: z.number().min(0, { message: 'remediationCost must be non-negative' }),
  estimatedEffortHours: z.number().min(0).optional(),
  targetControlCode: z.string().optional(),
  targetCveId: z.string().optional(),
  affectedAssetIds: z.array(z.string().uuid()).optional().default([]),
  status: z.enum(['PLANNED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional().default('PLANNED'),
});

export const assetDependencySchema = z.object({
  sourceAssetId: z.string().uuid({ message: 'sourceAssetId must be a valid UUID' }),
  targetAssetId: z.string().uuid({ message: 'targetAssetId must be a valid UUID' }),
  dependencyType: z.enum(['IDENTITY', 'DATABASE', 'NETWORK_PATH', 'API', 'PIPELINE']).optional().default('API'),
  propagationWeight: z.number().min(0).max(1.0).optional().default(0.20),
  notes: z.string().optional(),
}).refine(data => data.sourceAssetId !== data.targetAssetId, {
  message: 'sourceAssetId and targetAssetId cannot be the same asset',
  path: ['targetAssetId'],
});

export const complianceEvidenceSchema = z.object({
  organizationId: z.string({ message: 'organizationId is required' }),
  complianceControlId: z.string().uuid({ message: 'complianceControlId must be a valid UUID' }),
  assetId: z.string().uuid().optional(),
  evidenceUri: z.string().min(1, { message: 'evidenceUri is required' }),
  evidenceType: z.string().optional().default('DOCUMENT'),
  status: z.enum(['VERIFIED', 'EXPIRED', 'PENDING', 'REJECTED']).optional().default('PENDING'),
});
