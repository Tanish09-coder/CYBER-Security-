// =============================================================================
// CyberRiskOS — Software Inventory Validation Schemas
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { z } from 'zod';

const uuidSchema = z.string().trim();

export const softwareItemSchema = z.object({
  vendor: z
    .string()
    .trim()
    .min(1, { message: 'Vendor name is required' })
    .max(128, { message: 'Vendor name must not exceed 128 characters' })
    .transform((v) => v.toLowerCase()),
  product: z
    .string()
    .trim()
    .min(1, { message: 'Product name is required' })
    .max(128, { message: 'Product name must not exceed 128 characters' })
    .transform((p) => p.toLowerCase()),
  version: z
    .string()
    .trim()
    .min(1, { message: 'Version is required' })
    .max(64, { message: 'Version must not exceed 64 characters' }),
  release: z.string().trim().max(64).optional(),
  cpe23: z.string().trim().max(255).optional(),
  install_path: z.string().trim().optional(),
  last_observed_at: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Supports either { packages: [...] } OR a direct array of packages OR a single package object
export const registerSoftwareSchema = z.union([
  z.object({
    packages: z.array(softwareItemSchema).min(1, { message: 'At least one package is required' }),
  }),
  z.array(softwareItemSchema).min(1, { message: 'At least one package is required' }),
  softwareItemSchema,
]);

export const updateSoftwareSchema = z.object({
  vendor: z.string().trim().min(1).max(128).transform((v) => v.toLowerCase()).optional(),
  product: z.string().trim().min(1).max(128).transform((p) => p.toLowerCase()).optional(),
  version: z.string().trim().min(1).max(64).optional(),
  release: z.string().trim().max(64).nullish(),
  cpe23: z.string().trim().max(255).nullish(),
  install_path: z.string().trim().nullish(),
  last_observed_at: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const softwareQuerySchema = z.object({
  vendor: z.string().optional(),
  product: z.string().optional(),
  search: z.string().optional(),
  page: z
    .string()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10))),
  limit: z
    .string()
    .default('50')
    .transform((val) => Math.min(200, Math.max(1, parseInt(val, 10)))),
});
