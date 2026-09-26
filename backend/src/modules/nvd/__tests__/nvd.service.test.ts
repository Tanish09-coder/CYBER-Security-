import { NvdService } from '../nvd.service';
import { NvdClient } from '../nvd.client';
import { IngestionService } from '../../ingestion/ingestion.service';
import { IngestionRepository } from '../../ingestion/ingestion.repository';
import { VulnerabilityRepository } from '../../vulnerabilities/vulnerability.repository';
import v31Fixture from './fixtures/nvd-cve-v31.json';

describe('NvdService', () => {
  let nvdService: NvdService;
  let mockClient: jest.Mocked<NvdClient>;
  let mockIngestionService: jest.Mocked<IngestionService>;
  let mockIngestionRepo: jest.Mocked<IngestionRepository>;
  let mockVulnRepo: jest.Mocked<VulnerabilityRepository>;

  beforeEach(() => {
    mockClient = {
      fetchCveById: jest.fn(),
      fetchCvesByDateRange: jest.fn(),
      fetchModifiedCves: jest.fn(),
    } as any;

    mockIngestionService = {
      processCveItems: jest.fn(),
    } as any;

    mockIngestionRepo = {
      getOrCreateNvdDataSource: jest.fn().mockResolvedValue({
        id: 'source-1',
        name: 'National Vulnerability Database',
        provider: 'NIST',
        baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
        dataType: 'VULNERABILITY',
        enabled: true,
        lastSyncAt: undefined,
      }),
      getLatestRun: jest.fn(),
      getLastSuccessfulRun: jest.fn(),
    } as any;

    mockVulnRepo = {
      findByCveId: jest.fn(),
    } as any;

    nvdService = new NvdService({
      nvdClient: mockClient,
      ingestionService: mockIngestionService,
      ingestionRepo: mockIngestionRepo,
      vulnRepo: mockVulnRepo,
    });
  });

  it('should sync a single CVE by ID and return stored vulnerability', async () => {
    mockClient.fetchCveById.mockResolvedValueOnce(v31Fixture as any);
    mockIngestionService.processCveItems.mockResolvedValueOnce({
      runId: 'run-1',
      status: 'COMPLETED',
      syncType: 'CVE_LOOKUP',
      recordsReceived: 1,
      recordsInserted: 1,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errorCount: 0,
      durationMs: 120,
    });
    mockVulnRepo.findByCveId.mockResolvedValueOnce({
      id: 'vuln-1',
      cveId: 'CVE-2021-44228',
      description: 'Log4j vulnerability',
      source: 'NVD',
      sourceRecordId: 'CVE-2021-44228',
      knownExploited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { result, vulnerability } = await nvdService.syncCveById('CVE-2021-44228');

    expect(result.status).toBe('COMPLETED');
    expect(result.recordsInserted).toBe(1);
    expect(vulnerability?.cveId).toBe('CVE-2021-44228');
    expect(mockClient.fetchCveById).toHaveBeenCalledWith('CVE-2021-44228');
  });

  it('should throw an error when CVE is not found in NVD', async () => {
    mockClient.fetchCveById.mockResolvedValueOnce(null);

    await expect(nvdService.syncCveById('CVE-1999-99999')).rejects.toThrow(
      'CVE CVE-1999-99999 not found in the official NVD database'
    );
  });

  it('should fallback to 30 days if incremental sync has no prior sync timestamp', async () => {
    mockIngestionRepo.getOrCreateNvdDataSource.mockResolvedValueOnce({
      id: 'source-1',
      name: 'National Vulnerability Database',
      provider: 'NIST',
      baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
      dataType: 'VULNERABILITY',
      enabled: true,
      lastSyncAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockClient.fetchModifiedCves.mockResolvedValueOnce({
      totalResults: 0,
      startIndex: 0,
      resultsPerPage: 100,
      format: 'NVD_CVE',
      version: '2.0',
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
    });

    mockIngestionService.processCveItems.mockResolvedValueOnce({
      runId: 'run-incremental',
      status: 'COMPLETED',
      syncType: 'INCREMENTAL',
      recordsReceived: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errorCount: 0,
      durationMs: 80,
    });

    const result = await nvdService.syncIncremental();
    expect(result.status).toBe('COMPLETED');
  });

  it('should execute incremental sync when lastSyncAt exists', async () => {
    mockIngestionRepo.getOrCreateNvdDataSource.mockResolvedValueOnce({
      id: 'source-1',
      name: 'National Vulnerability Database',
      provider: 'NIST',
      baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
      dataType: 'VULNERABILITY',
      enabled: true,
      lastSyncAt: '2026-09-01T00:00:00.000Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockClient.fetchModifiedCves.mockResolvedValueOnce({
      totalResults: 1,
      startIndex: 0,
      resultsPerPage: 100,
      format: 'NVD_CVE',
      version: '2.0',
      timestamp: new Date().toISOString(),
      vulnerabilities: [{ cve: v31Fixture as any }],
    });

    mockIngestionService.processCveItems.mockResolvedValueOnce({
      runId: 'run-incremental',
      status: 'COMPLETED',
      syncType: 'INCREMENTAL',
      recordsReceived: 1,
      recordsInserted: 0,
      recordsUpdated: 1,
      recordsSkipped: 0,
      errorCount: 0,
      durationMs: 80,
    });

    const result = await nvdService.syncIncremental();

    expect(result.status).toBe('COMPLETED');
    expect(mockClient.fetchModifiedCves).toHaveBeenCalledWith(
      expect.objectContaining({
        lastModStartDate: '2026-09-01T00:00:00.000Z',
      })
    );
  });
});
