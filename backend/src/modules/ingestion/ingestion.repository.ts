import { query } from '../../db';
import {
  DataSourceRecord,
  IngestionRunRecord,
  RawSourceRecord,
  SyncType,
  IngestionStatus,
} from './ingestion.types';
import { logger } from '../../config/logger';

export class IngestionRepository {
  async getOrCreateNvdDataSource(): Promise<DataSourceRecord> {
    const findSql = `SELECT * FROM data_sources WHERE name = $1 AND provider = $2 LIMIT 1`;
    const res = await query(findSql, ['National Vulnerability Database', 'NIST']);

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
      'National Vulnerability Database',
      'NIST',
      'https://services.nvd.nist.gov/rest/json/cves/2.0',
      'VULNERABILITY',
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

  async updateDataSourceLastSync(sourceId: string, syncTime: Date): Promise<void> {
    const sql = `
      UPDATE data_sources
      SET last_sync_at = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await query(sql, [syncTime.toISOString(), sourceId]);
  }

  async startIngestionRun(
    sourceId: string,
    syncType: SyncType,
    requestParams?: Record<string, unknown>
  ): Promise<string> {
    const sql = `
      INSERT INTO data_ingestion_runs (
        source_id, status, sync_type, request_parameters, started_at
      )
      VALUES ($1, 'RUNNING', $2, $3, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const res = await query(sql, [
      sourceId,
      syncType,
      requestParams ? JSON.stringify(requestParams) : null,
    ]);
    return res.rows[0].id;
  }

  async finishIngestionRun(
    runId: string,
    data: {
      status: IngestionStatus;
      recordsReceived: number;
      recordsInserted: number;
      recordsUpdated: number;
      recordsSkipped: number;
      errorCount: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    const sql = `
      UPDATE data_ingestion_runs
      SET 
        status = $1,
        records_received = $2,
        records_inserted = $3,
        records_updated = $4,
        records_skipped = $5,
        error_count = $6,
        error_message = $7,
        completed_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `;
    await query(sql, [
      data.status,
      data.recordsReceived,
      data.recordsInserted,
      data.recordsUpdated,
      data.recordsSkipped,
      data.errorCount,
      data.errorMessage || null,
      runId,
    ]);
  }

  async findRawRecordByHash(
    sourceId: string,
    externalId: string,
    payloadHash: string
  ): Promise<RawSourceRecord | null> {
    const sql = `
      SELECT * FROM raw_source_records
      WHERE source_id = $1 AND external_id = $2 AND payload_hash = $3
      LIMIT 1
    `;
    const res = await query(sql, [sourceId, externalId, payloadHash]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      id: row.id,
      sourceId: row.source_id,
      ingestionRunId: row.ingestion_run_id,
      externalId: row.external_id,
      payloadJson: row.payload_json,
      payloadHash: row.payload_hash,
      sourcePublishedAt: row.source_published_at,
      sourceModifiedAt: row.source_modified_at,
      ingestedAt: row.ingested_at,
      createdAt: row.created_at,
    };
  }

  async insertRawRecord(data: {
    sourceId: string;
    ingestionRunId: string;
    externalId: string;
    payloadJson: any;
    payloadHash: string;
    sourcePublishedAt?: string;
    sourceModifiedAt?: string;
  }): Promise<string> {
    const sql = `
      INSERT INTO raw_source_records (
        source_id, ingestion_run_id, external_id, payload_json, payload_hash,
        source_published_at, source_modified_at, ingested_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (source_id, external_id, payload_hash)
      DO UPDATE SET ingestion_run_id = EXCLUDED.ingestion_run_id
      RETURNING id
    `;
    const res = await query(sql, [
      data.sourceId,
      data.ingestionRunId,
      data.externalId,
      JSON.stringify(data.payloadJson),
      data.payloadHash,
      data.sourcePublishedAt || null,
      data.sourceModifiedAt || null,
    ]);
    return res.rows[0].id;
  }

  async getLatestRun(sourceId: string): Promise<IngestionRunRecord | null> {
    const sql = `
      SELECT * FROM data_ingestion_runs
      WHERE source_id = $1
      ORDER BY started_at DESC
      LIMIT 1
    `;
    const res = await query(sql, [sourceId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      sourceId: row.source_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      status: row.status,
      syncType: row.sync_type,
      recordsReceived: row.records_received,
      recordsInserted: row.records_inserted,
      recordsUpdated: row.records_updated,
      recordsSkipped: row.records_skipped,
      errorCount: row.error_count,
      errorMessage: row.error_message,
      requestParameters: row.request_parameters,
      createdAt: row.created_at,
    };
  }

  async getLastSuccessfulRun(sourceId: string): Promise<IngestionRunRecord | null> {
    const sql = `
      SELECT * FROM data_ingestion_runs
      WHERE source_id = $1 AND status = 'COMPLETED'
      ORDER BY completed_at DESC
      LIMIT 1
    `;
    const res = await query(sql, [sourceId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      sourceId: row.source_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      status: row.status,
      syncType: row.sync_type,
      recordsReceived: row.records_received,
      recordsInserted: row.records_inserted,
      recordsUpdated: row.records_updated,
      recordsSkipped: row.records_skipped,
      errorCount: row.error_count,
      errorMessage: row.error_message,
      requestParameters: row.request_parameters,
      createdAt: row.created_at,
    };
  }
}
