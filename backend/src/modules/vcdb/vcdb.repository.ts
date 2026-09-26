import { query, withTransaction } from '../../db';
import {
  NormalizedVcdbIncident,
  StoredVcdbIncident,
  StoredVcdbRelease,
  IncidentsFilter,
  VcdbStatistics,
} from './vcdb.types';
import { logger } from '../../config/logger';

export class VcdbRepository {
  async getOrCreateVcdbDataSource(): Promise<{ id: string; name: string; enabled: boolean }> {
    const res = await query(
      `SELECT id, name, enabled FROM data_sources WHERE name = 'VERIS Community Database' LIMIT 1`
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }

    const inserted = await query(
      `INSERT INTO data_sources (name, provider, data_type, base_url, enabled)
       VALUES ('VERIS Community Database', 'vz-risk / VERIS Community', 'PUBLIC_INCIDENT_INTELLIGENCE', 'https://github.com/vz-risk/VCDB', TRUE)
       RETURNING id, name, enabled`
    );
    return inserted.rows[0];
  }

  async createRelease(data: {
    repositoryUrl?: string;
    commitSha?: string;
    verisVersion?: string;
    bundleHash: string;
    totalIncidents: number;
  }): Promise<StoredVcdbRelease> {
    const res = await query(
      `INSERT INTO vcdb_releases (repository_url, commit_sha, veris_version, bundle_hash, total_incidents, is_current)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [
        data.repositoryUrl || 'https://github.com/vz-risk/VCDB',
        data.commitSha || null,
        data.verisVersion || null,
        data.bundleHash,
        data.totalIncidents,
      ]
    );
    return this.mapReleaseRow(res.rows[0]);
  }

  async markReleaseCurrent(releaseId: string): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE vcdb_releases SET is_current = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id != $1`,
        [releaseId]
      );
      await client.query(
        `UPDATE vcdb_releases SET is_current = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [releaseId]
      );
    });
  }

  async getCurrentRelease(): Promise<StoredVcdbRelease | null> {
    const res = await query(`SELECT * FROM vcdb_releases WHERE is_current = TRUE LIMIT 1`);
    return res.rows.length > 0 ? this.mapReleaseRow(res.rows[0]) : null;
  }

  async findReleaseByHash(hash: string): Promise<StoredVcdbRelease | null> {
    const res = await query(
      `SELECT * FROM vcdb_releases WHERE bundle_hash = $1 ORDER BY created_at DESC LIMIT 1`,
      [hash]
    );
    return res.rows.length > 0 ? this.mapReleaseRow(res.rows[0]) : null;
  }

  async upsertIncidents(
    incidents: NormalizedVcdbIncident[],
    rawRecordId?: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    if (!incidents || incidents.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    // Fetch existing records for fast deduplication & idempotency
    const existingRes = await query(`SELECT id, vcdb_id, payload_hash, is_current FROM vcdb_incidents`);
    const existingMap = new Map<string, { id: string; payloadHash: string; isCurrent: boolean }>();
    for (const r of existingRes.rows) {
      existingMap.set(r.vcdb_id, {
        id: r.id,
        payloadHash: r.payload_hash,
        isCurrent: Boolean(r.is_current),
      });
    }

    // In-memory deduplication of input array by vcdbId (preserving last occurrence)
    const uniqueIncidentsMap = new Map<string, NormalizedVcdbIncident>();
    for (const inc of incidents) {
      uniqueIncidentsMap.set(inc.vcdbId, inc);
    }
    const uniqueIncidents = Array.from(uniqueIncidentsMap.values());

    for (const inc of uniqueIncidents) {
      const existing = existingMap.get(inc.vcdbId);

      if (!existing) {
        // Insert or update incident atomically
        const incRes = await query(
          `INSERT INTO vcdb_incidents (
             vcdb_id, source_record_id, source_file_path, incident_year, security_incident,
             confidence, summary, victim_country, victim_industry, employee_count,
             data_disclosure, discovery_method, schema_version, raw_record, payload_hash,
             is_current, first_seen_at, last_seen_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (vcdb_id) DO UPDATE SET
             source_record_id = EXCLUDED.source_record_id,
             source_file_path = EXCLUDED.source_file_path,
             incident_year = EXCLUDED.incident_year,
             security_incident = EXCLUDED.security_incident,
             confidence = EXCLUDED.confidence,
             summary = EXCLUDED.summary,
             victim_country = EXCLUDED.victim_country,
             victim_industry = EXCLUDED.victim_industry,
             employee_count = EXCLUDED.employee_count,
             data_disclosure = EXCLUDED.data_disclosure,
             discovery_method = EXCLUDED.discovery_method,
             schema_version = EXCLUDED.schema_version,
             raw_record = EXCLUDED.raw_record,
             payload_hash = EXCLUDED.payload_hash,
             last_seen_at = CURRENT_TIMESTAMP,
             is_current = TRUE,
             updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            inc.vcdbId,
            rawRecordId || null,
            inc.sourceFilePath || null,
            inc.incidentYear || null,
            inc.securityIncident || null,
            inc.confidence || null,
            inc.summary || null,
            inc.victimCountry || null,
            inc.victimIndustry || null,
            inc.employeeCount || null,
            inc.dataDisclosure || null,
            inc.discoveryMethod || null,
            inc.schemaVersion || null,
            inc.rawRecord ? JSON.stringify(inc.rawRecord) : null,
            inc.payloadHash,
          ]
        );

        const incidentId = incRes.rows[0].id;
        // Clean dimensions before re-inserting
        await query(`DELETE FROM vcdb_incident_actors WHERE incident_id = $1`, [incidentId]);
        await query(`DELETE FROM vcdb_incident_actions WHERE incident_id = $1`, [incidentId]);
        await query(`DELETE FROM vcdb_incident_assets WHERE incident_id = $1`, [incidentId]);
        await query(`DELETE FROM vcdb_incident_attributes WHERE incident_id = $1`, [incidentId]);
        await query(`DELETE FROM vcdb_incident_timeline WHERE incident_id = $1`, [incidentId]);
        await query(`DELETE FROM vcdb_incident_cves WHERE incident_id = $1`, [incidentId]);

        await this.insertDimensions(incidentId, inc);
        existingMap.set(inc.vcdbId, { id: incidentId, payloadHash: inc.payloadHash, isCurrent: true });
        inserted++;
      } else if (existing.payloadHash !== inc.payloadHash || !existing.isCurrent) {
        // Update changed or previously removed incident
        await query(
          `UPDATE vcdb_incidents
           SET source_record_id = $2, source_file_path = $3, incident_year = $4,
               security_incident = $5, confidence = $6, summary = $7, victim_country = $8,
               victim_industry = $9, employee_count = $10, data_disclosure = $11,
               discovery_method = $12, schema_version = $13, raw_record = $14,
               payload_hash = $15, last_seen_at = CURRENT_TIMESTAMP, is_current = TRUE,
               removed_from_source_at = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [
            existing.id,
            rawRecordId || null,
            inc.sourceFilePath || null,
            inc.incidentYear || null,
            inc.securityIncident || null,
            inc.confidence || null,
            inc.summary || null,
            inc.victimCountry || null,
            inc.victimIndustry || null,
            inc.employeeCount || null,
            inc.dataDisclosure || null,
            inc.discoveryMethod || null,
            inc.schemaVersion || null,
            inc.rawRecord ? JSON.stringify(inc.rawRecord) : null,
            inc.payloadHash,
          ]
        );

        // Refresh dimensions
        await query(`DELETE FROM vcdb_incident_actors WHERE incident_id = $1`, [existing.id]);
        await query(`DELETE FROM vcdb_incident_actions WHERE incident_id = $1`, [existing.id]);
        await query(`DELETE FROM vcdb_incident_assets WHERE incident_id = $1`, [existing.id]);
        await query(`DELETE FROM vcdb_incident_attributes WHERE incident_id = $1`, [existing.id]);
        await query(`DELETE FROM vcdb_incident_timeline WHERE incident_id = $1`, [existing.id]);
        await query(`DELETE FROM vcdb_incident_cves WHERE incident_id = $1`, [existing.id]);

        await this.insertDimensions(existing.id, inc);
        updated++;
      } else {
        // Touch last_seen_at for unchanged existing incident
        await query(
          `UPDATE vcdb_incidents SET last_seen_at = CURRENT_TIMESTAMP, is_current = TRUE WHERE id = $1`,
          [existing.id]
        );
        skipped++;
      }
    }

    return { inserted, updated, skipped };
  }

  private async insertDimensions(incidentId: string, inc: NormalizedVcdbIncident): Promise<void> {
    // 1. Actors
    for (const actor of inc.actors) {
      await query(
        `INSERT INTO vcdb_incident_actors (incident_id, actor_category, actor_subtype, motive, country, source_path)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          incidentId,
          actor.actorCategory,
          actor.actorSubtype || null,
          actor.motive || null,
          actor.country || null,
          actor.sourcePath || null,
        ]
      );
    }

    // 2. Actions
    for (const action of inc.actions) {
      await query(
        `INSERT INTO vcdb_incident_actions (incident_id, action_category, action_subtype, vector, variety)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          incidentId,
          action.actionCategory,
          action.actionSubtype || null,
          action.vector || null,
          action.variety || null,
        ]
      );
    }

    // 3. Assets
    for (const asset of inc.assets) {
      await query(
        `INSERT INTO vcdb_incident_assets (incident_id, asset_category, asset_variety, amount)
         VALUES ($1, $2, $3, $4)`,
        [
          incidentId,
          asset.assetCategory,
          asset.assetVariety || null,
          asset.amount || null,
        ]
      );
    }

    // 4. Attributes
    for (const attr of inc.attributes) {
      await query(
        `INSERT INTO vcdb_incident_attributes (incident_id, attribute_category, variety, data_variety, record_count)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          incidentId,
          attr.attributeCategory,
          attr.variety || null,
          attr.dataVariety || null,
          attr.recordCount || null,
        ]
      );
    }

    // 5. Timeline
    if (inc.timeline) {
      const t = inc.timeline;
      await query(
        `INSERT INTO vcdb_incident_timeline (
           incident_id, incident_year, incident_month, incident_day,
           compromise_unit, compromise_value, discovery_unit, discovery_value,
           containment_unit, containment_value, exfiltration_unit, exfiltration_value
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (incident_id) DO UPDATE SET
           incident_year = EXCLUDED.incident_year,
           incident_month = EXCLUDED.incident_month,
           incident_day = EXCLUDED.incident_day,
           compromise_unit = EXCLUDED.compromise_unit,
           compromise_value = EXCLUDED.compromise_value,
           discovery_unit = EXCLUDED.discovery_unit,
           discovery_value = EXCLUDED.discovery_value,
           containment_unit = EXCLUDED.containment_unit,
           containment_value = EXCLUDED.containment_value,
           exfiltration_unit = EXCLUDED.exfiltration_unit,
           exfiltration_value = EXCLUDED.exfiltration_value,
           updated_at = CURRENT_TIMESTAMP`,
        [
          incidentId,
          t.incidentYear || null,
          t.incidentMonth || null,
          t.incidentDay || null,
          t.compromiseUnit || null,
          t.compromiseValue || null,
          t.discoveryUnit || null,
          t.discoveryValue || null,
          t.containmentUnit || null,
          t.containmentValue || null,
          t.exfiltrationUnit || null,
          t.exfiltrationValue || null,
        ]
      );
    }

    // 6. Explicit CVE Evidence
    for (const cve of inc.explicitCves) {
      await query(
        `INSERT INTO vcdb_incident_cves (incident_id, cve_id, evidence_source, source_path)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (incident_id, cve_id, evidence_source) DO NOTHING`,
        [incidentId, cve.cveId, cve.evidenceSource, cve.sourcePath || null]
      );
    }
  }

  /**
   * Non-destructive reconciliation: Flags incidents missing from the current complete snapshot as
   * is_current = FALSE and sets removed_from_source_at = NOW(). Never deletes historical rows.
   */
  async reconcileRemovedIncidents(currentSnapshotVcdbIds: Set<string>): Promise<number> {
    const allCurrentRes = await query(`SELECT id, vcdb_id FROM vcdb_incidents WHERE is_current = TRUE`);
    let removedCount = 0;

    for (const row of allCurrentRes.rows) {
      if (!currentSnapshotVcdbIds.has(row.vcdb_id)) {
        await query(
          `UPDATE vcdb_incidents
           SET is_current = FALSE, removed_from_source_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [row.id]
        );
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Reconciled ${removedCount} VCDB incidents missing from current upstream snapshot (marked non-current)`);
    }

    return removedCount;
  }

  // ---------------------------------------------------------------------------
  // Queries & API Access
  // ---------------------------------------------------------------------------
  async getIncidents(
    filter: IncidentsFilter
  ): Promise<{ incidents: StoredVcdbIncident[]; total: number; page: number; limit: number; hasNext: boolean }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let joinClause = '';

    if (!filter.includeRemoved) {
      conditions.push('inc.is_current = TRUE');
    }

    if (filter.year) {
      params.push(filter.year);
      conditions.push(`inc.incident_year = $${params.length}`);
    }

    if (filter.country) {
      params.push(`%${filter.country}%`);
      conditions.push(`inc.victim_country ILIKE $${params.length}`);
    }

    if (filter.industry) {
      params.push(`%${filter.industry}%`);
      conditions.push(`inc.victim_industry ILIKE $${params.length}`);
    }

    if (filter.confidence) {
      params.push(filter.confidence);
      conditions.push(`inc.confidence = $${params.length}`);
    }

    if (filter.securityIncident) {
      params.push(filter.securityIncident);
      conditions.push(`inc.security_incident = $${params.length}`);
    }

    if (filter.actor) {
      params.push(`%${filter.actor}%`);
      joinClause += ` JOIN vcdb_incident_actors act ON inc.id = act.incident_id`;
      conditions.push(`act.actor_category ILIKE $${params.length}`);
    }

    if (filter.action) {
      params.push(`%${filter.action}%`);
      joinClause += ` JOIN vcdb_incident_actions actn ON inc.id = actn.incident_id`;
      conditions.push(`actn.action_category ILIKE $${params.length}`);
    }

    if (filter.asset) {
      params.push(`%${filter.asset}%`);
      joinClause += ` JOIN vcdb_incident_assets ast ON inc.id = ast.incident_id`;
      conditions.push(`ast.asset_category ILIKE $${params.length}`);
    }

    if (filter.attribute) {
      params.push(`%${filter.attribute}%`);
      joinClause += ` JOIN vcdb_incident_attributes attr ON inc.id = attr.incident_id`;
      conditions.push(`attr.attribute_category ILIKE $${params.length}`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(inc.vcdb_id ILIKE $${params.length} OR inc.summary ILIKE $${params.length} OR inc.victim_country ILIKE $${params.length} OR inc.victim_industry ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(DISTINCT inc.id) as total FROM vcdb_incidents inc ${joinClause} ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataRes = await query(
      `SELECT DISTINCT inc.* FROM vcdb_incidents inc ${joinClause} ${whereClause} ORDER BY inc.incident_year DESC, inc.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const incidents = dataRes.rows.map((r) => this.mapIncidentRow(r));
    const hasNext = offset + incidents.length < total;

    return {
      incidents,
      total,
      page,
      limit,
      hasNext,
    };
  }

  async getIncidentByVcdbId(
    vcdbId: string
  ): Promise<{
    incident: StoredVcdbIncident;
    actors: any[];
    actions: any[];
    assets: any[];
    attributes: any[];
    timeline: any | null;
    explicitCves: any[];
  } | null> {
    const res = await query(
      `SELECT * FROM vcdb_incidents WHERE UPPER(vcdb_id) = UPPER($1) ORDER BY is_current DESC LIMIT 1`,
      [vcdbId]
    );

    if (res.rows.length === 0) return null;
    const incident = this.mapIncidentRow(res.rows[0]);

    const [actRes, actnRes, astRes, attrRes, timeRes, cveRes] = await Promise.all([
      query(`SELECT * FROM vcdb_incident_actors WHERE incident_id = $1`, [incident.id]),
      query(`SELECT * FROM vcdb_incident_actions WHERE incident_id = $1`, [incident.id]),
      query(`SELECT * FROM vcdb_incident_assets WHERE incident_id = $1`, [incident.id]),
      query(`SELECT * FROM vcdb_incident_attributes WHERE incident_id = $1`, [incident.id]),
      query(`SELECT * FROM vcdb_incident_timeline WHERE incident_id = $1 LIMIT 1`, [incident.id]),
      query(`SELECT * FROM vcdb_incident_cves WHERE incident_id = $1`, [incident.id]),
    ]);

    return {
      incident,
      actors: actRes.rows,
      actions: actnRes.rows,
      assets: astRes.rows,
      attributes: attrRes.rows,
      timeline: timeRes.rows.length > 0 ? timeRes.rows[0] : null,
      explicitCves: cveRes.rows,
    };
  }

  async getStatistics(): Promise<VcdbStatistics> {
    const [yrRes, actRes, actnRes, astRes, attrRes, indRes, cntryRes] = await Promise.all([
      query(`SELECT incident_year as year, COUNT(*) as count FROM vcdb_incidents WHERE is_current = TRUE AND incident_year IS NOT NULL GROUP BY incident_year ORDER BY incident_year DESC LIMIT 20`),
      query(`SELECT actor_category as category, COUNT(*) as count FROM vcdb_incident_actors WHERE actor_category IS NOT NULL GROUP BY actor_category ORDER BY count DESC`),
      query(`SELECT action_category as category, COUNT(*) as count FROM vcdb_incident_actions WHERE action_category IS NOT NULL GROUP BY action_category ORDER BY count DESC`),
      query(`SELECT asset_category as category, COUNT(*) as count FROM vcdb_incident_assets WHERE asset_category IS NOT NULL GROUP BY asset_category ORDER BY count DESC`),
      query(`SELECT attribute_category as category, COUNT(*) as count FROM vcdb_incident_attributes WHERE attribute_category IS NOT NULL GROUP BY attribute_category ORDER BY count DESC`),
      query(`SELECT victim_industry as industry, COUNT(*) as count FROM vcdb_incidents WHERE is_current = TRUE AND victim_industry IS NOT NULL GROUP BY victim_industry ORDER BY count DESC LIMIT 15`),
      query(`SELECT victim_country as country, COUNT(*) as count FROM vcdb_incidents WHERE is_current = TRUE AND victim_country IS NOT NULL GROUP BY victim_country ORDER BY count DESC LIMIT 15`),
    ]);

    return {
      byYear: yrRes.rows.map((r) => ({ year: parseInt(r.year, 10), count: parseInt(r.count, 10) })),
      byActorCategory: actRes.rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
      byActionCategory: actnRes.rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
      byAssetCategory: astRes.rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
      byAttributeCategory: attrRes.rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) })),
      byIndustry: indRes.rows.map((r) => ({ industry: r.industry, count: parseInt(r.count, 10) })),
      byCountry: cntryRes.rows.map((r) => ({ country: r.country, count: parseInt(r.count, 10) })),
    };
  }

  async getEntityCounts(): Promise<{
    incidents: number;
    activeIncidents: number;
    actors: number;
    actions: number;
    assets: number;
    attributes: number;
    explicitCveLinks: number;
  }> {
    const [incRes, actIncRes, actRes, actnRes, astRes, attrRes, cveRes] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM vcdb_incidents`),
      query(`SELECT COUNT(*) as total FROM vcdb_incidents WHERE is_current = TRUE`),
      query(`SELECT COUNT(*) as total FROM vcdb_incident_actors`),
      query(`SELECT COUNT(*) as total FROM vcdb_incident_actions`),
      query(`SELECT COUNT(*) as total FROM vcdb_incident_assets`),
      query(`SELECT COUNT(*) as total FROM vcdb_incident_attributes`),
      query(`SELECT COUNT(*) as total FROM vcdb_incident_cves`),
    ]);

    return {
      incidents: parseInt(incRes.rows[0]?.total || '0', 10),
      activeIncidents: parseInt(actIncRes.rows[0]?.total || '0', 10),
      actors: parseInt(actRes.rows[0]?.total || '0', 10),
      actions: parseInt(actnRes.rows[0]?.total || '0', 10),
      assets: parseInt(astRes.rows[0]?.total || '0', 10),
      attributes: parseInt(attrRes.rows[0]?.total || '0', 10),
      explicitCveLinks: parseInt(cveRes.rows[0]?.total || '0', 10),
    };
  }

  private mapReleaseRow(r: any): StoredVcdbRelease {
    return {
      id: r.id,
      repositoryUrl: r.repository_url,
      commitSha: r.commit_sha || undefined,
      verisVersion: r.veris_version || undefined,
      bundleHash: r.bundle_hash,
      totalIncidents: r.total_incidents,
      retrievedAt: r.retrieved_at ? new Date(r.retrieved_at).toISOString() : new Date().toISOString(),
      isCurrent: Boolean(r.is_current),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  private mapIncidentRow(r: any): StoredVcdbIncident {
    return {
      id: r.id,
      vcdbId: r.vcdb_id,
      sourceRecordId: r.source_record_id || undefined,
      sourceFilePath: r.source_file_path || undefined,
      incidentYear: r.incident_year != null ? parseInt(r.incident_year, 10) : undefined,
      securityIncident: r.security_incident || undefined,
      confidence: r.confidence || undefined,
      summary: r.summary || undefined,
      victimCountry: r.victim_country || undefined,
      victimIndustry: r.victim_industry || undefined,
      employeeCount: r.employee_count || undefined,
      dataDisclosure: r.data_disclosure || undefined,
      discoveryMethod: r.discovery_method || undefined,
      schemaVersion: r.schema_version || undefined,
      rawRecord: typeof r.raw_record === 'string' ? JSON.parse(r.raw_record) : r.raw_record,
      payloadHash: r.payload_hash,
      firstSeenAt: r.first_seen_at ? new Date(r.first_seen_at).toISOString() : new Date().toISOString(),
      lastSeenAt: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : new Date().toISOString(),
      removedFromSourceAt: r.removed_from_source_at ? new Date(r.removed_from_source_at).toISOString() : undefined,
      isCurrent: Boolean(r.is_current),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    };
  }
}
