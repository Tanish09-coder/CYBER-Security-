// =============================================================================
// CyberRiskOS — Organizations & Business Units Service Layer
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { OrganizationRepository } from './organizations.repository';
import {
  StoredOrganization,
  StoredBusinessUnit,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
  OrganizationResponse,
  BusinessUnitResponse,
  mapOrganizationToResponse,
  mapBusinessUnitToResponse,
} from './organizations.types';
import { logger } from '../../config/logger';

export class OrganizationService {
  private repo: OrganizationRepository;

  constructor(repo?: OrganizationRepository) {
    this.repo = repo || new OrganizationRepository();
  }

  // ---------------------------------------------------------------------------
  // Organization Operations
  // ---------------------------------------------------------------------------

  async createOrganization(data: CreateOrganizationRequest): Promise<OrganizationResponse> {
    const row = await this.repo.createOrganization(data);
    return mapOrganizationToResponse(row);
  }

  async getOrganizationById(id: string): Promise<OrganizationResponse | null> {
    const row = await this.repo.findOrganizationById(id);
    return row ? mapOrganizationToResponse(row) : null;
  }

  async listOrganizations(): Promise<OrganizationResponse[]> {
    const rows = await this.repo.listOrganizations();
    return rows.map(mapOrganizationToResponse);
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<OrganizationResponse | null> {
    // Verify organization exists before update
    const existing = await this.repo.findOrganizationById(id);
    if (!existing) {
      return null;
    }

    const row = await this.repo.updateOrganization(id, data);
    return row ? mapOrganizationToResponse(row) : null;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const existing = await this.repo.findOrganizationById(id);
    if (!existing) {
      return false;
    }
    return this.repo.deleteOrganization(id);
  }

  // ---------------------------------------------------------------------------
  // Business Unit Operations
  // ---------------------------------------------------------------------------

  async createBusinessUnit(data: CreateBusinessUnitRequest): Promise<BusinessUnitResponse> {
    // Verify parent organization exists
    const org = await this.repo.findOrganizationById(data.organization_id);
    if (!org) {
      throw new OrganizationNotFoundError(
        `Organization ${data.organization_id} not found. Cannot create business unit.`
      );
    }

    const row = await this.repo.createBusinessUnit(data);
    return mapBusinessUnitToResponse(row);
  }

  async getBusinessUnitById(id: string): Promise<BusinessUnitResponse | null> {
    const row = await this.repo.findBusinessUnitById(id);
    return row ? mapBusinessUnitToResponse(row) : null;
  }

  async listBusinessUnits(organizationId?: string): Promise<BusinessUnitResponse[]> {
    const rows = organizationId
      ? await this.repo.listBusinessUnitsByOrganization(organizationId)
      : await this.repo.listAllBusinessUnits();
    return rows.map(mapBusinessUnitToResponse);
  }

  async updateBusinessUnit(
    id: string,
    data: UpdateBusinessUnitRequest
  ): Promise<BusinessUnitResponse | null> {
    const existing = await this.repo.findBusinessUnitById(id);
    if (!existing) {
      return null;
    }

    const row = await this.repo.updateBusinessUnit(id, data);
    return row ? mapBusinessUnitToResponse(row) : null;
  }

  async deleteBusinessUnit(id: string): Promise<boolean> {
    const existing = await this.repo.findBusinessUnitById(id);
    if (!existing) {
      return false;
    }
    return this.repo.deleteBusinessUnit(id);
  }
}

// =============================================================================
// Domain Error Classes
// =============================================================================

export class OrganizationNotFoundError extends Error {
  constructor(message: string = 'Organization not found') {
    super(message);
    this.name = 'OrganizationNotFoundError';
  }
}

export class BusinessUnitNotFoundError extends Error {
  constructor(message: string = 'Business unit not found') {
    super(message);
    this.name = 'BusinessUnitNotFoundError';
  }
}
