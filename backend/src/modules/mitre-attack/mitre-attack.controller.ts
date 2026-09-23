import { Request, Response } from 'express';
import { MitreAttackService } from './mitre-attack.service';
import { logger } from '../../config/logger';

export class MitreAttackController {
  private service: MitreAttackService;

  constructor(service?: MitreAttackService) {
    this.service = service || new MitreAttackService();
  }

  async syncEnterprise(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting manual MITRE ATT&CK Enterprise sync request');
      const result = await this.service.syncEnterpriseAttack();
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to trigger MITRE ATT&CK sync', { error: err.message });
      res.status(502).json({
        error: 'MITRE ATT&CK Sync Failed',
        message: err.message,
      });
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.service.getStatus();
      res.json(status);
    } catch (err: any) {
      logger.error('Failed to get MITRE ATT&CK status', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTactics(req: Request, res: Response): Promise<void> {
    try {
      const { search, includeRetired, page, limit } = req.query;
      const result = await this.service.getRepository().getTactics({
        search: typeof search === 'string' ? search : undefined,
        includeRetired: includeRetired === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query tactics', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTacticByAttackId(req: Request, res: Response): Promise<void> {
    try {
      const { attackId } = req.params;
      const { includeRetired } = req.query;
      const result = await this.service.getRepository().getTacticByAttackId(attackId, {
        includeRetired: includeRetired === 'true',
      });
      if (!result) {
        res.status(404).json({ error: 'Tactic Not Found', attackId });
        return;
      }
      res.json(result);
    } catch (err: any) {
      logger.error(`Failed to get tactic ${req.params.attackId}`, { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTechniques(req: Request, res: Response): Promise<void> {
    try {
      const { search, tactic, platform, isSubtechnique, includeRetired, page, limit } = req.query;
      const result = await this.service.getRepository().getTechniques({
        search: typeof search === 'string' ? search : undefined,
        tactic: typeof tactic === 'string' ? tactic : undefined,
        platform: typeof platform === 'string' ? platform : undefined,
        isSubtechnique:
          isSubtechnique === 'true' ? true : isSubtechnique === 'false' ? false : undefined,
        includeRetired: includeRetired === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query techniques', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getTechniqueByAttackId(req: Request, res: Response): Promise<void> {
    try {
      const { attackId } = req.params;
      const result = await this.service.getRepository().getTechniqueByAttackId(attackId);
      if (!result) {
        res.status(404).json({ error: 'Technique Not Found', attackId });
        return;
      }
      res.json(result);
    } catch (err: any) {
      logger.error(`Failed to get technique ${req.params.attackId}`, { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const { search, includeRetired, page, limit } = req.query;
      const result = await this.service.getRepository().getGroups({
        search: typeof search === 'string' ? search : undefined,
        includeRetired: includeRetired === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query groups', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getGroupByAttackId(req: Request, res: Response): Promise<void> {
    try {
      const { attackId } = req.params;
      const result = await this.service.getRepository().getGroupByAttackId(attackId);
      if (!result) {
        res.status(404).json({ error: 'Group Not Found', attackId });
        return;
      }
      res.json(result);
    } catch (err: any) {
      logger.error(`Failed to get group ${req.params.attackId}`, { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getSoftware(req: Request, res: Response): Promise<void> {
    try {
      const { search, softwareType, includeRetired, page, limit } = req.query;
      const result = await this.service.getRepository().getSoftware({
        search: typeof search === 'string' ? search : undefined,
        softwareType:
          softwareType === 'MALWARE' || softwareType === 'TOOL' || softwareType === 'OTHER'
            ? softwareType
            : undefined,
        includeRetired: includeRetired === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query software', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }

  async getMitigations(req: Request, res: Response): Promise<void> {
    try {
      const { search, includeRetired, page, limit } = req.query;
      const result = await this.service.getRepository().getMitigations({
        search: typeof search === 'string' ? search : undefined,
        includeRetired: includeRetired === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(result);
    } catch (err: any) {
      logger.error('Failed to query mitigations', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}
