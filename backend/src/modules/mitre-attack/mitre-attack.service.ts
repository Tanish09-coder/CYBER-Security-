import { MitreAttackClient } from './mitre-attack.client';
import { MitreAttackRepository } from './mitre-attack.repository';
import { IngestionRepository } from '../ingestion/ingestion.repository';
import { IngestionService } from '../ingestion/ingestion.service';
import { MitreAttackMapper } from './mitre-attack.mapper';
import {
  MitreAttackSyncResult,
  MitreAttackStatusResponse,
  NormalizedMitreTactic,
  NormalizedMitreTechnique,
  NormalizedMitreMitigation,
  NormalizedMitreGroup,
  NormalizedMitreSoftware,
  NormalizedMitreRelationship,
  StixBaseObject,
} from './mitre-attack.types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class MitreAttackService {
  private client: MitreAttackClient;
  private attackRepo: MitreAttackRepository;
  private ingestionRepo: IngestionRepository;

  constructor(options?: {
    client?: MitreAttackClient;
    attackRepo?: MitreAttackRepository;
    ingestionRepo?: IngestionRepository;
  }) {
    this.client = options?.client || new MitreAttackClient();
    this.attackRepo = options?.attackRepo || new MitreAttackRepository();
    this.ingestionRepo = options?.ingestionRepo || new IngestionRepository();
  }

  async syncEnterpriseAttack(options?: { explicitBundleUrl?: string }): Promise<MitreAttackSyncResult> {
    const startTime = Date.now();
    const source = await this.attackRepo.getOrCreateMitreDataSource();

    // 1. Discover latest release dynamically from official index.json
    let version = 'unknown';
    let bundleUrl: string;
    let releaseModified: string | undefined;

    if (options?.explicitBundleUrl) {
      bundleUrl = options.explicitBundleUrl;
      version = 'custom';
    } else {
      try {
        const release = await this.client.discoverLatestEnterpriseRelease();
        version = release.version;
        bundleUrl = release.url;
        releaseModified = release.modified;
      } catch (err: any) {
        logger.error('Failed to discover latest Enterprise ATT&CK release from official index', {
          error: err.message,
        });
        throw err;
      }
    }

    // 2. Start ingestion run in audit table
    const runId = await this.ingestionRepo.startIngestionRun(
      source.id,
      'FULL_CATALOG' as any,
      {
        version,
        bundleUrl,
        domain: 'enterprise-attack',
      }
    );

    try {
      // 3. Fetch the official release-specific Enterprise STIX 2.1 bundle
      // (Per User Modification 1: fetch bundle associated with discovered release, no silent unversioned fallback)
      const bundle = await this.client.fetchBundle(bundleUrl);
      const objects = bundle.objects || [];

      // 4. Compute deterministic SHA-256 payload hash of the complete bundle
      const payloadHash = IngestionService.calculatePayloadHash(bundle);
      const externalId = `MITRE-ENTERPRISE-${version}`;

      // 5. Idempotency Check: Check if exact SHA-256 bundle hash exists
      const existingRaw = await this.ingestionRepo.findRawRecordByHash(
        source.id,
        externalId,
        payloadHash
      );
      const existingRelease = await this.attackRepo.findReleaseByHash(payloadHash);

      if (existingRaw && existingRelease && existingRelease.isCurrent) {
        logger.info(
          'Official MITRE ATT&CK Enterprise bundle is unchanged since last sync (Identical SHA-256)',
          {
            runId,
            version,
            payloadHash,
          }
        );

        const durationMs = Date.now() - startTime;
        await this.ingestionRepo.finishIngestionRun(runId, {
          status: 'COMPLETED',
          recordsReceived: objects.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          recordsSkipped: objects.length,
          errorCount: 0,
        });

        await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());
        const counts = await this.attackRepo.getEntityCounts();

        return {
          runId,
          status: 'COMPLETED',
          syncType: 'FULL_CATALOG',
          recordsReceived: objects.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          recordsSkipped: objects.length,
          errorCount: 0,
          durationMs,
          version,
          releaseDate: releaseModified,
          bundleHash: payloadHash,
          counts: {
            ...counts,
            unknownTypes: 0,
          },
        };
      }

      // 6. Store immutable full STIX bundle in raw_source_records (source-of-truth provenance)
      const rawRecordId = await this.ingestionRepo.insertRawRecord({
        sourceId: source.id,
        ingestionRunId: runId,
        externalId,
        payloadJson: bundle,
        payloadHash,
        sourcePublishedAt: releaseModified,
      });

      // 7. Register release in mitre_attack_releases
      const releaseRecord = await this.attackRepo.createRelease({
        domain: 'enterprise-attack',
        attackVersion: version,
        releaseDate: releaseModified,
        sourceUrl: bundleUrl,
        sourceRecordId: rawRecordId,
        bundleHash: payloadHash,
      });

      // 8. Classify and normalize STIX objects
      const tactics: NormalizedMitreTactic[] = [];
      const techniques: NormalizedMitreTechnique[] = [];
      const mitigations: NormalizedMitreMitigation[] = [];
      const groups: NormalizedMitreGroup[] = [];
      const software: NormalizedMitreSoftware[] = [];
      const relationships: NormalizedMitreRelationship[] = [];
      let unknownTypesCount = 0;
      let retiredCount = 0;

      for (const obj of objects) {
        if (obj.revoked || obj.x_mitre_deprecated) {
          retiredCount++;
        }

        switch (obj.type) {
          case 'x-mitre-tactic': {
            const mapped = MitreAttackMapper.toNormalizedTactic(obj);
            if (mapped) tactics.push(mapped);
            break;
          }
          case 'attack-pattern': {
            const mapped = MitreAttackMapper.toNormalizedTechnique(obj);
            if (mapped) techniques.push(mapped);
            break;
          }
          case 'course-of-action': {
            const mapped = MitreAttackMapper.toNormalizedMitigation(obj);
            if (mapped) mitigations.push(mapped);
            break;
          }
          case 'intrusion-set': {
            const mapped = MitreAttackMapper.toNormalizedGroup(obj);
            if (mapped) groups.push(mapped);
            break;
          }
          case 'malware':
          case 'tool': {
            const mapped = MitreAttackMapper.toNormalizedSoftware(obj);
            if (mapped) software.push(mapped);
            break;
          }
          case 'relationship': {
            const mapped = MitreAttackMapper.toNormalizedRelationship(obj);
            if (mapped) relationships.push(mapped);
            break;
          }
          default: {
            // Count unknown/un-normalized STIX types (e.g. campaign, identity, marking-definition)
            // Preserved in raw bundle, not fabricated into known entities.
            unknownTypesCount++;
            break;
          }
        }
      }

      logger.info('STIX objects extracted from Enterprise bundle', {
        runId,
        total: objects.length,
        tactics: tactics.length,
        techniques: techniques.length,
        mitigations: mitigations.length,
        groups: groups.length,
        software: software.length,
        relationships: relationships.length,
        unknownTypesCount,
        retiredCount,
      });

      // 9. Upsert normalized entities into database
      let inserted = 0;
      let updated = 0;
      let skipped = 0;

      const [resTac, resTech, resMit, resGrp, resSoft, resRel] = await Promise.all([
        this.attackRepo.upsertTactics(tactics, releaseRecord.id),
        this.attackRepo.upsertTechniques(techniques, releaseRecord.id),
        this.attackRepo.upsertMitigations(mitigations, releaseRecord.id),
        this.attackRepo.upsertGroups(groups, releaseRecord.id),
        this.attackRepo.upsertSoftware(software, releaseRecord.id),
        this.attackRepo.upsertRelationships(relationships, releaseRecord.id),
      ]);

      inserted =
        resTac.inserted +
        resTech.inserted +
        resMit.inserted +
        resGrp.inserted +
        resSoft.inserted +
        resRel.inserted;
      updated =
        resTac.updated +
        resTech.updated +
        resMit.updated +
        resGrp.updated +
        resSoft.updated +
        resRel.updated;
      skipped =
        resTac.skipped +
        resTech.skipped +
        resMit.skipped +
        resGrp.skipped +
        resSoft.skipped +
        resRel.skipped;

      // 10. Authoritatively resolve sub-technique parents from official subtechnique-of relationships
      // (Per User Modification 2: do not derive parent from dotted ID alone; dotted ID used only for consistency)
      const techniqueStixMap = new Map<string, NormalizedMitreTechnique>();
      for (const t of techniques) {
        techniqueStixMap.set(t.stixId, t);
      }

      const subtechniqueLinks: {
        subtechniqueStixId: string;
        parentStixId: string;
        parentAttackId: string;
      }[] = [];

      for (const rel of relationships) {
        if (rel.relationshipType === 'subtechnique-of' && !rel.revoked) {
          const parentTechnique = techniqueStixMap.get(rel.targetStixId);
          const subtechnique = techniqueStixMap.get(rel.sourceStixId);

          if (parentTechnique && subtechnique) {
            // Consistency check against dotted ID
            if (subtechnique.attackId.includes('.')) {
              const expectedParentPrefix = subtechnique.attackId.split('.')[0];
              if (expectedParentPrefix !== parentTechnique.attackId) {
                logger.warn(
                  `ATT&CK dotted ID prefix mismatch: subtechnique ${subtechnique.attackId} linked to ${parentTechnique.attackId} via STIX relationship`,
                  {
                    subtechnique: subtechnique.attackId,
                    parent: parentTechnique.attackId,
                    stixRelationshipId: rel.stixRelationshipId,
                  }
                );
              }
            }

            subtechniqueLinks.push({
              subtechniqueStixId: rel.sourceStixId,
              parentStixId: rel.targetStixId,
              parentAttackId: parentTechnique.attackId,
            });
          }
        }
      }

      const parentsUpdated = await this.attackRepo.updateTechniqueParents(subtechniqueLinks);
      logger.info(
        `Authoritatively resolved ${parentsUpdated} sub-technique parents from official subtechnique-of relationships`
      );

      // 11. Authoritatively resolve tactic <-> technique links from official STIX kill_chain_phases
      const linkedCount = await this.attackRepo.syncTacticTechniquesFromKillChain(releaseRecord.id);
      logger.info(
        `Authoritatively linked ${linkedCount} tactic <-> technique relationships from STIX kill chain phases`,
        { runId, releaseId: releaseRecord.id, linkedCount }
      );

      // 12. Mark the new release current (sets old releases to is_current = FALSE)
      await this.attackRepo.markReleaseCurrent(releaseRecord.id);

      // 13. Finish ingestion run and update data source
      const durationMs = Date.now() - startTime;
      await this.ingestionRepo.finishIngestionRun(runId, {
        status: 'COMPLETED',
        recordsReceived: objects.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        recordsSkipped: skipped,
        errorCount: 0,
      });

      await this.ingestionRepo.updateDataSourceLastSync(source.id, new Date());

      logger.info(`Successfully completed MITRE ATT&CK Enterprise sync [Run: ${runId}]`, {
        runId,
        version,
        inserted,
        updated,
        skipped,
        durationMs,
      });

      const finalCounts = await this.attackRepo.getEntityCounts();

      return {
        runId,
        status: 'COMPLETED',
        syncType: 'FULL_CATALOG',
        recordsReceived: objects.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        recordsSkipped: skipped,
        errorCount: 0,
        durationMs,
        version,
        releaseDate: releaseModified,
        bundleHash: payloadHash,
        counts: {
          ...finalCounts,
          unknownTypes: unknownTypesCount,
        },
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      logger.error(`MITRE ATT&CK Enterprise sync failed: ${err.message}`, {
        runId,
        error: err.message,
        durationMs,
      });

      await this.ingestionRepo.finishIngestionRun(runId, {
        status: 'FAILED',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errorCount: 1,
        errorMessage: err.message,
      });

      // Preserve last valid state, re-throw
      throw err;
    }
  }

  async getStatus(): Promise<MitreAttackStatusResponse> {
    const source = await this.attackRepo.getOrCreateMitreDataSource();
    const [latestRun, lastSuccessfulRun, currentRelease, counts] = await Promise.all([
      this.ingestionRepo.getLatestRun(source.id),
      this.ingestionRepo.getLastSuccessfulRun(source.id),
      this.attackRepo.getCurrentRelease(),
      this.attackRepo.getEntityCounts(),
    ]);

    let dataAgeHours: number | null = null;
    let isStale = false;

    if (source.lastSyncAt) {
      const syncTime = new Date(source.lastSyncAt).getTime();
      const now = Date.now();
      dataAgeHours = Math.max(0, parseFloat(((now - syncTime) / (1000 * 60 * 60)).toFixed(1)));
      isStale = dataAgeHours > env.MITRE_ATTACK_STALE_AFTER_HOURS;
    } else {
      isStale = true;
    }

    return {
      enabled: source.enabled,
      domain: 'enterprise-attack',
      currentVersion: currentRelease?.attackVersion || null,
      releaseDate: currentRelease?.releaseDate || null,
      bundleHash: currentRelease?.bundleHash || null,
      lastSuccessfulSync: lastSuccessfulRun,
      latestRun,
      dataAgeHours,
      isStale,
      staleThresholdHours: env.MITRE_ATTACK_STALE_AFTER_HOURS,
      counts,
    };
  }

  async checkStaleness(): Promise<{ isStale: boolean; dataAgeHours: number | null }> {
    const status = await this.getStatus();
    return {
      isStale: status.isStale,
      dataAgeHours: status.dataAgeHours,
    };
  }

  // Delegated query methods for controllers
  getRepository(): MitreAttackRepository {
    return this.attackRepo;
  }
}
