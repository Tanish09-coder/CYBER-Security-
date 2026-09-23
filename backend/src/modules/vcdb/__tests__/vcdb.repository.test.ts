import { VcdbRepository } from '../vcdb.repository';
import { runMigrations, closeDb } from '../../../db';
import { VcdbMapper } from '../vcdb.mapper';

describe('VcdbRepository', () => {
  let repo: VcdbRepository;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await runMigrations();
    repo = new VcdbRepository();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('should get or create VCDB data source', async () => {
    const ds = await repo.getOrCreateVcdbDataSource();
    expect(ds).toBeDefined();
    expect(ds.name).toBe('VERIS Community Database');
  });

  it('should create release and mark current', async () => {
    const r1 = await repo.createRelease({
      verisVersion: '1.3.6',
      repositoryUrl: 'https://example.com/vcdb.zip',
      bundleHash: 'a'.repeat(64),
      totalIncidents: 10,
    });
    expect(r1.bundleHash).toBe('a'.repeat(64));

    await repo.markReleaseCurrent(r1.id);
    const current = await repo.getCurrentRelease();
    expect(current?.id).toBe(r1.id);
    expect(current?.isCurrent).toBe(true);
  });

  it('should upsert normalized incidents and support search, filter, and pagination', async () => {
    const rawInc1 = {
      incident_id: 'INC-DB-100',
      summary: 'Healthcare ransomware breach',
      schema_version: '1.3.6',
      victim: { victim_id: ['HealthPlus'], industry: '622110', country: ['US'] },
      actor: { external: { variety: ['Organized crime'], motive: ['Financial'] } },
      action: { malware: { variety: ['Ransomware'], cve: ['CVE-2023-4444'] } },
      asset: { assets: [{ variety: 'S - Server' }] },
      attribute: { availability: { variety: ['Loss'] } },
      timeline: { incident: { year: 2023 } },
    };

    const rawInc2 = {
      incident_id: 'INC-DB-200',
      summary: 'Financial phishing incident',
      schema_version: '1.3.6',
      victim: { victim_id: ['GlobalBank'], industry: '522110', country: ['UK'] },
      actor: { external: { variety: ['Nation-state'], motive: ['Espionage'] } },
      action: { social: { variety: ['Phishing'] } },
      asset: { assets: [{ variety: 'U - User' }] },
      attribute: { confidentiality: { variety: ['Credentials'] } },
      timeline: { incident: { year: 2024 } },
    };

    const mapped1 = VcdbMapper.toNormalizedIncident(rawInc1);
    const mapped2 = VcdbMapper.toNormalizedIncident(rawInc2);

    expect(mapped1).not.toBeNull();
    expect(mapped2).not.toBeNull();

    await repo.upsertIncidents([mapped1!, mapped2!]);

    // Query incidents
    const resAll = await repo.getIncidents({ page: 1, limit: 10 });
    expect(resAll.total).toBe(2);

    // Filter by search
    const resSearch = await repo.getIncidents({ search: 'ransomware' });
    expect(resSearch.total).toBe(1);
    expect(resSearch.incidents[0].vcdbId).toBe('INC-DB-100');

    // Get single by ID
    const single = await repo.getIncidentByVcdbId('INC-DB-100');
    expect(single).toBeDefined();
    expect(single?.incident.summary).toContain('Healthcare ransomware breach');
    expect(single?.actors).toHaveLength(1);
    expect(single?.actions).toHaveLength(1);
    expect(single?.explicitCves).toHaveLength(1);
    expect(single?.explicitCves[0].cve_id).toBe('CVE-2023-4444');
  });

  it('should non-destructively reconcile removed incidents', async () => {
    // Reconcile with active list containing only INC-DB-100 (so INC-DB-200 is marked removed)
    await repo.reconcileRemovedIncidents(new Set(['INC-DB-100']));

    const inc2Res = await repo.getIncidentByVcdbId('INC-DB-200');
    expect(inc2Res?.incident.isCurrent).toBe(false);
    expect(inc2Res?.incident.removedFromSourceAt).toBeDefined();

    const inc1Res = await repo.getIncidentByVcdbId('INC-DB-100');
    expect(inc1Res?.incident.isCurrent).toBe(true);
  });

  it('should return aggregate statistics', async () => {
    const stats = await repo.getStatistics();
    expect(stats.byYear).toBeDefined();
    expect(stats.byActorCategory).toBeDefined();
    expect(stats.byActionCategory).toBeDefined();
  });
});
