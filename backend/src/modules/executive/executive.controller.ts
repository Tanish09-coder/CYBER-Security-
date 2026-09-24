// =============================================================================
// CyberRiskOS — Executive Dashboard Controller Layer
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-02)
// =============================================================================

import { Request, Response } from 'express';
import { executiveService, ExecutiveService } from './executive.service';

export class ExecutiveController {
  constructor(private service: ExecutiveService = executiveService) {}

  /**
   * GET /api/executive/posture
   * Returns enterprise aggregated risk posture, severity distribution, and KEV counts.
   */
  getPosture = async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const posture = await this.service.getExecutivePosture(orgId);
      res.status(200).json({
        success: true,
        data: posture,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Executive Posture Failed',
        message: err.message,
      });
    }
  };

  /**
   * GET /api/executive/top-risks
   * Returns Top 5 to 20 critical risk exposures.
   */
  getTopRisks = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const orgId = req.query.organizationId as string | undefined;
      const topRisks = await this.service.getTopRisks(limit, orgId);
      res.status(200).json({
        success: true,
        data: topRisks,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Executive Top Risks Failed',
        message: err.message,
      });
    }
  };

  /**
   * GET /api/executive/financial-summary
   * Returns enterprise modeled financial loss summary.
   */
  getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const summary = await this.service.getFinancialSummary(orgId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Executive Financial Summary Failed',
        message: err.message,
      });
    }
  };
}

export const executiveController = new ExecutiveController();
