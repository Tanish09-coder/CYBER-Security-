// =============================================================================
// CyberRiskOS — Enterprise Asset Inventory Domain Types
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export const ASSET_TYPES = [
  'server',
  'workstation',
  'laptop',
  'network_appliance',
  'cloud_instance',
  'virtual_machine',
  'container',
  'iot_device',
  'mobile_device',
  'database_server',
  'other',
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const ENVIRONMENTS = ['Production', 'Staging', 'Development', 'DR'] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const DATA_CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'] as const;
export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number];

// ---------------------------------------------------------------------------
// Stored Database Row Type
// ---------------------------------------------------------------------------

export interface StoredAsset {
  id: string;
  organization_id: string;
  business_unit_id: string | null;
  asset_identifier: string | null;
  name: string;
  hostname: string | null;
  ip_address: string | null;
  mac_address: string | null;
  asset_type: string;
  operating_system: string | null;
  environment: string;
  owner: string | null;
  is_internet_facing: boolean;
  business_criticality: number;
  data_classification: string;
  revenue_dependency_pct: string | null;
  operational_importance: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API Request DTOs
// ---------------------------------------------------------------------------

export interface CreateAssetRequest {
  organization_id: string;
  business_unit_id?: string;
  asset_identifier?: string;
  name: string;
  hostname?: string;
  ip_address?: string;
  mac_address?: string;
  asset_type?: string;
  operating_system?: string;
  environment?: string;
  owner?: string;
  is_internet_facing?: boolean;
  business_criticality?: number;
  data_classification?: string;
  revenue_dependency_pct?: number;
  operational_importance?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetRequest {
  business_unit_id?: string | null;
  asset_identifier?: string | null;
  name?: string;
  hostname?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  asset_type?: string;
  operating_system?: string | null;
  environment?: string;
  owner?: string | null;
  is_internet_facing?: boolean;
  business_criticality?: number;
  data_classification?: string;
  revenue_dependency_pct?: number | null;
  operational_importance?: number | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API Response DTO
// ---------------------------------------------------------------------------

export interface AssetResponse {
  id: string;
  organizationId: string;
  businessUnitId: string | null;
  assetIdentifier: string | null;
  name: string;
  hostname: string | null;
  ipAddress: string | null;
  macAddress: string | null;
  assetType: string;
  operatingSystem: string | null;
  environment: string;
  owner: string | null;
  isInternetFacing: boolean;
  businessCriticality: number;
  dataClassification: string;
  revenueDependencyPct: number | null;
  operationalImportance: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Import Result Types
// ---------------------------------------------------------------------------

export interface ImportRowError {
  row: number;
  field?: string;
  message: string;
  rawValue?: string;
}

export interface AssetImportResult {
  totalRows: number;
  imported: number;
  skippedDuplicates: number;
  errors: ImportRowError[];
}

// ---------------------------------------------------------------------------
// Query Filters
// ---------------------------------------------------------------------------

export interface AssetQueryFilters {
  organizationId?: string;
  businessUnitId?: string;
  assetType?: string;
  isInternetFacing?: boolean;
  businessCriticality?: number;
  dataClassification?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function mapAssetToResponse(row: StoredAsset): AssetResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    businessUnitId: row.business_unit_id,
    assetIdentifier: row.asset_identifier,
    name: row.name,
    hostname: row.hostname,
    ipAddress: row.ip_address,
    macAddress: row.mac_address,
    assetType: row.asset_type,
    operatingSystem: row.operating_system,
    environment: row.environment,
    owner: row.owner,
    isInternetFacing: row.is_internet_facing,
    businessCriticality: row.business_criticality,
    dataClassification: row.data_classification,
    revenueDependencyPct: row.revenue_dependency_pct ? parseFloat(row.revenue_dependency_pct) : null,
    operationalImportance: row.operational_importance ? parseFloat(row.operational_importance) : null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
