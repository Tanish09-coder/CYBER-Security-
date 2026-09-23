// =============================================================================
// CyberRiskOS — Security Controls Repository
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { query, withTransaction } from '../../db';
import {
  StoredSecurityControl,
  StoredAssetControl,
  SetAssetControlItem,
  UpdateAssetControlRequest,
  ControlCoverageItem,
} from './controls.types';

export class ControlsRepository {
  // ---------------------------------------------------------------------------
  // Security Controls Catalog
  // ---------------------------------------------------------------------------

  async listCatalogControls(): Promise<StoredSecurityControl[]> {
    const result = await query<StoredSecurityControl>(
      `SELECT * FROM security_controls ORDER BY category ASC, code ASC`
    );
    return result.rows;
  }

  async findControlByCode(code: string): Promise<StoredSecurityControl | null> {
    const result = await query<StoredSecurityControl>(
      `SELECT * FROM security_controls WHERE code = $1`,
      [code.toUpperCase().trim()]
    );
    return result.rows[0] || null;
  }

  async findControlById(id: string): Promise<StoredSecurityControl | null> {
    const result = await query<StoredSecurityControl>(
      `SELECT * FROM security_controls WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // ---------------------------------------------------------------------------
  // Asset Control Posture
  // ---------------------------------------------------------------------------

  async upsertAssetControl(
    assetId: string,
    control: StoredSecurityControl,
    item: SetAssetControlItem
  ): Promise<StoredAssetControl & { control_name: string; control_category: string }> {
    // Determine effectiveness score based on status if not explicitly provided
    let effectiveness = item.effectiveness_score;
    if (effectiveness === undefined) {
      if (item.status === 'IMPLEMENTED') effectiveness = parseFloat(control.default_mitigation_weight || '0.80');
      else if (item.status === 'PARTIAL') effectiveness = parseFloat(control.default_mitigation_weight || '0.80') * 0.5;
      else effectiveness = 0.0;
    }

    const result = await query<StoredAssetControl>(
      `INSERT INTO asset_controls (
        asset_id, control_id, control_code, status, effectiveness_score, source, notes, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (asset_id, control_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        effectiveness_score = EXCLUDED.effectiveness_score,
        source = EXCLUDED.source,
        notes = COALESCE(EXCLUDED.notes, asset_controls.notes),
        metadata = EXCLUDED.metadata,
        last_verified_at = NOW(),
        updated_at = NOW()
      RETURNING *`,
      [
        assetId,
        control.id,
        control.code,
        item.status,
        effectiveness,
        item.source || 'USER_CONFIG',
        item.notes || null,
        JSON.stringify(item.metadata || {}),
      ]
    );

    return {
      ...result.rows[0],
      control_name: control.name,
      control_category: control.category,
    };
  }

  async listControlsByAsset(
    assetId: string
  ): Promise<(StoredAssetControl & { control_name: string; control_category: string })[]> {
    const result = await query<StoredAssetControl & { control_name: string; control_category: string }>(
      `SELECT
        ac.*,
        sc.name AS control_name,
        sc.category AS control_category
       FROM asset_controls ac
       JOIN security_controls sc ON ac.control_id = sc.id
       WHERE ac.asset_id = $1
       ORDER BY sc.category ASC, sc.code ASC`,
      [assetId]
    );
    return result.rows;
  }

  async findAssetControl(
    assetId: string,
    controlCode: string
  ): Promise<(StoredAssetControl & { control_name: string; control_category: string }) | null> {
    const result = await query<StoredAssetControl & { control_name: string; control_category: string }>(
      `SELECT
        ac.*,
        sc.name AS control_name,
        sc.category AS control_category
       FROM asset_controls ac
       JOIN security_controls sc ON ac.control_id = sc.id
       WHERE ac.asset_id = $1 AND ac.control_code = $2`,
      [assetId, controlCode.toUpperCase().trim()]
    );
    return result.rows[0] || null;
  }

  async updateAssetControl(
    assetId: string,
    controlCode: string,
    data: UpdateAssetControlRequest
  ): Promise<(StoredAssetControl & { control_name: string; control_category: string }) | null> {
    const setClauses: string[] = [];
    const values: any[] = [assetId, controlCode.toUpperCase().trim()];
    let paramIndex = 3;

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.effectiveness_score !== undefined) {
      setClauses.push(`effectiveness_score = $${paramIndex++}`);
      values.push(data.effectiveness_score);
    }
    if (data.source !== undefined) {
      setClauses.push(`source = $${paramIndex++}`);
      values.push(data.source);
    }
    if (data.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }

    if (setClauses.length === 0) {
      return this.findAssetControl(assetId, controlCode);
    }

    setClauses.push(`last_verified_at = NOW()`);
    setClauses.push(`updated_at = NOW()`);

    const result = await query<StoredAssetControl>(
      `UPDATE asset_controls
       SET ${setClauses.join(', ')}
       WHERE asset_id = $1 AND control_code = $2
       RETURNING *`,
      values
    );

    if (!result.rows[0]) return null;

    const control = await this.findControlByCode(controlCode);
    return {
      ...result.rows[0],
      control_name: control?.name || '',
      control_category: control?.category || '',
    };
  }

  async deleteAssetControl(assetId: string, controlCode: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM asset_controls WHERE asset_id = $1 AND control_code = $2`,
      [assetId, controlCode.toUpperCase().trim()]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ---------------------------------------------------------------------------
  // Coverage Summary Aggregation
  // ---------------------------------------------------------------------------

  async getCoverageSummary(organizationId?: string): Promise<ControlCoverageItem[]> {
    const orgFilter = organizationId ? `JOIN assets a ON ac.asset_id = a.id WHERE a.organization_id = '${organizationId}'` : '';

    const sql = `
      SELECT
        sc.code,
        sc.name,
        sc.category,
        sc.default_mitigation_weight,
        COUNT(ac.id) AS total_assigned,
        COUNT(CASE WHEN ac.status = 'IMPLEMENTED' THEN 1 END) AS implemented_count,
        COUNT(CASE WHEN ac.status = 'PARTIAL' THEN 1 END) AS partial_count,
        COUNT(CASE WHEN ac.status = 'NOT_IMPLEMENTED' THEN 1 END) AS not_implemented_count,
        COUNT(CASE WHEN ac.status = 'UNKNOWN' THEN 1 END) AS unknown_count
      FROM security_controls sc
      LEFT JOIN asset_controls ac ON sc.id = ac.control_id
      ${orgFilter}
      GROUP BY sc.id, sc.code, sc.name, sc.category, sc.default_mitigation_weight
      ORDER BY sc.category ASC, sc.code ASC
    `;

    const result = await query(sql);

    return result.rows.map((row) => {
      const total = parseInt(row.total_assigned || '0', 10);
      const implemented = parseInt(row.implemented_count || '0', 10);
      const partial = parseInt(row.partial_count || '0', 10);
      const coverage = total > 0 ? Math.round(((implemented + partial * 0.5) / total) * 100) : 0;

      return {
        code: row.code,
        name: row.name,
        category: row.category,
        defaultMitigationWeight: parseFloat(row.default_mitigation_weight || '0.50'),
        totalAssetsAssigned: total,
        implementedCount: implemented,
        partialCount: partial,
        notImplementedCount: parseInt(row.not_implemented_count || '0', 10),
        unknownCount: parseInt(row.unknown_count || '0', 10),
        coveragePercentage: coverage,
      };
    });
  }
}
