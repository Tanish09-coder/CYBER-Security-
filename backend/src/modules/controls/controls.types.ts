// =============================================================================
// CyberRiskOS — Security Controls Domain Types
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

export const CONTROL_STATUSES = [
  'IMPLEMENTED',
  'PARTIAL',
  'NOT_IMPLEMENTED',
  'UNKNOWN',
] as const;

export type ControlStatus = (typeof CONTROL_STATUSES)[number];

export const CONTROL_SOURCES = [
  'USER_CONFIG',
  'SCANNER_IMPORT',
  'AUDIT_VERIFIED',
] as const;

export type ControlSource = (typeof CONTROL_SOURCES)[number];

// ---------------------------------------------------------------------------
// Database Row Types
// ---------------------------------------------------------------------------

export interface StoredSecurityControl {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  default_mitigation_weight: string; // NUMERIC returned as string
  created_at: string;
  updated_at: string;
}

export interface StoredAssetControl {
  id: string;
  asset_id: string;
  control_id: string;
  control_code: string;
  status: ControlStatus;
  effectiveness_score: string; // NUMERIC returned as string
  source: ControlSource;
  notes: string | null;
  last_verified_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface SetAssetControlItem {
  control_code: string;
  status: ControlStatus;
  effectiveness_score?: number;
  notes?: string;
  source?: ControlSource;
  metadata?: Record<string, unknown>;
}

export interface UpdateAssetControlRequest {
  status?: ControlStatus;
  effectiveness_score?: number;
  notes?: string | null;
  source?: ControlSource;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export interface SecurityControlResponse {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  defaultMitigationWeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetControlResponse {
  id: string;
  assetId: string;
  controlId: string;
  controlCode: string;
  controlName?: string;
  controlCategory?: string;
  status: ControlStatus;
  effectivenessScore: number;
  source: ControlSource;
  notes: string | null;
  lastVerifiedAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ControlCoverageItem {
  code: string;
  name: string;
  category: string;
  defaultMitigationWeight: number;
  totalAssetsAssigned: number;
  implementedCount: number;
  partialCount: number;
  notImplementedCount: number;
  unknownCount: number;
  coveragePercentage: number;
}

export interface ControlsSummaryResponse {
  totalCatalogControls: number;
  controls: ControlCoverageItem[];
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function mapSecurityControlToResponse(row: StoredSecurityControl): SecurityControlResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    defaultMitigationWeight: parseFloat(row.default_mitigation_weight || '0.50'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAssetControlToResponse(row: StoredAssetControl & { control_name?: string; control_category?: string }): AssetControlResponse {
  return {
    id: row.id,
    assetId: row.asset_id,
    controlId: row.control_id,
    controlCode: row.control_code,
    controlName: row.control_name,
    controlCategory: row.control_category,
    status: row.status,
    effectivenessScore: parseFloat(row.effectiveness_score || '0.00'),
    source: row.source,
    notes: row.notes,
    lastVerifiedAt: row.last_verified_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
