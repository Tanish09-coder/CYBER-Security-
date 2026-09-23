// =============================================================================
// CyberRiskOS — Security Controls Validation Schemas
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { z } from 'zod';
import { CONTROL_STATUSES, CONTROL_SOURCES } from './controls.types';

export const controlCodeSchema = z
  .string()
  .trim()
  .min(2, { message: 'Control code must be at least 2 characters' })
  .max(32, { message: 'Control code must not exceed 32 characters' })
  .toUpperCase();

export const controlStatusSchema = z.enum(CONTROL_STATUSES);
export const controlSourceSchema = z.enum(CONTROL_SOURCES).default('USER_CONFIG');

export const effectivenessScoreSchema = z
  .number()
  .min(0.0, { message: 'Effectiveness score must be between 0.00 and 1.00' })
  .max(1.0, { message: 'Effectiveness score must be between 0.00 and 1.00' });

export const setAssetControlItemSchema = z.object({
  control_code: controlCodeSchema,
  status: controlStatusSchema,
  effectiveness_score: effectivenessScoreSchema.optional(),
  notes: z.string().trim().optional(),
  source: controlSourceSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const setAssetControlsSchema = z.union([
  z.object({
    controls: z.array(setAssetControlItemSchema).min(1, { message: 'At least one control is required' }),
  }),
  z.array(setAssetControlItemSchema).min(1, { message: 'At least one control is required' }),
  setAssetControlItemSchema,
]);

export const updateAssetControlSchema = z.object({
  status: controlStatusSchema.optional(),
  effectiveness_score: effectivenessScoreSchema.optional(),
  notes: z.string().trim().nullish(),
  source: controlSourceSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
