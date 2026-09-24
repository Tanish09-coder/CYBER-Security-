// =============================================================================
// CyberRiskOS — Investment Optimization Controller Layer
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// =============================================================================

import { Request, Response } from 'express';
import { optimizationService, OptimizationService } from './optimization.service';
import {
  optimizationRequestSchema,
  strategyComparisonSchema,
} from './optimization.validation';
import { OptimizationEngineServiceError } from './optimization.client';

export class OptimizationController {
  constructor(private service: OptimizationService = optimizationService) {}

  /**
   * POST /api/optimization/solve
   * Solves multi-strategy security investment optimization under budget constraints.
   */
  solve = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = optimizationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      let result;
      if (
        parsed.data.organizationId &&
        (!parsed.data.candidateActions || parsed.data.candidateActions.length === 0)
      ) {
        result = await this.service.solveForOrganization(parsed.data.organizationId, {
          budgetLimit: parsed.data.budgetLimit,
          businessUnitId: parsed.data.businessUnitId,
          objective: parsed.data.objective,
        });
      } else {
        result = await this.service.solve(parsed.data as any);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err instanceof OptimizationEngineServiceError) {
        res.status(err.statusCode).json({
          error: err.statusCode === 503 ? 'Service Unavailable' : 'Gateway Error',
          code: err.code,
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        error: 'Optimization Execution Failed',
        message: err.message || 'An unexpected error occurred during investment optimization.',
      });
    }
  };

  /**
   * GET /api/optimization/candidates?organizationId=...
   * Resolves Harsh-owned remediation actions and budgets into authoritative candidate actions for an organization.
   */
  getCandidates = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = (req.query.organizationId as string) || (req.params.organizationId as string);
      if (!organizationId) {
        res.status(400).json({ error: 'Validation Error', message: 'organizationId is required' });
        return;
      }
      const budgetLimit = req.query.budgetLimit ? parseFloat(req.query.budgetLimit as string) : undefined;
      const businessUnitId = req.query.businessUnitId as string | undefined;
      const objective = req.query.objective as any;

      const adapted = await this.service.adaptRemediationActionsToOptimizationRequest(organizationId, {
        budgetLimit,
        businessUnitId,
        objective,
      });
      res.status(200).json({
        success: true,
        data: adapted,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to retrieve optimization candidates',
        message: err.message,
      });
    }
  };

  /**
   * POST /api/optimization/organizations/:organizationId/solve
   * Explicit organization solve endpoint.
   */
  solveForOrganization = async (req: Request, res: Response): Promise<void> => {
    try {
      const organizationId = req.params.organizationId || req.body.organizationId;
      if (!organizationId) {
        res.status(400).json({ error: 'Validation Error', message: 'organizationId is required' });
        return;
      }
      const { budgetLimit, businessUnitId, objective } = req.body;
      const result = await this.service.solveForOrganization(organizationId, {
        budgetLimit,
        businessUnitId,
        objective,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err instanceof OptimizationEngineServiceError) {
        res.status(err.statusCode).json({
          error: err.statusCode === 503 ? 'Service Unavailable' : 'Gateway Error',
          code: err.code,
          message: err.message,
        });
        return;
      }
      res.status(500).json({
        error: 'Optimization Execution Failed',
        message: err.message,
      });
    }
  };

  /**
   * GET /api/optimization/strategies
   * Returns metadata and definitions of the 3 canonical candidate strategies.
   */
  getStrategies = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: [
        {
          id: 'STRATEGY_A_MAX_REDUCTION',
          name: 'Maximum Risk & Loss Reduction',
          type: 'MAX_REDUCTION',
          description:
            'Aggressively maximizes total continuous risk score reduction and monetary EAL savings within budget limit.',
          recommendedFor: 'Organizations prioritizing maximum absolute risk reduction and regulatory exposure reduction.',
        },
        {
          id: 'STRATEGY_B_BALANCED_ROSI',
          name: 'Balanced Capital Efficiency (Optimal ROSI)',
          type: 'BALANCED_ROSI',
          description:
            'Maximizes the Return on Security Investment (ROSI) ratio per dollar spent.',
          recommendedFor: 'Organizations optimizing budget allocation and capital efficiency for executive stakeholders.',
        },
        {
          id: 'STRATEGY_C_QUICK_WINS',
          name: 'Quick Wins & Low-Cost Remediations',
          type: 'QUICK_WINS',
          description:
            'Prioritizes low-cost, high-velocity remediation actions (costing <= 25% of budget) to address maximum vulnerabilities rapidly.',
          recommendedFor: 'Security teams seeking fast operational momentum and high remediation closure rates.',
        },
      ],
    });
  };

  /**
   * POST /api/optimization/compare
   * Compares two candidate strategies side-by-side to highlight trade-offs.
   */
  compare = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = strategyComparisonSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const comparison = this.service.compareStrategies(parsed.data as any);
      res.status(200).json({
        success: true,
        data: comparison,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Strategy Comparison Failed',
        message: err.message,
      });
    }
  };
}

export const optimizationController = new OptimizationController();
