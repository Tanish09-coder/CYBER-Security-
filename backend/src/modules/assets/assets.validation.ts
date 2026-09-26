// =============================================================================
// CyberRiskOS — Enterprise Asset Validation Schemas
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { z } from 'zod';
import { ASSET_TYPES, ENVIRONMENTS, DATA_CLASSIFICATIONS } from './assets.types';

// ---------------------------------------------------------------------------
// Shared Primitives
// ---------------------------------------------------------------------------

const uuidSchema = z.string().trim();

const macAddressSchema = z
  .string()
  .trim()
  .regex(/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/, {
    message: 'Invalid MAC address format. Expected: XX:XX:XX:XX:XX:XX',
  })
  .toUpperCase();

const ipAddressSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      // IPv4
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(val)) {
        const octets = val.split('.').map(Number);
        return octets.every((o) => o >= 0 && o <= 255);
      }
      // IPv6
      return val.includes(':') && /^[0-9a-fA-F:]+$/.test(val);
    },
    { message: 'Invalid IP address format' }
  );

const hostnameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Hostname cannot be empty' })
  .max(255, { message: 'Hostname must not exceed 255 characters' });

// ---------------------------------------------------------------------------
// Create Asset Schema
// ---------------------------------------------------------------------------

export const createAssetSchema = z.object({
  organization_id: uuidSchema,
  business_unit_id: uuidSchema.optional(),
  asset_identifier: z.string().trim().max(128).optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: 'Asset name is required' })
    .max(255, { message: 'Asset name must not exceed 255 characters' }),
  hostname: hostnameSchema.optional(),
  ip_address: ipAddressSchema.optional(),
  mac_address: macAddressSchema.optional(),
  asset_type: z.string().trim().max(64).default('server'),
  operating_system: z.string().trim().max(128).optional(),
  environment: z.enum(ENVIRONMENTS).default('Production'),
  owner: z.string().trim().max(255).optional(),
  is_internet_facing: z.boolean().optional(),
  business_criticality: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  data_classification: z.enum(DATA_CLASSIFICATIONS).default('Internal'),
  revenue_dependency_pct: z.number().min(0).max(100).optional(),
  operational_importance: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Update Asset Schema
// ---------------------------------------------------------------------------

export const updateAssetSchema = z.object({
  business_unit_id: uuidSchema.nullish(),
  asset_identifier: z.string().trim().max(128).nullish(),
  name: z.string().trim().min(1).max(255).optional(),
  hostname: hostnameSchema.nullish(),
  ip_address: ipAddressSchema.nullish(),
  mac_address: macAddressSchema.nullish(),
  asset_type: z.string().trim().max(64).optional(),
  operating_system: z.string().trim().max(128).nullish(),
  environment: z.enum(ENVIRONMENTS).optional(),
  owner: z.string().trim().max(255).nullish(),
  is_internet_facing: z.boolean().optional(),
  business_criticality: z.number().int().min(1).max(5).optional(),
  data_classification: z.enum(DATA_CLASSIFICATIONS).optional(),
  revenue_dependency_pct: z.number().min(0).max(100).nullish(),
  operational_importance: z.number().min(0).nullish(),
  metadata: z.record(z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// JSON Batch Import Schema
// ---------------------------------------------------------------------------

export const assetImportJsonSchema = z.object({
  organization_id: uuidSchema,
  assets: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        hostname: hostnameSchema.optional(),
        ip_address: ipAddressSchema.optional(),
        mac_address: macAddressSchema.optional(),
        asset_type: z.string().trim().max(64).default('server'),
        operating_system: z.string().trim().max(128).optional(),
        environment: z.enum(ENVIRONMENTS).default('Production'),
        owner: z.string().trim().max(255).optional(),
        is_internet_facing: z.boolean().optional(),
        business_criticality: z.number().int().min(1).max(5).optional(),
        data_classification: z.enum(DATA_CLASSIFICATIONS).default('Internal'),
        business_unit_id: uuidSchema.optional(),
        asset_identifier: z.string().trim().max(128).optional(),
        revenue_dependency_pct: z.number().min(0).max(100).optional(),
        operational_importance: z.number().min(0).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .min(1, { message: 'At least one asset is required' })
    .max(1000, { message: 'Batch import limited to 1000 assets' }),
});

// ---------------------------------------------------------------------------
// Query Params Schema
// ---------------------------------------------------------------------------

export const assetQuerySchema = z.object({
  organizationId: uuidSchema.optional(),
  businessUnitId: uuidSchema.optional(),
  assetType: z.string().optional(),
  isInternetFacing: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  businessCriticality: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(5))
    .optional(),
  dataClassification: z.enum(DATA_CLASSIFICATIONS).optional(),
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
