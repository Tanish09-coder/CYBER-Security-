// =============================================================================
// CyberRiskOS — Software Inventory Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query, withTransaction } from '../../db';
import {
  StoredSoftware,
  RegisterSoftwareItem,
  UpdateSoftwareRequest,
  SoftwareQueryFilters,
} from './software.types';
import { logger } from '../../config/logger';

export class SoftwareRepository {
  async upsertSoftware(
    assetId: string,
    item: RegisterSoftwareItem
  ): Promise<StoredSoftware> {
    const result = await query<StoredSoftware>(
      `INSERT INTO installed_software (
        asset_id, vendor, product, version, release, cpe23, install_path, last_observed_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (asset_id, vendor, product, version)
      DO UPDATE SET
        release = EXCLUDED.release,
        cpe23 = COALESCE(EXCLUDED.cpe23, installed_software.cpe23),
        install_path = COALESCE(EXCLUDED.install_path, installed_software.install_path),
        last_observed_at = EXCLUDED.last_observed_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
      RETURNING *`,
      [
        assetId,
        item.vendor.toLowerCase().trim(),
        item.product.toLowerCase().trim(),
        item.version.trim(),
        item.release || null,
        item.cpe23 || null,
        item.install_path || null,
        item.last_observed_at ? new Date(item.last_observed_at) : new Date(),
        JSON.stringify(item.metadata || {}),
      ]
    );

    return result.rows[0];
  }

  async batchUpsertSoftware(
    assetId: string,
    items: RegisterSoftwareItem[]
  ): Promise<StoredSoftware[]> {
    return await withTransaction(async (client) => {
      const results: StoredSoftware[] = [];
      for (const item of items) {
        const res = await client.query(
          `INSERT INTO installed_software (
            asset_id, vendor, product, version, release, cpe23, install_path, last_observed_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (asset_id, vendor, product, version)
          DO UPDATE SET
            release = EXCLUDED.release,
            cpe23 = COALESCE(EXCLUDED.cpe23, installed_software.cpe23),
            install_path = COALESCE(EXCLUDED.install_path, installed_software.install_path),
            last_observed_at = EXCLUDED.last_observed_at,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING *`,
          [
            assetId,
            item.vendor.toLowerCase().trim(),
            item.product.toLowerCase().trim(),
            item.version.trim(),
            item.release || null,
            item.cpe23 || null,
            item.install_path || null,
            item.last_observed_at ? new Date(item.last_observed_at) : new Date(),
            JSON.stringify(item.metadata || {}),
          ]
        );
        results.push(res.rows[0]);
      }
      return results;
    });
  }

  async findSoftwareById(id: string): Promise<StoredSoftware | null> {
    const result = await query<StoredSoftware>(
      `SELECT * FROM installed_software WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async listSoftwareByAsset(
    assetId: string,
    filters: SoftwareQueryFilters
  ): Promise<{ data: StoredSoftware[]; total: number }> {
    const whereClauses: string[] = ['asset_id = $1'];
    const values: any[] = [assetId];
    let paramIdx = 2;

    if (filters.vendor) {
      whereClauses.push(`vendor = $${paramIdx++}`);
      values.push(filters.vendor.toLowerCase().trim());
    }
    if (filters.product) {
      whereClauses.push(`product = $${paramIdx++}`);
      values.push(filters.product.toLowerCase().trim());
    }
    if (filters.search) {
      whereClauses.push(`(vendor ILIKE $${paramIdx} OR product ILIKE $${paramIdx} OR version ILIKE $${paramIdx})`);
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Count
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM installed_software ${whereSql}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const dataValues = [...values, limit, offset];
    const dataSql = `SELECT * FROM installed_software ${whereSql} ORDER BY vendor ASC, product ASC, version ASC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;

    const dataRes = await query<StoredSoftware>(dataSql, dataValues);

    return {
      data: dataRes.rows,
      total,
    };
  }

  async updateSoftware(id: string, data: UpdateSoftwareRequest): Promise<StoredSoftware | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.vendor !== undefined) {
      setClauses.push(`vendor = $${paramIndex++}`);
      values.push(data.vendor);
    }
    if (data.product !== undefined) {
      setClauses.push(`product = $${paramIndex++}`);
      values.push(data.product);
    }
    if (data.version !== undefined) {
      setClauses.push(`version = $${paramIndex++}`);
      values.push(data.version);
    }
    if (data.release !== undefined) {
      setClauses.push(`release = $${paramIndex++}`);
      values.push(data.release);
    }
    if (data.cpe23 !== undefined) {
      setClauses.push(`cpe23 = $${paramIndex++}`);
      values.push(data.cpe23);
    }
    if (data.install_path !== undefined) {
      setClauses.push(`install_path = $${paramIndex++}`);
      values.push(data.install_path);
    }
    if (data.last_observed_at !== undefined) {
      setClauses.push(`last_observed_at = $${paramIndex++}`);
      values.push(new Date(data.last_observed_at));
    }
    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return this.findSoftwareById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<StoredSoftware>(
      `UPDATE installed_software SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteSoftware(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM installed_software WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteSoftwareByAsset(assetId: string): Promise<number> {
    const result = await query(
      `DELETE FROM installed_software WHERE asset_id = $1`,
      [assetId]
    );
    return result.rowCount ?? 0;
  }
}
