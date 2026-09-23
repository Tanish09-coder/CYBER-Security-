// =============================================================================
// CyberRiskOS — Organizations & Business Units Domain Types
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

// ---------------------------------------------------------------------------
// Stored Database Row Types
// ---------------------------------------------------------------------------

export interface StoredOrganization {
  id: string;
  name: string;
  industry: string | null;
  employee_count: number | null;
  annual_revenue: string | null; // NUMERIC comes back as string from pg
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StoredBusinessUnit {
  id: string;
  organization_id: string;
  name: string;
  criticality_tier: number;
  budget: string | null; // NUMERIC comes back as string from pg
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API Request DTOs
// ---------------------------------------------------------------------------

export interface CreateOrganizationRequest {
  name: string;
  industry?: string;
  employee_count?: number;
  annual_revenue?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  industry?: string | null;
  employee_count?: number | null;
  annual_revenue?: number | null;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateBusinessUnitRequest {
  organization_id: string;
  name: string;
  criticality_tier?: number;
  budget?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateBusinessUnitRequest {
  name?: string;
  criticality_tier?: number;
  budget?: number | null;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// API Response DTOs
// ---------------------------------------------------------------------------

export interface OrganizationResponse {
  id: string;
  name: string;
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  currency: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnitResponse {
  id: string;
  organizationId: string;
  name: string;
  criticalityTier: number;
  budget: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mapper Helpers
// ---------------------------------------------------------------------------

export function mapOrganizationToResponse(row: StoredOrganization): OrganizationResponse {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    employeeCount: row.employee_count,
    annualRevenue: row.annual_revenue ? parseFloat(row.annual_revenue) : null,
    currency: row.currency,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBusinessUnitToResponse(row: StoredBusinessUnit): BusinessUnitResponse {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    criticalityTier: row.criticality_tier,
    budget: row.budget ? parseFloat(row.budget) : null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
