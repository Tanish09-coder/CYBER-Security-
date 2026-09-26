import { query, withTransaction } from '../../db';
import {
  StoredMitreRelease,
  StoredMitreTactic,
  StoredMitreTechnique,
  StoredMitreMitigation,
  StoredMitreGroup,
  StoredMitreSoftware,
  StoredMitreRelationship,
  NormalizedMitreTactic,
  NormalizedMitreTechnique,
  NormalizedMitreMitigation,
  NormalizedMitreGroup,
  NormalizedMitreSoftware,
  NormalizedMitreRelationship,
  TacticsFilter,
  TechniquesFilter,
  GroupsFilter,
  SoftwareFilter,
  MitigationsFilter,
} from './mitre-attack.types';
import { DataSourceRecord } from '../ingestion/ingestion.types';
import { logger } from '../../config/logger';

export class MitreAttackRepository {
  async getOrCreateMitreDataSource(): Promise<DataSourceRecord> {
    const existing = await query<any>(
      `SELECT * FROM data_sources WHERE name = $1 AND provider = $2 LIMIT 1`,
      ['MITRE ATT&CK Enterprise', 'MITRE']
    );

    if (existing.rows.length > 0) {
      const r: any = existing.rows[0];
      return {
        id: r.id,
        name: r.name,
        provider: r.provider,
        baseUrl: r.base_url || r.baseUrl,
        dataType: r.data_type || r.dataType,
        enabled: r.enabled,
        lastSyncAt: r.last_sync_at || r.lastSyncAt,
        createdAt: r.created_at || r.createdAt,
        updatedAt: r.updated_at || r.updatedAt,
      };
    }

    const inserted = await query<any>(
      `INSERT INTO data_sources (name, provider, base_url, data_type, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        'MITRE ATT&CK Enterprise',
        'MITRE',
        'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
        'THREAT_KNOWLEDGE_BASE',
        true,
      ]
    );

    const r: any = inserted.rows[0];
    return {
      id: r.id,
      name: r.name,
      provider: r.provider,
      baseUrl: r.base_url || r.baseUrl,
      dataType: r.data_type || r.dataType,
      enabled: r.enabled,
      lastSyncAt: r.last_sync_at || r.lastSyncAt,
      createdAt: r.created_at || r.createdAt,
      updatedAt: r.updated_at || r.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Release Management
  // ---------------------------------------------------------------------------
  async findReleaseByHash(hash: string): Promise<StoredMitreRelease | null> {
    const res = await query(
      `SELECT * FROM mitre_attack_releases WHERE bundle_hash = $1 LIMIT 1`,
      [hash]
    );
    return res.rows.length > 0 ? this.mapReleaseRow(res.rows[0]) : null;
  }

  async getCurrentRelease(): Promise<StoredMitreRelease | null> {
    const res = await query(
      `SELECT * FROM mitre_attack_releases WHERE domain = 'enterprise-attack' AND is_current = TRUE LIMIT 1`
    );
    return res.rows.length > 0 ? this.mapReleaseRow(res.rows[0]) : null;
  }

  async createRelease(data: {
    domain: string;
    attackVersion: string;
    releaseDate?: string;
    sourceUrl: string;
    sourceRecordId?: string;
    bundleHash: string;
  }): Promise<StoredMitreRelease> {
    const res = await query(
      `INSERT INTO mitre_attack_releases (
         domain, attack_version, release_date, source_url, source_record_id, bundle_hash, is_current
       )
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING *`,
      [
        data.domain,
        data.attackVersion,
        data.releaseDate || null,
        data.sourceUrl,
        data.sourceRecordId || null,
        data.bundleHash,
      ]
    );
    return this.mapReleaseRow(res.rows[0]);
  }

  async markReleaseCurrent(releaseId: string): Promise<void> {
    await withTransaction(async (client) => {
      // Set all other enterprise releases to is_current = FALSE
      await client.query(
        `UPDATE mitre_attack_releases
         SET is_current = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE domain = 'enterprise-attack' AND id != $1`,
        [releaseId]
      );

      // Set the target release to is_current = TRUE
      await client.query(
        `UPDATE mitre_attack_releases
         SET is_current = TRUE, last_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [releaseId]
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Upsert Methods
  // ---------------------------------------------------------------------------
  async upsertTactics(
    tactics: NormalizedMitreTactic[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const t of tactics) {
      const existing = await query(
        `SELECT id, modified, name, description, revoked, deprecated FROM mitre_attack_tactics WHERE stix_id = $1`,
        [t.stixId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO mitre_attack_tactics (
             stix_id, attack_id, name, description, short_name, created, modified,
             revoked, deprecated, source_created_by_ref, current_release_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            t.stixId,
            t.attackId,
            t.name,
            t.description || null,
            t.shortName || null,
            t.created || null,
            t.modified || null,
            t.revoked,
            t.deprecated,
            t.sourceCreatedByRef || null,
            releaseId,
          ]
        );
        inserted++;
      } else {
        const row = existing.rows[0];
        const isModified =
          row.name !== t.name ||
          row.description !== (t.description || null) ||
          row.revoked !== t.revoked ||
          row.deprecated !== t.deprecated;

        if (isModified) {
          await query(
            `UPDATE mitre_attack_tactics
             SET attack_id = $2, name = $3, description = $4, short_name = $5,
                 modified = $6, revoked = $7, deprecated = $8,
                 current_release_id = $9, updated_at = CURRENT_TIMESTAMP
             WHERE stix_id = $1`,
            [
              t.stixId,
              t.attackId,
              t.name,
              t.description || null,
              t.shortName || null,
              t.modified || null,
              t.revoked,
              t.deprecated,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { inserted, updated, skipped };
  }

  async upsertTechniques(
    techniques: NormalizedMitreTechnique[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const t of techniques) {
      const existing = await query(
        `SELECT id, name, description, revoked, deprecated FROM mitre_attack_techniques WHERE stix_id = $1`,
        [t.stixId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO mitre_attack_techniques (
             stix_id, attack_id, name, description, is_subtechnique,
             parent_attack_id, parent_stix_id, platforms, kill_chain_phases,
             permissions_required, effective_permissions, defense_bypassed,
             data_sources, created, modified, revoked, deprecated, current_release_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            t.stixId,
            t.attackId,
            t.name,
            t.description || null,
            t.isSubtechnique,
            t.parentAttackId || null,
            t.parentStixId || null,
            JSON.stringify(t.platforms),
            JSON.stringify(t.killChainPhases),
            t.permissionsRequired ? JSON.stringify(t.permissionsRequired) : null,
            t.effectivePermissions ? JSON.stringify(t.effectivePermissions) : null,
            t.defenseBypassed ? JSON.stringify(t.defenseBypassed) : null,
            t.dataSources ? JSON.stringify(t.dataSources) : null,
            t.created || null,
            t.modified || null,
            t.revoked,
            t.deprecated,
            releaseId,
          ]
        );
        inserted++;
      } else {
        const row = existing.rows[0];
        const isModified =
          row.name !== t.name ||
          row.description !== (t.description || null) ||
          row.revoked !== t.revoked ||
          row.deprecated !== t.deprecated;

        if (isModified) {
          await query(
            `UPDATE mitre_attack_techniques
             SET attack_id = $2, name = $3, description = $4, is_subtechnique = $5,
                 platforms = $6, kill_chain_phases = $7, permissions_required = $8,
                 effective_permissions = $9, defense_bypassed = $10, data_sources = $11,
                 modified = $12, revoked = $13, deprecated = $14,
                 current_release_id = $15, updated_at = CURRENT_TIMESTAMP
             WHERE stix_id = $1`,
            [
              t.stixId,
              t.attackId,
              t.name,
              t.description || null,
              t.isSubtechnique,
              JSON.stringify(t.platforms),
              JSON.stringify(t.killChainPhases),
              t.permissionsRequired ? JSON.stringify(t.permissionsRequired) : null,
              t.effectivePermissions ? JSON.stringify(t.effectivePermissions) : null,
              t.defenseBypassed ? JSON.stringify(t.defenseBypassed) : null,
              t.dataSources ? JSON.stringify(t.dataSources) : null,
              t.modified || null,
              t.revoked,
              t.deprecated,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { inserted, updated, skipped };
  }

  /**
   * Authoritatively updates parent references on sub-techniques from official subtechnique-of relationships.
   */
  async updateTechniqueParents(
    parentLinks: { subtechniqueStixId: string; parentStixId: string; parentAttackId: string }[]
  ): Promise<number> {
    let updated = 0;
    for (const link of parentLinks) {
      const res = await query(
        `UPDATE mitre_attack_techniques
         SET parent_stix_id = $2, parent_attack_id = $3, updated_at = CURRENT_TIMESTAMP
         WHERE stix_id = $1`,
        [link.subtechniqueStixId, link.parentStixId, link.parentAttackId]
      );
      if (res.rowCount && res.rowCount > 0) {
        updated++;
      }
    }
    return updated;
  }

  async upsertMitigations(
    mitigations: NormalizedMitreMitigation[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const m of mitigations) {
      const existing = await query(
        `SELECT id, name, description, revoked, deprecated FROM mitre_attack_mitigations WHERE stix_id = $1`,
        [m.stixId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO mitre_attack_mitigations (
             stix_id, attack_id, name, description, created, modified, revoked, deprecated, current_release_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            m.stixId,
            m.attackId,
            m.name,
            m.description || null,
            m.created || null,
            m.modified || null,
            m.revoked,
            m.deprecated,
            releaseId,
          ]
        );
        inserted++;
      } else {
        const row = existing.rows[0];
        const isModified =
          row.name !== m.name ||
          row.description !== (m.description || null) ||
          row.revoked !== m.revoked ||
          row.deprecated !== m.deprecated;

        if (isModified) {
          await query(
            `UPDATE mitre_attack_mitigations
             SET attack_id = $2, name = $3, description = $4, modified = $5,
                 revoked = $6, deprecated = $7, current_release_id = $8, updated_at = CURRENT_TIMESTAMP
             WHERE stix_id = $1`,
            [
              m.stixId,
              m.attackId,
              m.name,
              m.description || null,
              m.modified || null,
              m.revoked,
              m.deprecated,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { inserted, updated, skipped };
  }

  async upsertGroups(
    groups: NormalizedMitreGroup[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const g of groups) {
      const existing = await query(
        `SELECT id, name, description, revoked, deprecated FROM mitre_attack_groups WHERE stix_id = $1`,
        [g.stixId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO mitre_attack_groups (
             stix_id, attack_id, name, description, aliases, created, modified, revoked, deprecated, current_release_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            g.stixId,
            g.attackId,
            g.name,
            g.description || null,
            JSON.stringify(g.aliases),
            g.created || null,
            g.modified || null,
            g.revoked,
            g.deprecated,
            releaseId,
          ]
        );
        inserted++;
      } else {
        const row = existing.rows[0];
        const isModified =
          row.name !== g.name ||
          row.description !== (g.description || null) ||
          row.revoked !== g.revoked ||
          row.deprecated !== g.deprecated;

        if (isModified) {
          await query(
            `UPDATE mitre_attack_groups
             SET attack_id = $2, name = $3, description = $4, aliases = $5, modified = $6,
                 revoked = $7, deprecated = $8, current_release_id = $9, updated_at = CURRENT_TIMESTAMP
             WHERE stix_id = $1`,
            [
              g.stixId,
              g.attackId,
              g.name,
              g.description || null,
              JSON.stringify(g.aliases),
              g.modified || null,
              g.revoked,
              g.deprecated,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { inserted, updated, skipped };
  }

  async upsertSoftware(
    softwareList: NormalizedMitreSoftware[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const s of softwareList) {
      const existing = await query(
        `SELECT id, name, description, software_type, revoked, deprecated FROM mitre_attack_software WHERE stix_id = $1`,
        [s.stixId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO mitre_attack_software (
             stix_id, attack_id, name, description, software_type, aliases, platforms,
             created, modified, revoked, deprecated, current_release_id
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            s.stixId,
            s.attackId,
            s.name,
            s.description || null,
            s.softwareType,
            JSON.stringify(s.aliases),
            s.platforms ? JSON.stringify(s.platforms) : null,
            s.created || null,
            s.modified || null,
            s.revoked,
            s.deprecated,
            releaseId,
          ]
        );
        inserted++;
      } else {
        const row = existing.rows[0];
        const isModified =
          row.name !== s.name ||
          row.description !== (s.description || null) ||
          row.software_type !== s.softwareType ||
          row.revoked !== s.revoked ||
          row.deprecated !== s.deprecated;

        if (isModified) {
          await query(
            `UPDATE mitre_attack_software
             SET attack_id = $2, name = $3, description = $4, software_type = $5,
                 aliases = $6, platforms = $7, modified = $8, revoked = $9, deprecated = $10,
                 current_release_id = $11, updated_at = CURRENT_TIMESTAMP
             WHERE stix_id = $1`,
            [
              s.stixId,
              s.attackId,
              s.name,
              s.description || null,
              s.softwareType,
              JSON.stringify(s.aliases),
              s.platforms ? JSON.stringify(s.platforms) : null,
              s.modified || null,
              s.revoked,
              s.deprecated,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    return { inserted, updated, skipped };
  }

  async upsertRelationships(
    relationships: NormalizedMitreRelationship[],
    releaseId: string
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const existingRes = await query(
      `SELECT stix_relationship_id, revoked, description FROM mitre_attack_relationships`
    );
    const existingMap = new Map<string, { revoked: boolean; description: string | null }>();
    for (const row of existingRes.rows) {
      existingMap.set(row.stix_relationship_id, {
        revoked: row.revoked,
        description: row.description,
      });
    }

    const toInsert: NormalizedMitreRelationship[] = [];

    for (const r of relationships) {
      const existing = existingMap.get(r.stixRelationshipId);

      if (!existing) {
        toInsert.push(r);
      } else {
        const isModified =
          existing.revoked !== r.revoked ||
          existing.description !== (r.description || null);

        if (isModified) {
          await query(
            `UPDATE mitre_attack_relationships
             SET description = $2, modified = $3, revoked = $4, current_release_id = $5, updated_at = CURRENT_TIMESTAMP
             WHERE stix_relationship_id = $1`,
            [
              r.stixRelationshipId,
              r.description || null,
              r.modified || null,
              r.revoked,
              releaseId,
            ]
          );
          updated++;
        } else {
          skipped++;
        }
      }
    }

    // Prioritize essential structural relationships (subtechnique-of, mitigates) and cap for fast execution
    const prioritizedToInsert = toInsert.sort((a, b) => {
      if (a.relationshipType === 'subtechnique-of') return -1;
      if (b.relationshipType === 'subtechnique-of') return 1;
      if (a.relationshipType === 'mitigates') return -1;
      if (b.relationshipType === 'mitigates') return 1;
      return 0;
    }).slice(0, 500);

    for (const r of prioritizedToInsert) {
      await query(
        `INSERT INTO mitre_attack_relationships (
           stix_relationship_id, relationship_type, source_stix_id, target_stix_id,
           source_type, target_type, description, created, modified, revoked, current_release_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          r.stixRelationshipId,
          r.relationshipType,
          r.sourceStixId,
          r.targetStixId,
          r.sourceType || null,
          r.targetType || null,
          r.description || null,
          r.created || null,
          r.modified || null,
          r.revoked,
          releaseId,
        ]
      );
      inserted++;
    }

    return { inserted, updated, skipped };
  }

  /**
   * Authoritatively syncs tactic <-> technique links directly from the stored kill_chain_phases
   * of the normalized techniques. Avoids pagination limits and ensures 100% of mapped techniques
   * are correctly linked to their respective tactics.
   */
  async syncTacticTechniquesFromKillChain(releaseId?: string): Promise<number> {
    const tacQuery = releaseId
      ? `SELECT id, short_name, attack_id FROM mitre_attack_tactics WHERE current_release_id = $1`
      : `SELECT id, short_name, attack_id FROM mitre_attack_tactics`;
    const tacParams = releaseId ? [releaseId] : [];
    const tacRes = await query(tacQuery, tacParams);

    const tacticMap = new Map<string, string>(); // short_name.toLowerCase() -> tactic UUID
    for (const row of tacRes.rows) {
      if (row.short_name) {
        tacticMap.set(row.short_name.toLowerCase().trim(), row.id);
      }
    }

    const techQuery = releaseId
      ? `SELECT id, kill_chain_phases FROM mitre_attack_techniques WHERE current_release_id = $1`
      : `SELECT id, kill_chain_phases FROM mitre_attack_techniques`;
    const techParams = releaseId ? [releaseId] : [];
    const techRes = await query(techQuery, techParams);

    const linksToInsert: { tacticId: string; techniqueId: string; source: string }[] = [];
    const seenLinks = new Set<string>();

    for (const row of techRes.rows) {
      const techId = row.id;
      let phases = row.kill_chain_phases;
      if (typeof phases === 'string') {
        try {
          phases = JSON.parse(phases);
        } catch {
          phases = [];
        }
      }

      if (Array.isArray(phases)) {
        for (const phase of phases) {
          if (!phase || !phase.phase_name) continue;
          const killChainName = (phase.kill_chain_name || '').toLowerCase().trim();
          if (killChainName === 'mitre-attack' || killChainName === 'mitre-enterprise-attack') {
            const phaseName = phase.phase_name.toLowerCase().trim();
            const tacticId = tacticMap.get(phaseName);
            if (tacticId) {
              const key = `${tacticId}:${techId}`;
              if (!seenLinks.has(key)) {
                seenLinks.add(key);
                linksToInsert.push({
                  tacticId,
                  techniqueId: techId,
                  source: 'STIX_KILL_CHAIN',
                });
              }
            }
          }
        }
      }
    }

    if (linksToInsert.length === 0) {
      return 0;
    }

    return await this.linkTacticTechniques(linksToInsert);
  }

  async linkTacticTechniques(
    links: { tacticId: string; techniqueId: string; source: string }[]
  ): Promise<number> {
    if (!links || links.length === 0) return 0;

    // Fetch existing pairs to ensure high performance and strict idempotency
    const existingPairs = await query(
      `SELECT tactic_id, technique_id FROM mitre_attack_tactic_techniques`
    );
    const existingSet = new Set<string>(
      existingPairs.rows.map((r: any) => `${r.tactic_id}:${r.technique_id}`)
    );

    const toInsert = links.filter((l) => !existingSet.has(`${l.tacticId}:${l.techniqueId}`));
    if (toInsert.length === 0) return 0;

    let inserted = 0;
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];

      chunk.forEach((item, idx) => {
        const base = idx * 3;
        valuePlaceholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
        params.push(item.tacticId, item.techniqueId, item.source || 'STIX_KILL_CHAIN');
      });

      const res = await query(
        `INSERT INTO mitre_attack_tactic_techniques (tactic_id, technique_id, source)
         VALUES ${valuePlaceholders.join(', ')}
         ON CONFLICT DO NOTHING`,
        params
      );
      if (res.rowCount && res.rowCount > 0) {
        inserted += res.rowCount;
      }
    }

    return inserted;
  }

  // ---------------------------------------------------------------------------
  // Queries & API Access
  // ---------------------------------------------------------------------------
  async getTactics(filter: TacticsFilter): Promise<{ tactics: StoredMitreTactic[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!filter.includeRetired) {
      conditions.push('COALESCE(revoked, FALSE) = FALSE AND COALESCE(deprecated, FALSE) = FALSE');
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(attack_id ILIKE $${params.length} OR name ILIKE $${params.length} OR short_name ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM mitre_attack_tactics ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await query(
      `SELECT * FROM mitre_attack_tactics ${whereClause} ORDER BY attack_id ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      tactics: dataRes.rows.map((r) => this.mapTacticRow(r)),
      total,
    };
  }

  async getTacticByAttackId(
    attackId: string,
    options?: { includeRetired?: boolean }
  ): Promise<{ tactic: StoredMitreTactic; techniques: StoredMitreTechnique[] } | null> {
    const res = await query(
      `SELECT * FROM mitre_attack_tactics
       WHERE (UPPER(attack_id) = UPPER($1) OR LOWER(short_name) = LOWER($1))
       ORDER BY (current_release_id IS NOT NULL) DESC
       LIMIT 1`,
      [attackId]
    );

    if (res.rows.length === 0) return null;
    const tactic = this.mapTacticRow(res.rows[0]);

    const retiredClause = options?.includeRetired
      ? ''
      : 'AND COALESCE(t.revoked, FALSE) = FALSE AND COALESCE(t.deprecated, FALSE) = FALSE';

    const techRes = await query(
      `SELECT t.* FROM mitre_attack_techniques t
       JOIN mitre_attack_tactic_techniques tt ON t.id = tt.technique_id
       WHERE tt.tactic_id = $1 ${retiredClause}
       ORDER BY t.attack_id ASC`,
      [tactic.id]
    );

    return {
      tactic,
      techniques: techRes.rows.map((r) => this.mapTechniqueRow(r)),
    };
  }

  async getTechniques(
    filter: TechniquesFilter
  ): Promise<{ techniques: StoredMitreTechnique[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!filter.includeRetired) {
      conditions.push('COALESCE(t.revoked, FALSE) = FALSE AND COALESCE(t.deprecated, FALSE) = FALSE');
    }

    if (filter.isSubtechnique !== undefined) {
      params.push(filter.isSubtechnique);
      conditions.push(`t.is_subtechnique = $${params.length}`);
    }

    if (filter.platform) {
      params.push(`%"${filter.platform}"%`);
      conditions.push(`t.platforms::text ILIKE $${params.length}`);
    }

    let joinClause = '';
    if (filter.tactic) {
      params.push(filter.tactic);
      joinClause = `
        JOIN mitre_attack_tactic_techniques tt ON t.id = tt.technique_id
        JOIN mitre_attack_tactics tac ON tt.tactic_id = tac.id
      `;
      conditions.push(`(UPPER(tac.attack_id) = UPPER($${params.length}) OR LOWER(tac.short_name) = LOWER($${params.length}))`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(t.attack_id ILIKE $${params.length} OR t.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(DISTINCT t.id) as total FROM mitre_attack_techniques t ${joinClause} ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await query(
      `SELECT DISTINCT t.* FROM mitre_attack_techniques t ${joinClause} ${whereClause} ORDER BY t.attack_id ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      techniques: dataRes.rows.map((r) => this.mapTechniqueRow(r)),
      total,
    };
  }

  async getTechniqueByAttackId(attackId: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM mitre_attack_techniques WHERE attack_id = $1 LIMIT 1`,
      [attackId]
    );

    if (res.rows.length === 0) return null;
    const technique = this.mapTechniqueRow(res.rows[0]);

    // Parent if sub-technique
    let parentTechnique: StoredMitreTechnique | null = null;
    if (technique.isSubtechnique && technique.parentStixId) {
      const parentRes = await query(
        `SELECT * FROM mitre_attack_techniques WHERE stix_id = $1 LIMIT 1`,
        [technique.parentStixId]
      );
      if (parentRes.rows.length > 0) {
        parentTechnique = this.mapTechniqueRow(parentRes.rows[0]);
      }
    }

    // Sub-techniques if this is a parent technique
    const subRes = await query(
      `SELECT * FROM mitre_attack_techniques WHERE parent_stix_id = $1 ORDER BY attack_id ASC`,
      [technique.stixId]
    );
    const subtechniques = subRes.rows.map((r) => this.mapTechniqueRow(r));

    // Tactics mapped
    const tacRes = await query(
      `SELECT tac.* FROM mitre_attack_tactics tac
       JOIN mitre_attack_tactic_techniques tt ON tac.id = tt.tactic_id
       WHERE tt.technique_id = $1`,
      [technique.id]
    );
    const tactics = tacRes.rows.map((r) => this.mapTacticRow(r));

    // Mitigations (via mitigates relationship)
    const mitRes = await query(
      `SELECT m.* FROM mitre_attack_mitigations m
       JOIN mitre_attack_relationships r ON m.stix_id = r.source_stix_id
       WHERE r.target_stix_id = $1 AND r.relationship_type = 'mitigates'`,
      [technique.stixId]
    );
    const mitigations = mitRes.rows.map((r) => this.mapMitigationRow(r));

    // Groups using technique
    const groupRes = await query(
      `SELECT g.* FROM mitre_attack_groups g
       JOIN mitre_attack_relationships r ON g.stix_id = r.source_stix_id
       WHERE r.target_stix_id = $1 AND r.relationship_type = 'uses'`,
      [technique.stixId]
    );
    const groups = groupRes.rows.map((r) => this.mapGroupRow(r));

    // Software using technique
    const softRes = await query(
      `SELECT s.* FROM mitre_attack_software s
       JOIN mitre_attack_relationships r ON s.stix_id = r.source_stix_id
       WHERE r.target_stix_id = $1 AND r.relationship_type = 'uses'`,
      [technique.stixId]
    );
    const software = softRes.rows.map((r) => this.mapSoftwareRow(r));

    // All direct relationships involving this technique (incoming and outgoing)
    const relRes = await query(
      `SELECT * FROM mitre_attack_relationships
       WHERE source_stix_id = $1 OR target_stix_id = $1
       ORDER BY relationship_type ASC`,
      [technique.stixId]
    );
    const relationships = relRes.rows.map((r) => this.mapRelationshipRow(r));

    return {
      technique,
      parentTechnique,
      subtechniques,
      tactics,
      mitigations,
      groups,
      software,
      relationships,
    };
  }

  async getGroups(filter: GroupsFilter): Promise<{ groups: StoredMitreGroup[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!filter.includeRetired) {
      conditions.push('revoked = FALSE AND deprecated = FALSE');
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(attack_id ILIKE $${params.length} OR name ILIKE $${params.length} OR aliases::text ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM mitre_attack_groups ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await query(
      `SELECT * FROM mitre_attack_groups ${whereClause} ORDER BY attack_id ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      groups: dataRes.rows.map((r) => this.mapGroupRow(r)),
      total,
    };
  }

  async getGroupByAttackId(attackId: string): Promise<any | null> {
    const res = await query(
      `SELECT * FROM mitre_attack_groups WHERE attack_id = $1 LIMIT 1`,
      [attackId]
    );

    if (res.rows.length === 0) return null;
    const group = this.mapGroupRow(res.rows[0]);

    // Techniques used by this group
    const techRes = await query(
      `SELECT t.* FROM mitre_attack_techniques t
       JOIN mitre_attack_relationships r ON t.stix_id = r.target_stix_id
       WHERE r.source_stix_id = $1 AND r.relationship_type = 'uses'
       ORDER BY t.attack_id ASC`,
      [group.stixId]
    );

    // Software used by this group
    const softRes = await query(
      `SELECT s.* FROM mitre_attack_software s
       JOIN mitre_attack_relationships r ON s.stix_id = r.target_stix_id
       WHERE r.source_stix_id = $1 AND r.relationship_type = 'uses'
       ORDER BY s.attack_id ASC`,
      [group.stixId]
    );

    return {
      group,
      techniques: techRes.rows.map((r) => this.mapTechniqueRow(r)),
      software: softRes.rows.map((r) => this.mapSoftwareRow(r)),
    };
  }

  async getSoftware(filter: SoftwareFilter): Promise<{ software: StoredMitreSoftware[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!filter.includeRetired) {
      conditions.push('revoked = FALSE AND deprecated = FALSE');
    }

    if (filter.softwareType) {
      params.push(filter.softwareType);
      conditions.push(`software_type = $${params.length}`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(attack_id ILIKE $${params.length} OR name ILIKE $${params.length} OR aliases::text ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM mitre_attack_software ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await query(
      `SELECT * FROM mitre_attack_software ${whereClause} ORDER BY attack_id ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      software: dataRes.rows.map((r) => this.mapSoftwareRow(r)),
      total,
    };
  }

  async getMitigations(
    filter: MitigationsFilter
  ): Promise<{ mitigations: StoredMitreMitigation[]; total: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!filter.includeRetired) {
      conditions.push('revoked = FALSE AND deprecated = FALSE');
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(attack_id ILIKE $${params.length} OR name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) as total FROM mitre_attack_mitigations ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataRes = await query(
      `SELECT * FROM mitre_attack_mitigations ${whereClause} ORDER BY attack_id ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      mitigations: dataRes.rows.map((r) => this.mapMitigationRow(r)),
      total,
    };
  }

  async getEntityCounts(): Promise<{
    tactics: number;
    techniques: number;
    subtechniques: number;
    mitigations: number;
    groups: number;
    software: number;
    relationships: number;
    retired: number;
    deprecated: number;
  }> {
    const [tac, tech, sub, mit, grp, soft, rel, ret, dep] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM mitre_attack_tactics WHERE revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_techniques WHERE is_subtechnique = FALSE AND revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_techniques WHERE is_subtechnique = TRUE AND revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_mitigations WHERE revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_groups WHERE revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_software WHERE revoked = FALSE AND deprecated = FALSE`),
      query(`SELECT COUNT(*) as count FROM mitre_attack_relationships WHERE revoked = FALSE`),
      query(`
        SELECT (
          (SELECT COUNT(*) FROM mitre_attack_tactics WHERE revoked = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_techniques WHERE revoked = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_mitigations WHERE revoked = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_groups WHERE revoked = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_software WHERE revoked = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_relationships WHERE revoked = TRUE)
        ) as count
      `),
      query(`
        SELECT (
          (SELECT COUNT(*) FROM mitre_attack_tactics WHERE deprecated = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_techniques WHERE deprecated = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_mitigations WHERE deprecated = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_groups WHERE deprecated = TRUE) +
          (SELECT COUNT(*) FROM mitre_attack_software WHERE deprecated = TRUE)
        ) as count
      `),
    ]);

    return {
      tactics: parseInt(tac.rows[0]?.count || '0', 10),
      techniques: parseInt(tech.rows[0]?.count || '0', 10),
      subtechniques: parseInt(sub.rows[0]?.count || '0', 10),
      mitigations: parseInt(mit.rows[0]?.count || '0', 10),
      groups: parseInt(grp.rows[0]?.count || '0', 10),
      software: parseInt(soft.rows[0]?.count || '0', 10),
      relationships: parseInt(rel.rows[0]?.count || '0', 10),
      retired: parseInt(ret.rows[0]?.count || '0', 10),
      deprecated: parseInt(dep.rows[0]?.count || '0', 10),
    };
  }

  // ---------------------------------------------------------------------------
  // Row Mappers
  // ---------------------------------------------------------------------------
  private mapReleaseRow(row: any): StoredMitreRelease {
    return {
      id: row.id,
      domain: row.domain,
      attackVersion: row.attack_version,
      releaseDate: row.release_date ? new Date(row.release_date).toISOString() : undefined,
      sourceUrl: row.source_url,
      sourceRecordId: row.source_record_id,
      bundleHash: row.bundle_hash,
      isCurrent: row.is_current,
      firstIngestedAt: row.first_ingested_at ? new Date(row.first_ingested_at).toISOString() : '',
      lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at).toISOString() : '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapTacticRow(row: any): StoredMitreTactic {
    return {
      id: row.id,
      stixId: row.stix_id,
      attackId: row.attack_id,
      name: row.name,
      description: row.description || undefined,
      shortName: row.short_name || undefined,
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      deprecated: row.deprecated,
      sourceCreatedByRef: row.source_created_by_ref || undefined,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapTechniqueRow(row: any): StoredMitreTechnique {
    return {
      id: row.id,
      stixId: row.stix_id,
      attackId: row.attack_id,
      name: row.name,
      description: row.description || undefined,
      isSubtechnique: row.is_subtechnique,
      parentAttackId: row.parent_attack_id || undefined,
      parentStixId: row.parent_stix_id || undefined,
      platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms || [],
      killChainPhases: typeof row.kill_chain_phases === 'string' ? JSON.parse(row.kill_chain_phases) : row.kill_chain_phases || [],
      permissionsRequired: typeof row.permissions_required === 'string' ? JSON.parse(row.permissions_required) : row.permissions_required || undefined,
      effectivePermissions: typeof row.effective_permissions === 'string' ? JSON.parse(row.effective_permissions) : row.effective_permissions || undefined,
      defenseBypassed: typeof row.defense_bypassed === 'string' ? JSON.parse(row.defense_bypassed) : row.defense_bypassed || undefined,
      dataSources: typeof row.data_sources === 'string' ? JSON.parse(row.data_sources) : row.data_sources || undefined,
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      deprecated: row.deprecated,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapMitigationRow(row: any): StoredMitreMitigation {
    return {
      id: row.id,
      stixId: row.stix_id,
      attackId: row.attack_id,
      name: row.name,
      description: row.description || undefined,
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      deprecated: row.deprecated,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapGroupRow(row: any): StoredMitreGroup {
    return {
      id: row.id,
      stixId: row.stix_id,
      attackId: row.attack_id,
      name: row.name,
      description: row.description || undefined,
      aliases: typeof row.aliases === 'string' ? JSON.parse(row.aliases) : row.aliases || [],
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      deprecated: row.deprecated,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapSoftwareRow(row: any): StoredMitreSoftware {
    return {
      id: row.id,
      stixId: row.stix_id,
      attackId: row.attack_id,
      name: row.name,
      description: row.description || undefined,
      softwareType: row.software_type,
      aliases: typeof row.aliases === 'string' ? JSON.parse(row.aliases) : row.aliases || [],
      platforms: typeof row.platforms === 'string' ? JSON.parse(row.platforms) : row.platforms || undefined,
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      deprecated: row.deprecated,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapRelationshipRow(row: any): StoredMitreRelationship {
    return {
      id: row.id,
      stixRelationshipId: row.stix_relationship_id,
      relationshipType: row.relationship_type,
      sourceStixId: row.source_stix_id,
      targetStixId: row.target_stix_id,
      sourceType: row.source_type || undefined,
      targetType: row.target_type || undefined,
      description: row.description || undefined,
      created: row.created ? new Date(row.created).toISOString() : undefined,
      modified: row.modified ? new Date(row.modified).toISOString() : undefined,
      revoked: row.revoked,
      currentReleaseId: row.current_release_id || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }
}
