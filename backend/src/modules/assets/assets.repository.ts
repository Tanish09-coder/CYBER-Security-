// =============================================================================
// CyberRiskOS — Enterprise Asset Inventory Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query, withTransaction } from '../../db';
import {
  StoredAsset,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetQueryFilters,
} from './assets.types';
import { logger } from '../../config/logger';

export class AssetRepository {
  // ---------------------------------------------------------------------------
  // Asset CRUD
  // ---------------------------------------------------------------------------

  async createAsset(data: CreateAssetRequest): Promise<StoredAsset> {
    const result = await query<StoredAsset>(
      `INSERT INTO assets (
        organization_id, business_unit_id, asset_identifier, name, hostname,
        ip_address, mac_address, asset_type, operating_system, environment,
        owner, is_internet_facing, business_criticality, data_classification,
        revenue_dependency_pct, operational_importance, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.organization_id,
        data.business_unit_id || null,
        data.asset_identifier || null,
        data.name,
        data.hostname || null,
        data.ip_address || null,
        data.mac_address || null,
        data.asset_type || 'server',
        data.operating_system || null,
        data.environment || 'Production',
        data.owner || null,
        data.is_internet_facing !== undefined ? data.is_internet_facing : null,
        data.business_criticality !== undefined ? data.business_criticality : null,
        data.data_classification || 'Internal',
        data.revenue_dependency_pct ?? 0,
        data.operational_importance ?? 0,
        JSON.stringify(data.metadata || {}),
      ]
    );

    logger.info('Asset created', { id: result.rows[0].id, name: data.name, orgId: data.organization_id });
    return result.rows[0];
  }

  async findAssetById(id: string): Promise<StoredAsset | null> {
    const result = await query<StoredAsset>(
      `SELECT * FROM assets WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getAssetControls(assetId: string): Promise<Array<{ control_code: string; status: string; effectiveness_score: string; source: string }>> {
    const result = await query<any>(
      `SELECT control_code, status, effectiveness_score, source
       FROM asset_controls
       WHERE asset_id = $1`,
      [assetId]
    );
    return result.rows;
  }

  async findDuplicate(
    organizationId: string,
    identifiers: { hostname?: string | null; mac_address?: string | null; ip_address?: string | null },
    excludeId?: string
  ): Promise<StoredAsset | null> {
    const conditions: string[] = [];
    const values: any[] = [organizationId];
    let paramIndex = 2;

    if (identifiers.hostname) {
      conditions.push(`hostname = $${paramIndex++}`);
      values.push(identifiers.hostname);
    }
    if (identifiers.mac_address) {
      conditions.push(`mac_address = $${paramIndex++}`);
      values.push(identifiers.mac_address);
    }
    if (identifiers.ip_address) {
      conditions.push(`ip_address = $${paramIndex++}`);
      values.push(identifiers.ip_address);
    }

    if (conditions.length === 0) {
      return null;
    }

    let sql = `SELECT * FROM assets WHERE organization_id = $1 AND (${conditions.join(' OR ')})`;
    if (excludeId) {
      sql += ` AND id != $${paramIndex++}`;
      values.push(excludeId);
    }
    sql += ` LIMIT 1`;

    const result = await query<StoredAsset>(sql, values);
    return result.rows[0] || null;
  }

  async listAssets(filters: AssetQueryFilters): Promise<{ assets: StoredAsset[]; total: number }> {
    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters.organizationId) {
      whereClauses.push(`organization_id = $${paramIdx++}`);
      values.push(filters.organizationId);
    }
    if (filters.businessUnitId) {
      whereClauses.push(`business_unit_id = $${paramIdx++}`);
      values.push(filters.businessUnitId);
    }
    if (filters.assetType) {
      whereClauses.push(`asset_type = $${paramIdx++}`);
      values.push(filters.assetType);
    }
    if (filters.isInternetFacing !== undefined) {
      whereClauses.push(`is_internet_facing = $${paramIdx++}`);
      values.push(filters.isInternetFacing);
    }
    if (filters.businessCriticality !== undefined) {
      whereClauses.push(`business_criticality = $${paramIdx++}`);
      values.push(filters.businessCriticality);
    }
    if (filters.dataClassification) {
      whereClauses.push(`data_classification = $${paramIdx++}`);
      values.push(filters.dataClassification);
    }
    if (filters.search) {
      whereClauses.push(`(name ILIKE $${paramIdx} OR hostname ILIKE $${paramIdx} OR ip_address ILIKE $${paramIdx} OR asset_identifier ILIKE $${paramIdx})`);
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM assets ${whereSql}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const dataValues = [...values, limit, offset];
    const dataSql = `SELECT * FROM assets ${whereSql} ORDER BY business_criticality ASC, created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;

    const dataRes = await query<StoredAsset>(dataSql, dataValues);

    return {
      assets: dataRes.rows,
      total,
    };
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<StoredAsset | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.business_unit_id !== undefined) {
      setClauses.push(`business_unit_id = $${paramIndex++}`);
      values.push(data.business_unit_id);
    }
    if (data.asset_identifier !== undefined) {
      setClauses.push(`asset_identifier = $${paramIndex++}`);
      values.push(data.asset_identifier);
    }
    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.hostname !== undefined) {
      setClauses.push(`hostname = $${paramIndex++}`);
      values.push(data.hostname);
    }
    if (data.ip_address !== undefined) {
      setClauses.push(`ip_address = $${paramIndex++}`);
      values.push(data.ip_address);
    }
    if (data.mac_address !== undefined) {
      setClauses.push(`mac_address = $${paramIndex++}`);
      values.push(data.mac_address);
    }
    if (data.asset_type !== undefined) {
      setClauses.push(`asset_type = $${paramIndex++}`);
      values.push(data.asset_type);
    }
    if (data.operating_system !== undefined) {
      setClauses.push(`operating_system = $${paramIndex++}`);
      values.push(data.operating_system);
    }
    if (data.environment !== undefined) {
      setClauses.push(`environment = $${paramIndex++}`);
      values.push(data.environment);
    }
    if (data.owner !== undefined) {
      setClauses.push(`owner = $${paramIndex++}`);
      values.push(data.owner);
    }
    if (data.is_internet_facing !== undefined) {
      setClauses.push(`is_internet_facing = $${paramIndex++}`);
      values.push(data.is_internet_facing);
    }
    if (data.business_criticality !== undefined) {
      setClauses.push(`business_criticality = $${paramIndex++}`);
      values.push(data.business_criticality);
    }
    if (data.data_classification !== undefined) {
      setClauses.push(`data_classification = $${paramIndex++}`);
      values.push(data.data_classification);
    }
    if (data.revenue_dependency_pct !== undefined) {
      setClauses.push(`revenue_dependency_pct = $${paramIndex++}`);
      values.push(data.revenue_dependency_pct);
    }
    if (data.operational_importance !== undefined) {
      setClauses.push(`operational_importance = $${paramIndex++}`);
      values.push(data.operational_importance);
    }
    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return this.findAssetById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<StoredAsset>(
      `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows[0]) {
      logger.info('Asset updated', { id });
    }

    return result.rows[0] || null;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM assets WHERE id = $1`,
      [id]
    );
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      logger.info('Asset deleted', { id });
    }
    return deleted;
  }
}
