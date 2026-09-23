import { Request, Response } from 'express';
import { CisaKevService } from './cisa-kev.service';
import { cveIdSchema } from './cisa-kev.validation';
import { logger } from '../../config/logger';

export class CisaKevController {
  private kevService: CisaKevService;

  constructor(kevService?: CisaKevService) {
    this.kevService = kevService || new CisaKevService();
  }

  syncCatalog = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Initiating manual CISA KEV full catalog synchronization');
      const result = await this.kevService.syncFullCatalog();

      res.status(200).json({
        message: 'CISA KEV catalog synchronization completed',
        syncResult: result,
      });
    } catch (err: any) {
      logger.error('Failed CISA KEV synchronization', { error: err.message });
      const status =
        err.name === 'CisaKevUnavailableError'
          ? 503
          : err.name === 'CisaKevTimeoutError'
          ? 504
          : 500;

      res.status(status).json({
        error: err.name || 'SyncError',
        message: err.message,
      });
    }
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.kevService.getStatus();
      res.status(200).json(status);
    } catch (err: any) {
      logger.error('Failed to get CISA KEV status', { error: err.message });
      res.status(500).json({
        error: 'StatusError',
        message: err.message,
      });
    }
  };

  getKevByCve = async (req: Request, res: Response): Promise<void> => {
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
      const entry = await this.kevService.getKevByCveId(cveId);

      if (!entry) {
        res.status(404).json({
          error: 'NotFound',
          message: `Vulnerability ${cveId} not found in CISA KEV catalog`,
        });
        return;
      }

      res.status(200).json(entry);
    } catch (err: any) {
      logger.error('Failed to query CISA KEV entry', { error: err.message });
      res.status(500).json({
        error: 'QueryError',
        message: err.message,
      });
    }
  };
}
