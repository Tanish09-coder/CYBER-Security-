import crypto from 'crypto';
import { VcdbClient, VcdbFetchedData } from './vcdb.client';
import { VcdbRepository } from './vcdb.repository';
import { IngestionRepository } from '../ingestion/ingestion.repository';
import { VcdbMapper } from './vcdb.mapper';
import { NormalizedVcdbIncident, VcdbSyncResult, VcdbStatus } from './vcdb.types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class VcdbService {
  private client: VcdbClient;
  private vcdbRepo: VcdbRepository;
  private ingestionRepo: IngestionRepository;

  constructor(options?: {
    client?: VcdbClient;
    vcdbRepo?: VcdbRepository;
    ingestionRepo?: IngestionRepository;
  }) {
    this.client = options?.client || new VcdbClient();
    this.vcdbRepo = options?.vcdbRepo || new VcdbRepository();
    this.ingestionRepo = options?.ingestionRepo || new IngestionRepository();
  }

  /**
   * Calculates a deterministic SHA-256 hash of the archive payload buffer.
   */
  static calculateBundleHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Orchestrates the complete VCDB / VERIS incident ingestion pipeline.
   */
  async syncVcdb(options?: { zipUrl?: string; force?: boolean }): Promise<VcdbSyncResult> {
    const startTime = Date.now();
    const source = await this.vcdbRepo.getOrCreateVcdbDataSource();

    logger.info('Starting VCDB / VERIS incident data synchronization run', {
      sourceId: source.id,
      force: Boolean(options?.force),
    });

    // 1. Fetch canonical joined zip archive and metadata
    const fetched: VcdbFetchedData = await this.client.fetchCanonicalJoinedZip(options?.zipUrl);
    const bundleHash = VcdbService.calculateBundleHash(fetched.bundleHashBuffer);

    // 2. Check for duplicate unchanged payload (Idempotency)
    if (!options?.force) {
      const existingRelease = await this.vcdbRepo.findReleaseByHash(bundleHash);
      if (existingRelease && existingRelease.isCurrent) {
        logger.info(
          `VCDB payload hash ${bundleHash} matches current release ${existingRelease.commitSha || existingRelease.id}; skipping sync (idempotent)`
        );

        const durationMs = Date.now() - startTime;
        const counts = await this.vcdbRepo.getEntityCounts();

        return {
          status: 'SKIPPED_IDENTICAL',
          runId: 'skipped-identical-payload',
          repositoryUrl: env.VCDB_ZIP_URL,
          commitSha: fetched.commitSha,
          verisVersion: fetched.verisVersion,
          bundleHash,
          totalDiscovered: fetched.incidents.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          recordsSkipped: fetched.incidents.length,
          recordsRemovedFromSource: 0,
          durationMs,
          counts: {
            incidents: counts.activeIncidents,
            actors: counts.actors,
            actions: counts.actions,
            assets: counts.assets,
            attributes: counts.attributes,
            explicitCveLinks: counts.explicitCveLinks,
            unknownFields: 0,
          },
          errorCount: 0,
        };
      }
    }

    // 3. Create release record
    const releaseRecord = await this.vcdbRepo.createRelease({
      repositoryUrl: env.VCDB_ZIP_URL,
      commitSha: fetched.commitSha,
      verisVersion: fetched.verisVersion,
      bundleHash,
      totalIncidents: fetched.incidents.length,
    });

    // 4. Create ingestion run
    const runId = await this.ingestionRepo.startIngestionRun(source.id, 'FULL_CATALOG');

    // 5. Preserve raw payload artifact
    const rawRecordId = await this.ingestionRepo.insertRawRecord({
      sourceId: source.id,
      ingestionRunId: runId,
      externalId: `vcdb_joined_${bundleHash.substring(0, 12)}`,
      payloadJson: fetched.incidents,
      payloadHash: bundleHash,
    });

    // 6. Map raw incidents into normalized CyberRiskOS domain models
    const normalizedIncidents: NormalizedVcdbIncident[] = [];
    const currentSnapshotIds = new Set<string>();
    let invalidCount = 0;
    let unknownFieldsCount = 0;

    for (const raw of fetched.incidents) {
      const mapped = VcdbMapper.toNormalizedIncident(raw);
      if (mapped) {
        normalizedIncidents.push(mapped);
        currentSnapshotIds.add(mapped.vcdbId);
      } else {
        invalidCount++;
      }
    }

    logger.info('Parsed raw VERIS incident objects', {
      totalDiscovered: fetched.incidents.length,
      validNormalized: normalizedIncidents.length,
      invalidCount,
    });

    // 7. Upsert normalized incidents into database
    const upsertRes = await this.vcdbRepo.upsertIncidents(normalizedIncidents, rawRecordId);

    // 8. Reconcile records missing from current complete snapshot
    const removedCount = await this.vcdbRepo.reconcileRemovedIncidents(currentSnapshotIds);

    // 9. Mark new release current
    await this.vcdbRepo.markReleaseCurrent(releaseRecord.id);

    // 10. Finish ingestion run and update data source
    const durationMs = Date.now() - startTime;
    await this.ingestionRepo.finishIngestionRun(runId, {
      status: 'COMPLETED',
      recordsReceived: fetched.incidents.length,
      recordsInserted: upsertRes.inserted,
      recordsUpdated: upsertRes.updated,
      recordsSkipped: upsertRes.skipped,
      errorCount: invalidCount,
    });

    await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());

    const entityCounts = await this.vcdbRepo.getEntityCounts();

    logger.info(`Successfully completed VCDB / VERIS sync run [${runId}]`, {
      runId,
      commitSha: fetched.commitSha,
      inserted: upsertRes.inserted,
      updated: upsertRes.updated,
      skipped: upsertRes.skipped,
      removed: removedCount,
      durationMs,
    });

    return {
      status: 'COMPLETED',
      runId,
      repositoryUrl: env.VCDB_ZIP_URL,
      commitSha: fetched.commitSha,
      verisVersion: fetched.verisVersion,
      bundleHash,
      totalDiscovered: fetched.incidents.length,
      recordsInserted: upsertRes.inserted,
      recordsUpdated: upsertRes.updated,
      recordsSkipped: upsertRes.skipped,
      recordsRemovedFromSource: removedCount,
      durationMs,
      counts: {
        incidents: entityCounts.activeIncidents,
        actors: entityCounts.actors,
        actions: entityCounts.actions,
        assets: entityCounts.assets,
        attributes: entityCounts.attributes,
        explicitCveLinks: entityCounts.explicitCveLinks,
        unknownFields: unknownFieldsCount,
      },
      errorCount: invalidCount,
    };
  }

  async getStatus(): Promise<VcdbStatus> {
    const source = await this.vcdbRepo.getOrCreateVcdbDataSource();
    const currentRelease = await this.vcdbRepo.getCurrentRelease();
    const counts = await this.vcdbRepo.getEntityCounts();

    const lastSync = currentRelease ? new Date(currentRelease.retrievedAt) : undefined;
    const now = new Date();
    const dataAgeHours = lastSync
      ? Math.max(0, Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)))
      : 99999;

    const staleThresholdHours = env.VCDB_STALE_AFTER_HOURS;
    const isStale = dataAgeHours > staleThresholdHours;

    return {
      enabled: source.enabled,
      provider: 'vz-risk / VERIS Community',
      repositoryUrl: env.VCDB_ZIP_URL,
      currentCommitSha: currentRelease?.commitSha,
      currentVerisVersion: currentRelease?.verisVersion,
      lastSuccessfulSync: lastSync ? lastSync.toISOString() : undefined,
      dataAgeHours,
      staleThresholdHours,
      isStale,
      counts,
    };
  }

  getRepository(): VcdbRepository {
    return this.vcdbRepo;
  }
}
