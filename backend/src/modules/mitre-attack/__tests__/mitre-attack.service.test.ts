import { MitreAttackService } from '../mitre-attack.service';
import { MitreAttackClient } from '../mitre-attack.client';
import { MitreAttackRepository } from '../mitre-attack.repository';
import { IngestionRepository } from '../../ingestion/ingestion.repository';
import { runMigrations, closeDb } from '../../../db';
import { MitreAttackUnavailableError } from '../mitre-attack.validation';

describe('MitreAttackService', () => {
  let service: MitreAttackService;
  let mockClient: jest.Mocked<MitreAttackClient>;
  let attackRepo: MitreAttackRepository;
  let ingestionRepo: IngestionRepository;

  const mockIndexRelease = {
    version: '19.2',
    url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.2.json',
    modified: '2026-08-05T21:33:58.496Z',
    collectionId: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
  };

  const sampleStixBundle = {
    type: 'bundle' as const,
    id: 'bundle--enterprise-test',
    spec_version: '2.1',
    objects: [
      {
        type: 'x-mitre-tactic',
        id: 'x-mitre-tactic--ta0001',
        name: 'Initial Access',
        x_mitre_shortname: 'initial-access',
        external_references: [{ source_name: 'mitre-attack', external_id: 'TA0001' }],
      },
      {
        type: 'attack-pattern',
        id: 'attack-pattern--t1059',
        name: 'Command and Scripting Interpreter',
        x_mitre_is_subtechnique: false,
        x_mitre_platforms: ['Windows', 'Linux'],
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
        external_references: [{ source_name: 'mitre-attack', external_id: 'T1059' }],
      },
      {
        type: 'attack-pattern',
        id: 'attack-pattern--t1059-001',
        name: 'PowerShell',
        x_mitre_is_subtechnique: true,
        x_mitre_platforms: ['Windows'],
        kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
        external_references: [{ source_name: 'mitre-attack', external_id: 'T1059.001' }],
      },
      {
        type: 'relationship',
        id: 'relationship--sub-parent',
        relationship_type: 'subtechnique-of',
        source_ref: 'attack-pattern--t1059-001',
        target_ref: 'attack-pattern--t1059',
      },
      {
        type: 'course-of-action',
        id: 'course-of-action--m1036',
        name: 'Account Use Policies',
        external_references: [{ source_name: 'mitre-attack', external_id: 'M1036' }],
      },
      {
        type: 'intrusion-set',
        id: 'intrusion-set--g0001',
        name: 'Axiom',
        aliases: ['Axiom Group'],
        external_references: [{ source_name: 'mitre-attack', external_id: 'G0001' }],
      },
      {
        type: 'tool',
        id: 'tool--s0001',
        name: 'China Chopper',
        external_references: [{ source_name: 'mitre-attack', external_id: 'S0001' }],
      },
      {
        type: 'relationship',
        id: 'relationship--use-tool',
        relationship_type: 'uses',
        source_ref: 'intrusion-set--g0001',
        target_ref: 'tool--s0001',
      },
      // Unknown type that should be preserved in raw bundle and counted
      {
        type: 'campaign',
        id: 'campaign--c0001',
        name: 'Operation Ghost',
      },
    ],
  };

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await runMigrations();
    attackRepo = new MitreAttackRepository();
    ingestionRepo = new IngestionRepository();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(() => {
    mockClient = {
      discoverLatestEnterpriseRelease: jest.fn().mockResolvedValue(mockIndexRelease),
      fetchBundle: jest.fn().mockResolvedValue(sampleStixBundle),
      fetchIndex: jest.fn(),
      getDefaultEnterpriseUrl: jest.fn().mockReturnValue('https://example.com/default.json'),
    } as any;

    service = new MitreAttackService({
      client: mockClient,
      attackRepo,
      ingestionRepo,
    });
  });

  it('should successfully run first sync, store raw record, calculate SHA-256, and link entities', async () => {
    const result = await service.syncEnterpriseAttack();

    expect(result.status).toBe('COMPLETED');
    expect(result.version).toBe('19.2');
    expect(result.bundleHash).toBeDefined();
    expect(result.recordsReceived).toBe(sampleStixBundle.objects.length);
    expect(result.recordsInserted).toBeGreaterThan(0);
    expect(result.recordsSkipped).toBe(0);
    expect(result.counts.tactics).toBeGreaterThanOrEqual(1);
    expect(result.counts.techniques).toBeGreaterThanOrEqual(1);
    expect(result.counts.subtechniques).toBeGreaterThanOrEqual(1);
    expect(result.counts.mitigations).toBeGreaterThanOrEqual(1);
    expect(result.counts.groups).toBeGreaterThanOrEqual(1);
    expect(result.counts.software).toBeGreaterThanOrEqual(1);
    expect(result.counts.relationships).toBeGreaterThanOrEqual(2);
    expect(result.counts.unknownTypes).toBe(1); // The campaign object

    // Verify authoritative tactic <-> technique linking from STIX kill chain phases
    const ta0001 = await attackRepo.getTacticByAttackId('TA0001');
    expect(ta0001).not.toBeNull();
    expect(ta0001!.techniques.length).toBe(2);
    expect(ta0001!.techniques.map((t) => t.attackId).sort()).toEqual(['T1059', 'T1059.001']);
  });

  it('should skip duplicate unchanged sync when SHA-256 hash matches (idempotency)', async () => {
    const secondResult = await service.syncEnterpriseAttack();

    expect(secondResult.status).toBe('COMPLETED');
    expect(secondResult.recordsInserted).toBe(0);
    expect(secondResult.recordsUpdated).toBe(0);
    expect(secondResult.recordsSkipped).toBe(sampleStixBundle.objects.length);
    expect(secondResult.errorCount).toBe(0);
  });

  it('should preserve last valid state during source outage / network failure', async () => {
    const statusBefore = await service.getStatus();
    expect(statusBefore.currentVersion).toBe('19.2');

    // Simulate upstream outage
    mockClient.discoverLatestEnterpriseRelease.mockRejectedValueOnce(
      new MitreAttackUnavailableError('Connection refused to GitHub')
    );

    await expect(service.syncEnterpriseAttack()).rejects.toThrow(MitreAttackUnavailableError);

    // Verify last valid state is still intact
    const statusAfter = await service.getStatus();
    expect(statusAfter.currentVersion).toBe('19.2');
    expect(statusAfter.counts.tactics).toBeGreaterThanOrEqual(1);
  });

  it('should report status and calculate staleness against threshold', async () => {
    const status = await service.getStatus();
    expect(status.enabled).toBe(true);
    expect(status.domain).toBe('enterprise-attack');
    expect(status.currentVersion).toBe('19.2');
    expect(status.staleThresholdHours).toBe(168);
    expect(typeof status.isStale).toBe('boolean');
  });
});
