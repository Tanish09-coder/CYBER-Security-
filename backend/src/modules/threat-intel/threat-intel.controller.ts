import { Request, Response } from 'express';
import { CisaKevService } from '../cisa-kev/cisa-kev.service';
import { MitreAttackService } from '../mitre-attack/mitre-attack.service';
import { ThreatIntelSummaryResponse } from './threat-intel.types';
import { logger } from '../../config/logger';

export class ThreatIntelController {
  private cisaService: CisaKevService;
  private mitreService: MitreAttackService;

  constructor(
    cisaService?: CisaKevService,
    mitreService?: MitreAttackService
  ) {
    this.cisaService = cisaService || new CisaKevService();
    this.mitreService = mitreService || new MitreAttackService();
  }

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const [cisaStatus, cisaSummary, mitreStatus] = await Promise.all([
        this.cisaService.getStatus(),
        this.cisaService.getKevSummary(),
        this.mitreService.getStatus()
      ]);

      const response: ThreatIntelSummaryResponse = {
        data: {
          cisaKev: {
            activeCount: cisaSummary.activeCount,
            knownRansomwareCount: cisaSummary.knownRansomwareCount,
            overdueCount: cisaSummary.overdueCount,
            lastSyncAt: cisaStatus.lastSyncAt,
            lastSuccessfulRun: cisaStatus.lastSuccessfulRun,
          },
          mitreAttack: {
            domain: mitreStatus.domain,
            releaseVersion: mitreStatus.currentVersion,
            releaseId: null, // We don't expose internal release UUID by default unless needed
            tacticsCount: mitreStatus.counts.tactics,
            techniquesCount: mitreStatus.counts.techniques + mitreStatus.counts.subtechniques,
            groupsCount: mitreStatus.counts.groups,
            softwareCount: mitreStatus.counts.software,
            mitigationsCount: mitreStatus.counts.mitigations,
            lastSyncAt: mitreStatus.lastSuccessfulSync?.completed_at || null,
          },
          generatedAt: new Date().toISOString()
        }
      };

      res.json(response);
    } catch (err: any) {
      logger.error('Failed to get threat intel summary', { error: err.message, stack: err.stack, full: err });
      res.status(500).json({ error: 'Internal Server Error', message: err.message, stack: err.stack });
    }
  }

  async getKevCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, ransomware, dateAddedFrom, dateAddedTo, dueDateFrom, dueDateTo } = req.query;
      
      const parsedPage = page ? parseInt(page as string, 10) : 1;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 25;
      
      if (isNaN(parsedPage) || parsedPage <= 0) {
        res.status(400).json({ error: 'Invalid page parameter' });
        return;
      }
      
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }

      let parsedRansomware: boolean | undefined = undefined;
      if (ransomware === 'true') parsedRansomware = true;
      else if (ransomware === 'false') parsedRansomware = false;
      else if (ransomware !== undefined) {
        res.status(400).json({ error: 'Invalid ransomware parameter. Must be boolean' });
        return;
      }

      const isValidDate = (d: any) => !isNaN(Date.parse(d));

      if (dateAddedFrom && !isValidDate(dateAddedFrom)) {
         res.status(400).json({ error: 'Invalid dateAddedFrom parameter' });
         return;
      }
      if (dateAddedTo && !isValidDate(dateAddedTo)) {
         res.status(400).json({ error: 'Invalid dateAddedTo parameter' });
         return;
      }
      if (dueDateFrom && !isValidDate(dueDateFrom)) {
         res.status(400).json({ error: 'Invalid dueDateFrom parameter' });
         return;
      }
      if (dueDateTo && !isValidDate(dueDateTo)) {
         res.status(400).json({ error: 'Invalid dueDateTo parameter' });
         return;
      }

      if (dateAddedFrom && dateAddedTo && new Date(dateAddedFrom as string) > new Date(dateAddedTo as string)) {
        res.status(400).json({ error: 'dateAddedFrom cannot be after dateAddedTo' });
        return;
      }

      if (dueDateFrom && dueDateTo && new Date(dueDateFrom as string) > new Date(dueDateTo as string)) {
        res.status(400).json({ error: 'dueDateFrom cannot be after dueDateTo' });
        return;
      }

      const result = await this.cisaService.getKevCatalog({
        page: parsedPage,
        limit: parsedLimit,
        search: typeof search === 'string' ? search : undefined,
        ransomware: parsedRansomware,
        dateAddedFrom: dateAddedFrom as string,
        dateAddedTo: dateAddedTo as string,
        dueDateFrom: dueDateFrom as string,
        dueDateTo: dueDateTo as string,
      });

      res.json(result);
    } catch (err: any) {
      logger.error('Failed to get KEV catalog', { error: err.message });
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
  }
}
