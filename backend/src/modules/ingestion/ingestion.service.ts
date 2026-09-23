import crypto from 'crypto';
import { IngestionRepository } from './ingestion.repository';
import { VulnerabilityRepository } from '../vulnerabilities/vulnerability.repository';
import { NvdMapper } from '../nvd/nvd.mapper';
import { NvdCveItem } from '../nvd/nvd.types';
import { SyncType, IngestionResult } from './ingestion.types';
import { logger } from '../../config/logger';

export class IngestionService {
  private ingestionRepo: IngestionRepository;
  private vulnRepo: VulnerabilityRepository;

  constructor(
    ingestionRepo?: IngestionRepository,
    vulnRepo?: VulnerabilityRepository
  ) {
    this.ingestionRepo = ingestionRepo || new IngestionRepository();
    this.vulnRepo = vulnRepo || new VulnerabilityRepository();
  }

  static calculatePayloadHash(payload: any): string {
    // Canonical JSON stringification (sort object keys for deterministic hash)
    const jsonStr = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  async processCveItems(
    items: NvdCveItem[],
    syncType: SyncType,
    requestParams?: Record<string, unknown>
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const source = await this.ingestionRepo.getOrCreateNvdDataSource();
    const runId = await this.ingestionRepo.startIngestionRun(
      source.id,
      syncType,
      requestParams
    );

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errorCount = 0;
    let lastError: string | undefined;

    logger.info(`Starting NVD CVE ingestion run [${runId}]`, {
      runId,
      syncType,
      totalReceived: items.length,
    });

    for (const cve of items) {
      try {
        const payloadHash = IngestionService.calculatePayloadHash(cve);
        const externalId = cve.id.toUpperCase();

        // 1. Deduplication check: Has this exact payload already been processed?
        const existingRaw = await this.ingestionRepo.findRawRecordByHash(
          source.id,
          externalId,
          payloadHash
        );

        if (existingRaw) {
          // Payload is identical to already processed record.
          skipped++;
          continue;
        }

        // 2. Preserve raw source record with provenance
        const rawRecordId = await this.ingestionRepo.insertRawRecord({
          sourceId: source.id,
          ingestionRunId: runId,
          externalId,
          payloadJson: cve,
          payloadHash,
          sourcePublishedAt: cve.published,
          sourceModifiedAt: cve.lastModified,
        });

        // 3. Normalize into domain model (preserves all CVSS assessments, CWE, CPE, references)
        const normalized = NvdMapper.toNormalizedVulnerability(cve);

        // 4. Upsert normalized vulnerability in PostgreSQL
        const upsertStatus = await this.vulnRepo.upsertNormalizedVulnerability(
          normalized,
          rawRecordId
        );

        if (upsertStatus === 'INSERTED') {
          inserted++;
        } else if (upsertStatus === 'UPDATED') {
          updated++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        errorCount++;
        lastError = err.message || 'Unknown processing error';
        logger.error(`Error processing CVE ${cve.id}`, {
          cveId: cve.id,
          error: lastError,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus =
      errorCount === 0
        ? 'COMPLETED'
        : inserted + updated > 0
        ? 'PARTIAL'
        : 'FAILED';

    await this.ingestionRepo.finishIngestionRun(runId, {
      status: finalStatus,
      recordsReceived: items.length,
      recordsInserted: inserted,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errorCount,
      errorMessage: lastError,
    });

    if (finalStatus === 'COMPLETED' || finalStatus === 'PARTIAL') {
      await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());
    }

    logger.info(`Completed NVD CVE ingestion run [${runId}]`, {
      runId,
      status: finalStatus,
      received: items.length,
      inserted,
      updated,
      skipped,
      errorCount,
      durationMs,
    });

    return {
      runId,
      status: finalStatus,
      syncType,
      recordsReceived: items.length,
      recordsInserted: inserted,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errorCount,
      errorMessage: lastError,
      durationMs,
    };
  }
}
