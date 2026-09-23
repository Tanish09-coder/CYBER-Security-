// =============================================================================
// CyberRiskOS — Organizations & Business Units Validation Schemas
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared Primitives
// ---------------------------------------------------------------------------

export const uuidSchema = z
  .string()
  .trim()
  .uuid({ message: 'Invalid UUID format' });

export const currencySchema = z
  .string()
  .trim()
  .length(3, { message: 'Currency must be a 3-letter ISO 4217 code' })
  .toUpperCase()
  .default('USD');

export const criticalityTierSchema = z
  .number()
  .int()
  .min(1, { message: 'Criticality tier must be between 1 and 5' })
  .max(5, { message: 'Criticality tier must be between 1 and 5' })
  .default(3);

// ---------------------------------------------------------------------------
// Organization Schemas
// ---------------------------------------------------------------------------

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Organization name is required' })
    .max(255, { message: 'Organization name must not exceed 255 characters' }),
  industry: z
    .string()
    .trim()
    .max(128, { message: 'Industry must not exceed 128 characters' })
    .optional(),
  employee_count: z
    .number()
    .int()
    .min(0, { message: 'Employee count must be non-negative' })
    .optional(),
  annual_revenue: z
    .number()
    .min(0, { message: 'Annual revenue must be non-negative' })
    .optional(),
  currency: currencySchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Organization name is required' })
    .max(255, { message: 'Organization name must not exceed 255 characters' })
    .optional(),
  industry: z
    .string()
    .trim()
    .max(128, { message: 'Industry must not exceed 128 characters' })
    .nullish(),
  employee_count: z
    .number()
    .int()
    .min(0, { message: 'Employee count must be non-negative' })
    .nullish(),
  annual_revenue: z
    .number()
    .min(0, { message: 'Annual revenue must be non-negative' })
    .nullish(),
  currency: currencySchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Business Unit Schemas
// ---------------------------------------------------------------------------

export const createBusinessUnitSchema = z.object({
  organization_id: uuidSchema,
  name: z
    .string()
    .trim()
    .min(1, { message: 'Business unit name is required' })
    .max(255, { message: 'Business unit name must not exceed 255 characters' }),
  criticality_tier: criticalityTierSchema.optional(),
  budget: z
    .number()
    .min(0, { message: 'Budget must be non-negative' })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateBusinessUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Business unit name is required' })
    .max(255, { message: 'Business unit name must not exceed 255 characters' })
    .optional(),
  criticality_tier: criticalityTierSchema.optional(),
  budget: z
    .number()
    .min(0, { message: 'Budget must be non-negative' })
    .nullish(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Query Parameter Schemas
// ---------------------------------------------------------------------------

export const organizationIdParamSchema = z.object({
  id: uuidSchema,
});

export const businessUnitQuerySchema = z.object({
  organizationId: uuidSchema.optional(),
});
