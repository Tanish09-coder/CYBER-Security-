import { query, withTransaction } from '../../db';
import { NormalizedCisaKevEntry, StoredCisaKevEntry } from './cisa-kev.types';
import { DataSourceRecord } from '../ingestion/ingestion.types';
import { UpsertResultStatus } from '../vulnerabilities/vulnerability.types';
import { env } from '../../config/env';

export class CisaKevRepository {
  async getOrCreateCisaKevDataSource(): Promise<DataSourceRecord> {
    const findSql = `SELECT * FROM data_sources WHERE name = $1 AND provider = $2 LIMIT 1`;
    const res = await query(findSql, [
      'CISA Known Exploited Vulnerabilities Catalog',
      'CISA',
    ]);

    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        provider: row.provider,
        baseUrl: row.base_url,
        dataType: row.data_type,
        enabled: row.enabled,
        lastSyncAt: row.last_sync_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const insertSql = `
      INSERT INTO data_sources (name, provider, base_url, data_type, enabled)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const insertRes = await query(insertSql, [
      'CISA Known Exploited Vulnerabilities Catalog',
      'CISA',
      env.CISA_KEV_URL,
      'KNOWN_EXPLOITED_VULNERABILITY',
      true,
    ]);
    const row = insertRes.rows[0];
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      baseUrl: row.base_url,
      dataType: row.data_type,
      enabled: row.enabled,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsertKevEntry(
    entry: NormalizedCisaKevEntry,
    rawRecordId: string
  ): Promise<UpsertResultStatus> {
    return await withTransaction(async (client) => {
      // 1. Check if matching NVD vulnerability already exists by cve_id
      const vulnRes = await client.query(
        `SELECT id FROM vulnerabilities WHERE cve_id = $1 LIMIT 1`,
        [entry.cveId]
      );
      const vulnerabilityId = vulnRes.rows.length > 0 ? vulnRes.rows[0].id : null;

      // If matching vulnerability exists in NVD table, enrich with KEV fields
      if (vulnerabilityId) {
        await client.query(
          `UPDATE vulnerabilities
           SET 
             known_exploited = TRUE,
             kev_date_added = $1,
             kev_due_date = $2,
             kev_known_ransomware_campaign_use = $3,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            entry.dateAdded || null,
            entry.dueDate || null,
            entry.knownRansomwareCampaignUse || null,
            vulnerabilityId,
          ]
        );
      }

      // 2. Check if KEV entry already exists
      const existingRes = await client.query(
        `SELECT id, vendor_project, product, vulnerability_name, date_added,
                short_description, required_action, due_date,
                known_ransomware_campaign_use, notes, raw_record_id, is_current
         FROM cisa_kev_entries
         WHERE cve_id = $1
         LIMIT 1`,
        [entry.cveId]
      );

      if (existingRes.rows.length === 0) {
        // INSERT new KEV entry
        await client.query(
          `INSERT INTO cisa_kev_entries (
            cve_id, vulnerability_id, vendor_project, product, vulnerability_name,
            date_added, short_description, required_action, due_date,
            known_ransomware_campaign_use, notes, source_record_id, raw_record_id,
            is_current, first_seen_at, last_seen_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`,
          [
            entry.cveId,
            vulnerabilityId,
            entry.vendorProject || null,
            entry.product || null,
            entry.vulnerabilityName || null,
            entry.dateAdded || null,
            entry.shortDescription || null,
            entry.requiredAction || null,
            entry.dueDate || null,
            entry.knownRansomwareCampaignUse || null,
            entry.notes || null,
            entry.sourceRecordId,
            rawRecordId,
          ]
        );
        return 'INSERTED';
      }

      const existing = existingRes.rows[0];

      // Check if relevant KEV attributes changed
      const hasChanged =
        existing.vendor_project !== (entry.vendorProject || null) ||
        existing.product !== (entry.product || null) ||
        existing.vulnerability_name !== (entry.vulnerabilityName || null) ||
        existing.required_action !== (entry.requiredAction || null) ||
        existing.due_date !== (entry.dueDate || null) ||
        existing.known_ransomware_campaign_use !== (entry.knownRansomwareCampaignUse || null) ||
        existing.notes !== (entry.notes || null) ||
        existing.vulnerability_id !== vulnerabilityId ||
        !existing.is_current;

      if (hasChanged) {
        await client.query(
          `UPDATE cisa_kev_entries
           SET
             vulnerability_id = $1,
             vendor_project = $2,
             product = $3,
             vulnerability_name = $4,
             date_added = $5,
             short_description = $6,
             required_action = $7,
             due_date = $8,
             known_ransomware_campaign_use = $9,
             notes = $10,
             raw_record_id = $11,
             is_current = TRUE,
             last_seen_at = CURRENT_TIMESTAMP,
             removed_from_catalog_at = NULL,
             updated_at = CURRENT_TIMESTAMP
           WHERE cve_id = $12`,
          [
            vulnerabilityId,
            entry.vendorProject || null,
            entry.product || null,
            entry.vulnerabilityName || null,
            entry.dateAdded || null,
            entry.shortDescription || null,
            entry.requiredAction || null,
            entry.dueDate || null,
            entry.knownRansomwareCampaignUse || null,
            entry.notes || null,
            rawRecordId,
            entry.cveId,
          ]
        );
        return 'UPDATED';
      }

      // If identical, update heartbeat (last_seen_at) and mark current
      await client.query(
        `UPDATE cisa_kev_entries
         SET is_current = TRUE, last_seen_at = CURRENT_TIMESTAMP, removed_from_catalog_at = NULL
         WHERE cve_id = $1`,
        [entry.cveId]
      );
      return 'SKIPPED';
    });
  }

  async reconcileRemovedEntries(activeCveIds: string[]): Promise<number> {
    if (activeCveIds.length === 0) return 0;

    return await withTransaction(async (client) => {
      // Find entries that are currently marked is_current = TRUE, but are no longer in the active catalog
      const findSql = `
        SELECT cve_id, vulnerability_id
        FROM cisa_kev_entries
        WHERE is_current = TRUE AND NOT (cve_id = ANY($1))
      `;
      const res = await client.query(findSql, [activeCveIds]);

      if (res.rows.length === 0) return 0;

      const removedCveIds = res.rows.map((r: any) => r.cve_id);

      // 1. Mark is_current = FALSE in cisa_kev_entries (Never delete historical records!)
      await client.query(
        `UPDATE cisa_kev_entries
         SET is_current = FALSE,
             removed_from_catalog_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE cve_id = ANY($1)`,
        [removedCveIds]
      );

      // 2. Reconcile vulnerabilities table
      await client.query(
        `UPDATE vulnerabilities
         SET known_exploited = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE cve_id = ANY($1)`,
        [removedCveIds]
      );

      return removedCveIds.length;
    });
  }

  async findByCveId(cveId: string): Promise<StoredCisaKevEntry | null> {
    const cleanId = cveId.trim().toUpperCase();
    const sql = `
      SELECT 
        k.*,
        r.payload_hash as raw_payload_hash,
        r.ingested_at as raw_ingested_at,
        ds.name as data_source_name,
        ds.provider as data_source_provider,
        v.cvss_base_score,
        v.cvss_base_severity,
        v.cvss_version,
        v.description as nvd_description
      FROM cisa_kev_entries k
      LEFT JOIN raw_source_records r ON k.raw_record_id = r.id
      LEFT JOIN data_sources ds ON r.source_id = ds.id
      LEFT JOIN vulnerabilities v ON k.vulnerability_id = v.id
      WHERE k.cve_id = $1
      LIMIT 1
    `;
    const res = await query(sql, [cleanId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      cveId: row.cve_id,
      vulnerabilityId: row.vulnerability_id,
      vendorProject: row.vendor_project,
      product: row.product,
      vulnerabilityName: row.vulnerability_name,
      dateAdded: row.date_added,
      shortDescription: row.short_description,
      requiredAction: row.required_action,
      dueDate: row.due_date,
      knownRansomwareCampaignUse: row.known_ransomware_campaign_use,
      notes: row.notes,
      sourceRecordId: row.source_record_id,
      rawRecordId: row.raw_record_id,
      isCurrent: row.is_current,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      removedFromCatalogAt: row.removed_from_catalog_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      linkedNvdVulnerability: row.vulnerability_id
        ? {
            id: row.vulnerability_id,
            cvssBaseScore: row.cvss_base_score !== null ? parseFloat(row.cvss_base_score) : null,
            cvssBaseSeverity: row.cvss_base_severity,
            cvssVersion: row.cvss_version,
            description: row.nvd_description,
          }
        : null,
      provenance: {
        sourceName: row.data_source_name || 'CISA Known Exploited Vulnerabilities Catalog',
        sourceProvider: row.data_source_provider || 'CISA',
        rawPayloadHash: row.raw_payload_hash,
        ingestedAt: row.raw_ingested_at,
      },
    };
  }

  async getActiveKevCount(): Promise<number> {
    const res = await query(`SELECT COUNT(*) as count FROM cisa_kev_entries WHERE is_current = TRUE`);
    return parseInt(res.rows[0]?.count || '0', 10);
  }
}
