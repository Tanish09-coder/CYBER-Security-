// =============================================================================
// CyberRiskOS — Software Inventory Domain Types
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

// ---------------------------------------------------------------------------
// Stored Database Row Type
// ---------------------------------------------------------------------------

export interface StoredSoftware {
  id: string;
  asset_id: string;
  vendor: string;
  product: string;
  version: string;
  release: string | null;
  cpe23: string | null;
  install_path: string | null;
  last_observed_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API Request DTOs
// ---------------------------------------------------------------------------

export interface RegisterSoftwareItem {
  vendor: string;
  product: string;
  version: string;
  release?: string;
  cpe23?: string;
  install_path?: string;
  last_observed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterSoftwareRequest {
  packages: RegisterSoftwareItem[];
}

export interface UpdateSoftwareRequest {
  vendor?: string;
  product?: string;
  version?: string;
  release?: string | null;
  cpe23?: string | null;
  install_path?: string | null;
  last_observed_at?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API Response DTOs
// ---------------------------------------------------------------------------

export interface SoftwareResponse {
  id: string;
  assetId: string;
  vendor: string;
  product: string;
  version: string;
  release: string | null;
  cpe23: string | null;
  installPath: string | null;
  lastObservedAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareQueryFilters {
  vendor?: string;
  product?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

export function mapSoftwareToResponse(row: StoredSoftware): SoftwareResponse {
  return {
    id: row.id,
    assetId: row.asset_id,
    vendor: row.vendor,
    product: row.product,
    version: row.version,
    release: row.release,
    cpe23: row.cpe23,
    installPath: row.install_path,
    lastObservedAt: row.last_observed_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
