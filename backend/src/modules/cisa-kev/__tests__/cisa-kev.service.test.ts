import { CisaKevService } from '../cisa-kev.service';
import { CisaKevClient } from '../cisa-kev.client';
import { CisaKevRepository } from '../cisa-kev.repository';
import { IngestionRepository } from '../../ingestion/ingestion.repository';
import catalogFixture from './fixtures/cisa-kev-catalog.json';

describe('CisaKevService', () => {
  let service: CisaKevService;
  let mockClient: jest.Mocked<CisaKevClient>;
  let mockKevRepo: jest.Mocked<CisaKevRepository>;
  let mockIngestionRepo: jest.Mocked<IngestionRepository>;

  beforeEach(() => {
    mockClient = {
      fetchCatalog: jest.fn().mockResolvedValue(catalogFixture),
    } as any;

    mockKevRepo = {
      getOrCreateCisaKevDataSource: jest.fn().mockResolvedValue({
        id: 'cisa-source-uuid-1',
        name: 'CISA Known Exploited Vulnerabilities Catalog',
        provider: 'CISA',
        baseUrl: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
        dataType: 'KNOWN_EXPLOITED_VULNERABILITY',
        enabled: true,
        lastSyncAt: new Date().toISOString(),
      }),
      upsertKevEntry: jest.fn(),
      reconcileRemovedEntries: jest.fn().mockResolvedValue(0),
      findByCveId: jest.fn(),
      getActiveKevCount: jest.fn().mockResolvedValue(2),
    } as any;

    mockIngestionRepo = {
      startIngestionRun: jest.fn().mockResolvedValue('run-uuid-kev'),
      finishIngestionRun: jest.fn().mockResolvedValue(undefined),
      findRawRecordByHash: jest.fn(),
      insertRawRecord: jest.fn().mockResolvedValue('raw-kev-record-1'),
      updateDataSourceLastSync: jest.fn().mockResolvedValue(undefined),
      getLatestRun: jest.fn(),
      getLastSuccessfulRun: jest.fn(),
    } as any;

    service = new CisaKevService({
      client: mockClient,
      kevRepo: mockKevRepo,
      ingestionRepo: mockIngestionRepo,
    });
  });

  it('should process full catalog, store raw record, and upsert all entries', async () => {
    mockIngestionRepo.findRawRecordByHash.mockResolvedValueOnce(null);
    mockKevRepo.upsertKevEntry
      .mockResolvedValueOnce('INSERTED')
      .mockResolvedValueOnce('INSERTED');

    const result = await service.syncFullCatalog();

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsReceived).toBe(2);
    expect(result.recordsInserted).toBe(2);
    expect(result.recordsUpdated).toBe(0);
    expect(result.recordsSkipped).toBe(0);

    expect(mockIngestionRepo.insertRawRecord).toHaveBeenCalledTimes(1);
    expect(mockKevRepo.upsertKevEntry).toHaveBeenCalledTimes(2);
    expect(mockKevRepo.reconcileRemovedEntries).toHaveBeenCalledWith([
      'CVE-2021-44228',
      'CVE-2023-38606',
    ]);
  });

  it('should skip entire catalog if identical SHA-256 payload hash exists (idempotency)', async () => {
    mockIngestionRepo.findRawRecordByHash.mockResolvedValueOnce({
      id: 'existing-raw-catalog',
      sourceId: 'cisa-source-uuid-1',
      externalId: 'KEV-CATALOG-2024.05.01',
      payloadJson: catalogFixture,
      payloadHash: 'matching-hash',
      ingestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const result = await service.syncFullCatalog();

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsReceived).toBe(2);
    expect(result.recordsInserted).toBe(0);
    expect(result.recordsSkipped).toBe(2);

    expect(mockIngestionRepo.insertRawRecord).not.toHaveBeenCalled();
    expect(mockKevRepo.upsertKevEntry).not.toHaveBeenCalled();
  });

  it('should calculate data age and report staleness accurately', async () => {
    // 30 hours old -> isStale should be true
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    mockKevRepo.getOrCreateCisaKevDataSource.mockResolvedValueOnce({
      id: 'cisa-source-uuid-1',
      name: 'CISA Known Exploited Vulnerabilities Catalog',
      provider: 'CISA',
      baseUrl: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      dataType: 'KNOWN_EXPLOITED_VULNERABILITY',
      enabled: true,
      lastSyncAt: thirtyHoursAgo,
      createdAt: thirtyHoursAgo,
      updatedAt: thirtyHoursAgo,
    });

    const status = await service.getStatus();

    expect(status.enabled).toBe(true);
    expect(status.dataAgeHours).toBeGreaterThanOrEqual(29);
    expect(status.isStale).toBe(true);
  });
});
