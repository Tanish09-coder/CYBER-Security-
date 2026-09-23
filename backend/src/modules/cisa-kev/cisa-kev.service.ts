import { CisaKevClient } from './cisa-kev.client';
import { CisaKevRepository } from './cisa-kev.repository';
import { IngestionRepository } from '../ingestion/ingestion.repository';
import { IngestionService } from '../ingestion/ingestion.service';
import { CisaKevMapper } from './cisa-kev.mapper';
import {
  StoredCisaKevEntry,
  CisaKevStatusResponse,
  CisaKevSyncResult,
} from './cisa-kev.types';
import { IngestionResult } from '../ingestion/ingestion.types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class CisaKevService {
  private client: CisaKevClient;
  private kevRepo: CisaKevRepository;
  private ingestionRepo: IngestionRepository;

  constructor(options?: {
    client?: CisaKevClient;
    kevRepo?: CisaKevRepository;
    ingestionRepo?: IngestionRepository;
  }) {
    this.client = options?.client || new CisaKevClient();
    this.kevRepo = options?.kevRepo || new CisaKevRepository();
    this.ingestionRepo = options?.ingestionRepo || new IngestionRepository();
  }

  async syncFullCatalog(): Promise<CisaKevSyncResult> {
    const startTime = Date.now();
    const source = await this.kevRepo.getOrCreateCisaKevDataSource();

    // 1. Fetch official catalog from CISA
    const catalog = await this.client.fetchCatalog();
    const vulnerabilities = catalog.vulnerabilities || [];

    // Catalog metadata preserved per user modification 2
    const catalogMeta = {
      title: catalog.title || 'CISA Known Exploited Vulnerabilities Catalog',
      catalogVersion: catalog.catalogVersion || 'N/A',
      dateReleased: catalog.dateReleased || new Date().toISOString(),
      officialCount: catalog.count || vulnerabilities.length,
    };

    // 2. Start ingestion run in audit table
    const runId = await this.ingestionRepo.startIngestionRun(
      source.id,
      'FULL_CATALOG' as any,
      catalogMeta
    );

    // 3. Compute deterministic SHA-256 hash of entire catalog payload
    const payloadHash = IngestionService.calculatePayloadHash(catalog);
    const externalId = `KEV-CATALOG-${catalogMeta.catalogVersion}`;

    // 4. Check idempotency: If exact raw catalog hash already exists in DB
    const existingRaw = await this.ingestionRepo.findRawRecordByHash(
      source.id,
      externalId,
      payloadHash
    );

    if (existingRaw) {
      logger.info('Official CISA KEV catalog is unchanged since last sync (Identical SHA-256)', {
        runId,
        catalogVersion: catalogMeta.catalogVersion,
        payloadHash,
      });

      const durationMs = Date.now() - startTime;
      await this.ingestionRepo.finishIngestionRun(runId, {
        status: 'COMPLETED',
        recordsReceived: vulnerabilities.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: vulnerabilities.length,
        errorCount: 0,
      });

      await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());

      return {
        runId,
        status: 'COMPLETED',
        syncType: 'FULL_CATALOG' as any,
        recordsReceived: vulnerabilities.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: vulnerabilities.length,
        errorCount: 0,
        durationMs,
        catalogTitle: catalogMeta.title,
        catalogVersion: catalogMeta.catalogVersion,
        dateReleased: catalogMeta.dateReleased,
        officialCount: catalogMeta.officialCount,
      };
    }

    // 5. Store immutable raw source record for the new catalog revision
    const rawRecordId = await this.ingestionRepo.insertRawRecord({
      sourceId: source.id,
      ingestionRunId: runId,
      externalId,
      payloadJson: catalog,
      payloadHash,
      sourcePublishedAt: catalog.dateReleased,
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errorCount = 0;
    let lastError: string | undefined;

    const activeCveIds: string[] = [];

    // 6. Process and normalize each KEV entry
    for (const item of vulnerabilities) {
      try {
        if (!item.cveID) {
          skipped++;
          continue;
        }

        const normalized = CisaKevMapper.toNormalizedEntry(item);
        activeCveIds.push(normalized.cveId);

        const upsertResult = await this.kevRepo.upsertKevEntry(
          normalized,
          rawRecordId
        );

        if (upsertResult === 'INSERTED') {
          inserted++;
        } else if (upsertResult === 'UPDATED') {
          updated++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        errorCount++;
        lastError = err.message || 'Processing error';
        logger.error(`Error processing KEV entry ${item.cveID}`, {
          cveId: item.cveID,
          error: lastError,
        });
      }
    }

    // 7. State reconciliation for removed entries (preserves audit history)
    const reconciledCount = await this.kevRepo.reconcileRemovedEntries(activeCveIds);
    if (reconciledCount > 0) {
      logger.info(`Reconciled ${reconciledCount} CVEs no longer present in current CISA KEV catalog`, {
        reconciledCount,
      });
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
      recordsReceived: vulnerabilities.length,
      recordsInserted: inserted,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errorCount,
      errorMessage: lastError,
    });

    if (finalStatus === 'COMPLETED' || finalStatus === 'PARTIAL') {
      await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());
    }

    logger.info(`Completed CISA KEV ingestion run [${runId}]`, {
      runId,
      status: finalStatus,
      received: vulnerabilities.length,
      inserted,
      updated,
      skipped,
      errorCount,
      durationMs,
    });

    return {
      runId,
      status: finalStatus,
      syncType: 'FULL_CATALOG' as any,
      recordsReceived: vulnerabilities.length,
      recordsInserted: inserted,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errorCount,
      errorMessage: lastError,
      durationMs,
      catalogTitle: catalogMeta.title,
      catalogVersion: catalogMeta.catalogVersion,
      dateReleased: catalogMeta.dateReleased,
      officialCount: catalogMeta.officialCount,
    };
  }

  async getStatus(): Promise<CisaKevStatusResponse> {
    const source = await this.kevRepo.getOrCreateCisaKevDataSource();
    const [latestRun, lastSuccessfulRun, totalActiveKevCount] = await Promise.all([
      this.ingestionRepo.getLatestRun(source.id),
      this.ingestionRepo.getLastSuccessfulRun(source.id),
      this.kevRepo.getActiveKevCount(),
    ]);

    let dataAgeHours: number | null = null;
    let isStale = false;

    if (source.lastSyncAt) {
      const syncTime = new Date(source.lastSyncAt).getTime();
      const now = Date.now();
      dataAgeHours = Math.max(0, parseFloat(((now - syncTime) / (1000 * 60 * 60)).toFixed(1)));
      isStale = dataAgeHours > env.CISA_KEV_STALE_AFTER_HOURS;
    } else {
      isStale = true;
    }

    return {
      enabled: source.enabled,
      sourceUrl: source.baseUrl,
      lastSyncAt: source.lastSyncAt || null,
      lastSuccessfulRun,
      latestRun,
      totalActiveKevCount,
      dataAgeHours,
      isStale,
      staleThresholdHours: env.CISA_KEV_STALE_AFTER_HOURS,
    };
  }

  async checkCatalogStaleness(): Promise<{ isStale: boolean; dataAgeHours: number | null }> {
    const status = await this.getStatus();
    return {
      isStale: status.isStale,
      dataAgeHours: status.dataAgeHours,
    };
  }

  async getKevByCveId(cveId: string): Promise<StoredCisaKevEntry | null> {
    return await this.kevRepo.findByCveId(cveId);
  }

  async getKevSummary(): Promise<{ activeCount: number; knownRansomwareCount: number; overdueCount: number }> {
    return await this.kevRepo.getKevSummary();
  }

  async getKevCatalog(filters: import('./cisa-kev.types').CisaKevFilter): Promise<import('./cisa-kev.types').PaginatedCisaKevResponse> {
    return await this.kevRepo.getKevCatalog(filters);
  }
}
