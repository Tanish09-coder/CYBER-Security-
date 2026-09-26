// =============================================================================
// CyberRiskOS — AI Explanation Assistant Controller
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: ID-Based Authoritative Backend Resolution
// =============================================================================

import { Request, Response } from 'express';
import { assistantService, AssistantService, AssistantServiceError } from './assistant.service';
import {
  riskExplanationSchema,
  financialExplanationSchema,
  strategyComparisonSchema,
  breachContainmentSchema,
} from './assistant.validation';

export class AssistantController {
  constructor(private service: AssistantService = assistantService) {}

  explainRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = riskExplanationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.explainRisk(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      const status = err instanceof AssistantServiceError ? err.statusCode : 500;
      res.status(status).json({
        error: status === 404 ? 'Resource Not Found' : 'Explanation Generation Failed',
        message: err.message ?? 'An unexpected error occurred in the AI explanation assistant.',
      });
    }
  };

  explainFinancial = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = financialExplanationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.explainFinancial(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      const status = err instanceof AssistantServiceError ? err.statusCode : 500;
      res.status(status).json({
        error: status === 404 ? 'Resource Not Found' : 'Financial Explanation Generation Failed',
        message: err.message ?? 'An unexpected error occurred.',
      });
    }
  };

  compareStrategies = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = strategyComparisonSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.compareStrategies(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      const status = err instanceof AssistantServiceError ? err.statusCode : 500;
      res.status(status).json({
        error: status === 404 ? 'Resource Not Found' : 'Strategy Comparison Failed',
        message: err.message ?? 'An unexpected error occurred.',
      });
    }
  };

  containBreach = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = breachContainmentSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.containBreach(parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      const status = err instanceof AssistantServiceError ? err.statusCode : 500;
      res.status(status).json({
        error: 'Breach Containment Analysis Failed',
        message: err.message ?? 'An unexpected error occurred during breach containment analysis.',
      });
    }
  };
}


export const assistantController = new AssistantController();
