import { Request, Response } from 'express';
import { VcdbService } from './vcdb.service';
import { logger } from '../../config/logger';

export class VcdbController {
  private service: VcdbService;

  constructor(service?: VcdbService) {
    this.service = service || new VcdbService();
  }

  async sync(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting manual VCDB incident sync request');
      const result = await this.service.syncVcdb();
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to trigger VCDB sync', { error: err.message });
      res.status(502).json({
        error: 'VCDB Sync Failed',
        message: err.message,
      });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.service.getStatus();
      res.json(status);
    } catch (err: any) {
      logger.error('Failed to get VCDB status', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        actorVariety,
        actionCategory,
        assetCategory,
        attributeCategory,
        cve,
        victimIndustry,
        victimCountry,
        year,
        page,
        limit,
      } = req.query;

      const result = await this.service.getRepository().getIncidents({
        search: typeof search === 'string' ? search : undefined,
        actor: typeof actorVariety === 'string' ? actorVariety : (typeof req.query.actor === 'string' ? (req.query.actor as string) : undefined),
        action: typeof actionCategory === 'string' ? actionCategory : (typeof req.query.action === 'string' ? (req.query.action as string) : undefined),
        asset: typeof assetCategory === 'string' ? assetCategory : (typeof req.query.asset === 'string' ? (req.query.asset as string) : undefined),
        attribute: typeof attributeCategory === 'string' ? attributeCategory : (typeof req.query.attribute === 'string' ? (req.query.attribute as string) : undefined),
        country: typeof victimCountry === 'string' ? victimCountry : (typeof req.query.country === 'string' ? (req.query.country as string) : undefined),
        industry: typeof victimIndustry === 'string' ? victimIndustry : (typeof req.query.industry === 'string' ? (req.query.industry as string) : undefined),
        year: year ? parseInt(year as string, 10) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query VCDB incidents', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getIncidentById(req: Request, res: Response): Promise<void> {
    try {
      const { vcdbId } = req.params;
      const incident = await this.service.getRepository().getIncidentByVcdbId(vcdbId);
      if (!incident) {
        res.status(404).json({ error: 'VCDB Incident Not Found', vcdbId });
        return;
      }
      res.json(incident);
    } catch (err: any) {
      logger.error(`Failed to get VCDB incident ${req.params.vcdbId}`, { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.service.getRepository().getStatistics();
      res.json(stats);
    } catch (err: any) {
      logger.error('Failed to get VCDB statistics', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}
