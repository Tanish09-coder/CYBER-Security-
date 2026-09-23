import { MitreAttackRepository } from '../mitre-attack.repository';
import { runMigrations, closeDb } from '../../../db';

describe('MitreAttackRepository', () => {
  let repo: MitreAttackRepository;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await runMigrations();
    repo = new MitreAttackRepository();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('should get or create MITRE ATT&CK Enterprise data source', async () => {
    const ds = await repo.getOrCreateMitreDataSource();
    expect(ds).toBeDefined();
    expect(ds.name).toBe('MITRE ATT&CK Enterprise');
    expect(ds.provider).toBe('MITRE');
    expect(ds.enabled).toBe(true);
  });

  it('should create releases and enforce single active current release', async () => {
    const r1 = await repo.createRelease({
      domain: 'enterprise-attack',
      attackVersion: '18.1',
      sourceUrl: 'https://example.com/enterprise-18.1.json',
      bundleHash: 'hash-18.1',
    });
    expect(r1.attackVersion).toBe('18.1');

    await repo.markReleaseCurrent(r1.id);
    let current = await repo.getCurrentRelease();
    expect(current?.id).toBe(r1.id);
    expect(current?.attackVersion).toBe('18.1');

    const r2 = await repo.createRelease({
      domain: 'enterprise-attack',
      attackVersion: '19.2',
      sourceUrl: 'https://example.com/enterprise-19.2.json',
      bundleHash: 'hash-19.2',
    });

    await repo.markReleaseCurrent(r2.id);
    current = await repo.getCurrentRelease();
    expect(current?.id).toBe(r2.id);
    expect(current?.attackVersion).toBe('19.2');

    // r1 should now have is_current = false
    const r1Check = await repo.findReleaseByHash('hash-18.1');
    expect(r1Check?.isCurrent).toBe(false);
  });

  it('should upsert tactics and support search and pagination', async () => {
    const current = await repo.getCurrentRelease();
    const releaseId = current!.id;

    const res = await repo.upsertTactics(
      [
        {
          stixId: 'x-mitre-tactic--ta0001',
          attackId: 'TA0001',
          name: 'Initial Access',
          shortName: 'initial-access',
          revoked: false,
          deprecated: false,
        },
        {
          stixId: 'x-mitre-tactic--ta0002',
          attackId: 'TA0002',
          name: 'Execution',
          shortName: 'execution',
          revoked: false,
          deprecated: false,
        },
        {
          stixId: 'x-mitre-tactic--retired',
          attackId: 'TA0099',
          name: 'Old Tactic',
          shortName: 'old-tactic',
          revoked: true,
          deprecated: false,
        },
      ],
      releaseId
    );

    expect(res.inserted).toBe(3);

    const activeList = await repo.getTactics({ includeRetired: false });
    expect(activeList.tactics.length).toBe(2);

    const allList = await repo.getTactics({ includeRetired: true });
    expect(allList.tactics.length).toBe(3);

    const searchRes = await repo.getTactics({ search: 'Execution' });
    expect(searchRes.tactics.length).toBe(1);
    expect(searchRes.tactics[0].attackId).toBe('TA0002');
  });

  it('should upsert techniques and authoritatively update subtechnique parents', async () => {
    const current = await repo.getCurrentRelease();
    const releaseId = current!.id;

    await repo.upsertTechniques(
      [
        {
          stixId: 'attack-pattern--parent',
          attackId: 'T1059',
          name: 'Command and Scripting Interpreter',
          isSubtechnique: false,
          platforms: ['Windows', 'Linux'],
          killChainPhases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
          revoked: false,
          deprecated: false,
        },
        {
          stixId: 'attack-pattern--sub',
          attackId: 'T1059.001',
          name: 'PowerShell',
          isSubtechnique: true,
          platforms: ['Windows'],
          killChainPhases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
          revoked: false,
          deprecated: false,
        },
      ],
      releaseId
    );

    // Update parent link
    const updated = await repo.updateTechniqueParents([
      {
        subtechniqueStixId: 'attack-pattern--sub',
        parentStixId: 'attack-pattern--parent',
        parentAttackId: 'T1059',
      },
    ]);
    expect(updated).toBe(1);

    const detail = await repo.getTechniqueByAttackId('T1059.001');
    expect(detail).not.toBeNull();
    expect(detail.technique.attackId).toBe('T1059.001');
    expect(detail.parentTechnique?.attackId).toBe('T1059');
  });

  it('should authoritatively sync tactic-technique links from official kill_chain_phases and return >0 techniques', async () => {
    const current = await repo.getCurrentRelease();
    const releaseId = current!.id;

    // Upsert Initial Access techniques including active and deprecated ones
    await repo.upsertTechniques(
      [
        {
          stixId: 'attack-pattern--t1190',
          attackId: 'T1190',
          name: 'Exploit Public-Facing Application',
          isSubtechnique: false,
          platforms: ['Windows', 'Linux'],
          killChainPhases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
          revoked: false,
          deprecated: false,
        },
        {
          stixId: 'attack-pattern--t1566',
          attackId: 'T1566',
          name: 'Phishing',
          isSubtechnique: false,
          platforms: ['Windows', 'macOS', 'Linux'],
          killChainPhases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
          revoked: false,
          deprecated: false,
        },
        {
          stixId: 'attack-pattern--t1190-old',
          attackId: 'T1190.OLD',
          name: 'Old Initial Access Method',
          isSubtechnique: false,
          platforms: ['Windows'],
          killChainPhases: [{ kill_chain_name: 'mitre-attack', phase_name: 'initial-access' }],
          revoked: false,
          deprecated: true,
        },
      ],
      releaseId
    );

    // Sync from kill chain
    const count = await repo.syncTacticTechniquesFromKillChain(releaseId);
    expect(count).toBeGreaterThan(0);

    // TA0001 / Initial Access should return >0 techniques
    const ta0001 = await repo.getTacticByAttackId('TA0001');
    expect(ta0001).not.toBeNull();
    expect(ta0001!.tactic.name).toBe('Initial Access');
    expect(ta0001!.techniques.length).toBeGreaterThan(0);
    expect(ta0001!.techniques.some((t) => t.attackId === 'T1190')).toBe(true);
    expect(ta0001!.techniques.some((t) => t.attackId === 'T1566')).toBe(true);

    // TA0002 / Execution should also return mapped techniques
    const ta0002 = await repo.getTacticByAttackId('TA0002');
    expect(ta0002).not.toBeNull();
    expect(ta0002!.techniques.length).toBeGreaterThan(0);
    expect(ta0002!.techniques.some((t) => t.attackId === 'T1059')).toBe(true);
  });

  it('should ensure tactic-technique junction inserts are idempotent', async () => {
    const current = await repo.getCurrentRelease();
    const releaseId = current!.id;

    // Running sync a second time must return 0 new inserts and not throw
    const secondCount = await repo.syncTacticTechniquesFromKillChain(releaseId);
    expect(secondCount).toBe(0);

    // Technique counts on TA0001 must remain unchanged
    const ta0001 = await repo.getTacticByAttackId('TA0001');
    expect(ta0001!.techniques.length).toBe(2);
  });

  it('should return correct mapped techniques when querying by tactic attack_id or short_name', async () => {
    // Query by attack_id
    const byId = await repo.getTacticByAttackId('TA0001');
    expect(byId).not.toBeNull();
    expect(byId!.techniques.map((t) => t.attackId).sort()).toEqual(['T1190', 'T1566']);

    // Query by short_name (case-insensitive)
    const byShortName = await repo.getTacticByAttackId('initial-access');
    expect(byShortName).not.toBeNull();
    expect(byShortName!.tactic.attackId).toBe('TA0001');
    expect(byShortName!.techniques.length).toBe(byId!.techniques.length);

    // Query via getTechniques({ tactic: 'TA0001' })
    const techQuery = await repo.getTechniques({ tactic: 'TA0001' });
    expect(techQuery.techniques.length).toBe(byId!.techniques.length);
    expect(techQuery.techniques.some((t) => t.attackId === 'T1190')).toBe(true);
    expect(techQuery.techniques.some((t) => t.attackId === 'T1566')).toBe(true);
  });

  it('should ensure retired/deprecated filtering does not accidentally remove valid current mappings', async () => {
    // Active query (default: includeRetired = false)
    const active = await repo.getTacticByAttackId('TA0001');
    expect(active).not.toBeNull();
    // Must return valid active techniques (never 0!)
    expect(active!.techniques.length).toBe(2);
    expect(active!.techniques.every((t) => !t.revoked && !t.deprecated)).toBe(true);

    // Include retired query
    const all = await repo.getTacticByAttackId('TA0001', { includeRetired: true });
    expect(all).not.toBeNull();
    expect(all!.techniques.length).toBe(3); // 2 active + 1 deprecated
    expect(all!.techniques.some((t) => t.attackId === 'T1190.OLD')).toBe(true);

    // Query through getTechniques filter
    const activeFilter = await repo.getTechniques({ tactic: 'TA0001', includeRetired: false });
    expect(activeFilter.techniques.length).toBe(2);

    const allFilter = await repo.getTechniques({ tactic: 'TA0001', includeRetired: true });
    expect(allFilter.techniques.length).toBe(3);
  });

  it('should upsert mitigations, groups, software, and relationships', async () => {
    const current = await repo.getCurrentRelease();
    const releaseId = current!.id;

    await repo.upsertMitigations(
      [
        {
          stixId: 'course-of-action--m1',
          attackId: 'M1049',
          name: 'Antivirus',
          revoked: false,
          deprecated: false,
        },
      ],
      releaseId
    );

    await repo.upsertGroups(
      [
        {
          stixId: 'intrusion-set--g1',
          attackId: 'G0016',
          name: 'APT29',
          aliases: ['Cozy Bear'],
          revoked: false,
          deprecated: false,
        },
      ],
      releaseId
    );

    await repo.upsertSoftware(
      [
        {
          stixId: 'tool--s1',
          attackId: 'S0029',
          name: 'PsExec',
          softwareType: 'TOOL',
          aliases: [],
          revoked: false,
          deprecated: false,
        },
      ],
      releaseId
    );

    await repo.upsertRelationships(
      [
        {
          stixRelationshipId: 'relationship--rel1',
          relationshipType: 'mitigates',
          sourceStixId: 'course-of-action--m1',
          targetStixId: 'attack-pattern--parent',
          revoked: false,
        },
      ],
      releaseId
    );

    const counts = await repo.getEntityCounts();
    expect(counts.tactics).toBeGreaterThanOrEqual(2);
    expect(counts.techniques).toBeGreaterThanOrEqual(1);
    expect(counts.subtechniques).toBeGreaterThanOrEqual(1);
    expect(counts.mitigations).toBeGreaterThanOrEqual(1);
    expect(counts.groups).toBeGreaterThanOrEqual(1);
    expect(counts.software).toBeGreaterThanOrEqual(1);
    expect(counts.relationships).toBeGreaterThanOrEqual(1);
  });
});
