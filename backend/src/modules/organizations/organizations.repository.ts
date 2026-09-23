// =============================================================================
// CyberRiskOS — Organizations & Business Units Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query, withTransaction } from '../../db';
import {
  StoredOrganization,
  StoredBusinessUnit,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  CreateBusinessUnitRequest,
  UpdateBusinessUnitRequest,
} from './organizations.types';
import { logger } from '../../config/logger';

export class OrganizationRepository {
  // ---------------------------------------------------------------------------
  // Organizations CRUD
  // ---------------------------------------------------------------------------

  async createOrganization(data: CreateOrganizationRequest): Promise<StoredOrganization> {
    const result = await query<StoredOrganization>(
      `INSERT INTO organizations (name, industry, employee_count, annual_revenue, currency, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.industry || null,
        data.employee_count ?? null,
        data.annual_revenue ?? null,
        data.currency || 'USD',
        JSON.stringify(data.metadata || {}),
      ]
    );

    logger.info('Organization created', { id: result.rows[0].id, name: data.name });
    return result.rows[0];
  }

  async findOrganizationById(id: string): Promise<StoredOrganization | null> {
    const result = await query<StoredOrganization>(
      `SELECT * FROM organizations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async listOrganizations(): Promise<StoredOrganization[]> {
    const result = await query<StoredOrganization>(
      `SELECT * FROM organizations ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<StoredOrganization | null> {
    // Build dynamic SET clause from provided fields only
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.industry !== undefined) {
      setClauses.push(`industry = $${paramIndex++}`);
      values.push(data.industry);
    }
    if (data.employee_count !== undefined) {
      setClauses.push(`employee_count = $${paramIndex++}`);
      values.push(data.employee_count);
    }
    if (data.annual_revenue !== undefined) {
      setClauses.push(`annual_revenue = $${paramIndex++}`);
      values.push(data.annual_revenue);
    }
    if (data.currency !== undefined) {
      setClauses.push(`currency = $${paramIndex++}`);
      values.push(data.currency);
    }
    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return this.findOrganizationById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<StoredOrganization>(
      `UPDATE organizations SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows[0]) {
      logger.info('Organization updated', { id });
    }

    return result.rows[0] || null;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM organizations WHERE id = $1`,
      [id]
    );
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      logger.info('Organization deleted', { id });
    }
    return deleted;
  }

  // ---------------------------------------------------------------------------
  // Business Units CRUD
  // ---------------------------------------------------------------------------

  async createBusinessUnit(data: CreateBusinessUnitRequest): Promise<StoredBusinessUnit> {
    const result = await query<StoredBusinessUnit>(
      `INSERT INTO business_units (organization_id, name, criticality_tier, budget, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.organization_id,
        data.name,
        data.criticality_tier ?? 3,
        data.budget ?? null,
        JSON.stringify(data.metadata || {}),
      ]
    );

    logger.info('Business unit created', {
      id: result.rows[0].id,
      organizationId: data.organization_id,
      name: data.name,
    });
    return result.rows[0];
  }

  async findBusinessUnitById(id: string): Promise<StoredBusinessUnit | null> {
    const result = await query<StoredBusinessUnit>(
      `SELECT * FROM business_units WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async listBusinessUnitsByOrganization(organizationId: string): Promise<StoredBusinessUnit[]> {
    const result = await query<StoredBusinessUnit>(
      `SELECT * FROM business_units WHERE organization_id = $1 ORDER BY criticality_tier ASC, name ASC`,
      [organizationId]
    );
    return result.rows;
  }

  async listAllBusinessUnits(): Promise<StoredBusinessUnit[]> {
    const result = await query<StoredBusinessUnit>(
      `SELECT * FROM business_units ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async updateBusinessUnit(
    id: string,
    data: UpdateBusinessUnitRequest
  ): Promise<StoredBusinessUnit | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.criticality_tier !== undefined) {
      setClauses.push(`criticality_tier = $${paramIndex++}`);
      values.push(data.criticality_tier);
    }
    if (data.budget !== undefined) {
      setClauses.push(`budget = $${paramIndex++}`);
      values.push(data.budget);
    }
    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return this.findBusinessUnitById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<StoredBusinessUnit>(
      `UPDATE business_units SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows[0]) {
      logger.info('Business unit updated', { id });
    }

    return result.rows[0] || null;
  }

  async deleteBusinessUnit(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM business_units WHERE id = $1`,
      [id]
    );
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      logger.info('Business unit deleted', { id });
    }
    return deleted;
  }
}
