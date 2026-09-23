import { VcdbService } from '../vcdb.service';
import { VcdbClient } from '../vcdb.client';
import { VcdbRepository } from '../vcdb.repository';
import { runMigrations, closeDb } from '../../../db';
import AdmZip from 'adm-zip';

describe('VcdbService', () => {
  let service: VcdbService;
  let repo: VcdbRepository;
  let mockClient: jest.Mocked<VcdbClient>;
  let staticZipBuffer: Buffer;
  const rawIncidents = [
    {
      incident_id: 'INC-SVC-001',
      summary: 'Service test incident',
      actor: { external: { variety: ['External'] } },
    },
  ];

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await runMigrations();

    const zip = new AdmZip();
    zip.addFile('vcdb.json', Buffer.from(JSON.stringify(rawIncidents), 'utf-8'));
    staticZipBuffer = zip.toBuffer();
  });

  afterAll(async () => {
    await closeDb();
  });

  beforeEach(() => {
    repo = new VcdbRepository();
    mockClient = {
      fetchCanonicalJoinedZip: jest.fn(),
      fetchCommitSha: jest.fn().mockResolvedValue('sha-mock-12345'),
      fetchVerisVersion: jest.fn().mockResolvedValue('1.3.6'),
    } as any;

    service = new VcdbService({ client: mockClient, vcdbRepo: repo });
  });

  it('should run full VCDB sync pipeline successfully', async () => {
    mockClient.fetchCanonicalJoinedZip.mockResolvedValue({
      incidents: rawIncidents,
      commitSha: 'sha-mock-12345',
      verisVersion: '1.3.6',
      bundleHashBuffer: staticZipBuffer,
    });

    const result = await service.syncVcdb({ force: true });
    expect(result.status).toBe('COMPLETED');
    expect(result.totalDiscovered).toBe(1);
    expect(result.recordsInserted).toBe(1);

    const status = await service.getStatus();
    expect(status.enabled).toBe(true);
    expect(status.counts.incidents).toBe(1);
  });

  it('should skip ingestion if zip hash has not changed (idempotency)', async () => {
    mockClient.fetchCanonicalJoinedZip.mockResolvedValue({
      incidents: rawIncidents,
      commitSha: 'sha-mock-12345',
      verisVersion: '1.3.6',
      bundleHashBuffer: staticZipBuffer,
    });

    // Second sync with identical buffer and without force option
    const result = await service.syncVcdb();
    expect(result.status).toBe('SKIPPED_IDENTICAL');
    expect(result.recordsInserted).toBe(0);
  });
});
