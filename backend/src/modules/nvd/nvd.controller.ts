import { Request, Response } from 'express';
import { NvdService } from './nvd.service';
import { VulnerabilityService } from '../vulnerabilities/vulnerability.service';
import { cveIdSchema, dateRangeSchema } from './nvd.validation';
import { vulnerabilityListQuerySchema } from '../vulnerabilities/vulnerability.validation';
import { logger } from '../../config/logger';

export class NvdController {
  private nvdService: NvdService;
  private vulnService: VulnerabilityService;

  constructor(nvdService?: NvdService, vulnService?: VulnerabilityService) {
    this.nvdService = nvdService || new NvdService();
    this.vulnService = vulnService || new VulnerabilityService();
  }

  syncCve = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = cveIdSchema.safeParse(req.params.cveId);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const cveId = validation.data;
      const { result, vulnerability } = await this.nvdService.syncCveById(cveId);

      res.status(200).json({
        message: `Successfully synchronized ${cveId}`,
        syncResult: result,
        vulnerability,
      });
    } catch (err: any) {
      logger.error('Failed to sync CVE by ID', { error: err.message });
      const status = err.name === 'NvdRateLimitError' ? 429 : 500;
      res.status(status).json({
        error: err.name || 'SyncError',
        message: err.message,
      });
    }
  };

  syncDateRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = dateRangeSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const { startDate, endDate, resultsPerPage } = validation.data;
      const result = await this.nvdService.syncDateRange(
        startDate,
        endDate,
        resultsPerPage
      );

      res.status(200).json({
        message: 'Date range sync completed',
        syncResult: result,
      });
    } catch (err: any) {
      logger.error('Failed date range sync', { error: err.message });
      res.status(500).json({
        error: err.name || 'SyncError',
        message: err.message,
      });
    }
  };

  syncIncremental = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.nvdService.syncIncremental();
      res.status(200).json({
        message: 'Incremental sync completed',
        syncResult: result,
      });
    } catch (err: any) {
      logger.error('Failed incremental sync', { error: err.message });
      res.status(500).json({
        error: err.name || 'SyncError',
        message: err.message,
      });
    }
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.nvdService.getSyncStatus();
      res.status(200).json(status);
    } catch (err: any) {
      logger.error('Failed to get sync status', { error: err.message });
      res.status(500).json({
        error: 'StatusError',
        message: err.message,
      });
    }
  };

  listVulnerabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = vulnerabilityListQuerySchema.safeParse(req.query);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const queryParams = validation.data;
      const result = await this.vulnService.listVulnerabilities(queryParams);

      res.status(200).json(result);
    } catch (err: any) {
      logger.error('Failed to list vulnerabilities', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: 'Failed to retrieve vulnerabilities',
      });
    }
  };

  getVulnerability = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = cveIdSchema.safeParse(req.params.cveId);
      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.errors.map((e) => e.message),
        });
        return;
      }

      const cveId = validation.data;
      const vuln = await this.vulnService.getVulnerabilityByCveId(cveId);

      if (!vuln) {
        res.status(404).json({
          error: 'NotFound',
          message: `Vulnerability ${cveId} not found in local database`,
        });
        return;
      }

      res.status(200).json(vuln);
    } catch (err: any) {
      logger.error('Failed to get vulnerability', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };
}
