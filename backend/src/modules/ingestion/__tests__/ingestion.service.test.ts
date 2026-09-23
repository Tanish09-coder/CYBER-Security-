import { IngestionService } from '../ingestion.service';
import { IngestionRepository } from '../ingestion.repository';
import { VulnerabilityRepository } from '../../vulnerabilities/vulnerability.repository';
import v31Fixture from '../../nvd/__tests__/fixtures/nvd-cve-v31.json';

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let mockIngestionRepo: jest.Mocked<IngestionRepository>;
  let mockVulnRepo: jest.Mocked<VulnerabilityRepository>;

  beforeEach(() => {
    mockIngestionRepo = {
      getOrCreateNvdDataSource: jest.fn().mockResolvedValue({
        id: 'source-uuid-1',
        name: 'National Vulnerability Database',
        provider: 'NIST',
        baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
        dataType: 'VULNERABILITY',
        enabled: true,
      }),
      startIngestionRun: jest.fn().mockResolvedValue('run-uuid-1'),
      finishIngestionRun: jest.fn().mockResolvedValue(undefined),
      updateDataSourceLastSync: jest.fn().mockResolvedValue(undefined),
      findRawRecordByHash: jest.fn(),
      insertRawRecord: jest.fn().mockResolvedValue('raw-record-uuid-1'),
      getLatestRun: jest.fn(),
      getLastSuccessfulRun: jest.fn(),
    } as any;

    mockVulnRepo = {
      upsertNormalizedVulnerability: jest.fn(),
      findByCveId: jest.fn(),
    } as any;

    ingestionService = new IngestionService(mockIngestionRepo, mockVulnRepo);
  });

  it('should calculate deterministic SHA-256 payload hash', () => {
    const payload1 = { id: 'CVE-2021-44228', score: 10 };
    const payload2 = { score: 10, id: 'CVE-2021-44228' };

    const hash1 = IngestionService.calculatePayloadHash(payload1);
    const hash2 = IngestionService.calculatePayloadHash(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should insert a new CVE and record counts accurately', async () => {
    // No previous raw record exists
    mockIngestionRepo.findRawRecordByHash.mockResolvedValueOnce(null);
    mockVulnRepo.upsertNormalizedVulnerability.mockResolvedValueOnce('INSERTED');

    const result = await ingestionService.processCveItems(
      [v31Fixture as any],
      'CVE_LOOKUP'
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsReceived).toBe(1);
    expect(result.recordsInserted).toBe(1);
    expect(result.recordsUpdated).toBe(0);
    expect(result.recordsSkipped).toBe(0);

    expect(mockIngestionRepo.insertRawRecord).toHaveBeenCalledTimes(1);
    expect(mockVulnRepo.upsertNormalizedVulnerability).toHaveBeenCalledTimes(1);
  });

  it('should skip duplicate unchanged CVE when SHA-256 hash matches', async () => {
    // Existing raw record with identical hash found
    mockIngestionRepo.findRawRecordByHash.mockResolvedValueOnce({
      id: 'existing-raw-id',
      sourceId: 'source-uuid-1',
      externalId: 'CVE-2021-44228',
      payloadJson: v31Fixture,
      payloadHash: 'matching-hash',
      ingestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const result = await ingestionService.processCveItems(
      [v31Fixture as any],
      'CVE_LOOKUP'
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsReceived).toBe(1);
    expect(result.recordsInserted).toBe(0);
    expect(result.recordsUpdated).toBe(0);
    expect(result.recordsSkipped).toBe(1);

    // Should NOT insert new raw record or call normalized upsert
    expect(mockIngestionRepo.insertRawRecord).not.toHaveBeenCalled();
    expect(mockVulnRepo.upsertNormalizedVulnerability).not.toHaveBeenCalled();
  });

  it('should update normalized record when modified CVE arrives with new hash', async () => {
    // New hash -> not in raw repo
    mockIngestionRepo.findRawRecordByHash.mockResolvedValueOnce(null);
    mockVulnRepo.upsertNormalizedVulnerability.mockResolvedValueOnce('UPDATED');

    const result = await ingestionService.processCveItems(
      [v31Fixture as any],
      'CVE_LOOKUP'
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsInserted).toBe(0);
    expect(result.recordsUpdated).toBe(1);
    expect(result.recordsSkipped).toBe(0);
  });
});
