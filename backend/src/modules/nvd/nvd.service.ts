import { NvdClient } from './nvd.client';
import { IngestionService } from '../ingestion/ingestion.service';
import { IngestionRepository } from '../ingestion/ingestion.repository';
import { VulnerabilityRepository } from '../vulnerabilities/vulnerability.repository';
import { IngestionResult } from '../ingestion/ingestion.types';
import { StoredVulnerability } from '../vulnerabilities/vulnerability.types';
import { logger } from '../../config/logger';

export class NvdService {
  private nvdClient: NvdClient;
  private ingestionService: IngestionService;
  private ingestionRepo: IngestionRepository;
  private vulnRepo: VulnerabilityRepository;

  constructor(options?: {
    nvdClient?: NvdClient;
    ingestionService?: IngestionService;
    ingestionRepo?: IngestionRepository;
    vulnRepo?: VulnerabilityRepository;
  }) {
    this.nvdClient = options?.nvdClient || new NvdClient();
    this.ingestionRepo = options?.ingestionRepo || new IngestionRepository();
    this.vulnRepo = options?.vulnRepo || new VulnerabilityRepository();
    this.ingestionService =
      options?.ingestionService ||
      new IngestionService(this.ingestionRepo, this.vulnRepo);
  }

  async syncCveById(
    cveId: string
  ): Promise<{ result: IngestionResult; vulnerability: StoredVulnerability | null }> {
    const cleanId = cveId.trim().toUpperCase();
    const cve = await this.nvdClient.fetchCveById(cleanId);

    if (!cve) {
      throw new Error(`CVE ${cleanId} not found in the official NVD database`);
    }

    const result = await this.ingestionService.processCveItems(
      [cve],
      'CVE_LOOKUP',
      { cveId: cleanId }
    );

    const vulnerability = await this.vulnRepo.findByCveId(cleanId);
    return { result, vulnerability };
  }

  async syncDateRange(
    startDate: string,
    endDate: string,
    pageSize: number = 100
  ): Promise<IngestionResult> {
    let startIndex = 0;
    let totalResults = 0;
    const allCves = [];

    do {
      const response = await this.nvdClient.fetchCvesByDateRange({
        pubStartDate: startDate,
        pubEndDate: endDate,
        startIndex,
        resultsPerPage: pageSize,
      });

      totalResults = response.totalResults;
      const cves = (response.vulnerabilities || []).map((v) => v.cve);
      allCves.push(...cves);
      startIndex += cves.length;

      logger.info(`Fetched NVD page: ${startIndex}/${totalResults} CVEs`);
    } while (startIndex < totalResults && allCves.length < totalResults);

    return await this.ingestionService.processCveItems(
      allCves,
      'DATE_RANGE',
      { startDate, endDate, totalResults }
    );
  }

  async syncIncremental(pageSize: number = 100): Promise<IngestionResult> {
    const source = await this.ingestionRepo.getOrCreateNvdDataSource();

    if (!source.lastSyncAt) {
      throw new Error(
        'No previous synchronization found. An explicit date range is required for initial sync to avoid downloading the full historical NVD archive.'
      );
    }

    const lastModStartDate = new Date(source.lastSyncAt).toISOString();
    const lastModEndDate = new Date().toISOString();

    let startIndex = 0;
    let totalResults = 0;
    const allCves = [];

    do {
      const response = await this.nvdClient.fetchModifiedCves({
        lastModStartDate,
        lastModEndDate,
        startIndex,
        resultsPerPage: pageSize,
      });

      totalResults = response.totalResults;
      const cves = (response.vulnerabilities || []).map((v) => v.cve);
      allCves.push(...cves);
      startIndex += cves.length;

      logger.info(`Fetched incremental page: ${startIndex}/${totalResults} CVEs`);
    } while (startIndex < totalResults && allCves.length < totalResults);

    return await this.ingestionService.processCveItems(
      allCves,
      'INCREMENTAL',
      { lastModStartDate, lastModEndDate, totalResults }
    );
  }

  async getSyncStatus(): Promise<{
    enabled: boolean;
    sourceUrl: string;
    lastSyncAt: string | null;
    lastSuccessfulRun: any;
    latestRun: any;
    dataAgeHours?: number | null;
    isStale?: boolean;
    staleThresholdHours?: number;
  }> {
    const source = await this.ingestionRepo.getOrCreateNvdDataSource();
    const [latestRun, lastSuccessfulRun] = await Promise.all([
      this.ingestionRepo.getLatestRun(source.id),
      this.ingestionRepo.getLastSuccessfulRun(source.id),
    ]);

    let dataAgeHours: number | null = null;
    let isStale = false;

    if (source.lastSyncAt) {
      const syncTime = new Date(source.lastSyncAt).getTime();
      const now = Date.now();
      dataAgeHours = Math.max(0, parseFloat(((now - syncTime) / (1000 * 60 * 60)).toFixed(1)));
      isStale = dataAgeHours > 24;
    }

    return {
      enabled: source.enabled,
      sourceUrl: source.baseUrl,
      lastSyncAt: source.lastSyncAt || null,
      lastSuccessfulRun,
      latestRun,
      dataAgeHours,
      isStale,
      staleThresholdHours: 24,
    };
  }
}
