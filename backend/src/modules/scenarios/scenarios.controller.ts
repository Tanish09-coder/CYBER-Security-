// =============================================================================
// CyberRiskOS — What-If Simulation Controller Layer
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// Rules:
// - Validates simulation inputs via Zod
// - Strictly in-memory execution; zero DB mutations
// - Structured 503/504 on service offline/timeout
// =============================================================================

import { Request, Response } from 'express';
import { scenariosService, ScenariosService } from './scenarios.service';
import { ScenarioEngineServiceError } from './scenarios.client';
import {
  scenarioSimulationRequestSchema,
  scenarioActionSchema,
} from './scenarios.validation';
import { z } from 'zod';
import { logger } from '../../config/logger';

export class ScenariosController {
  constructor(private service: ScenariosService = scenariosService) {}

  /**
   * POST /api/scenarios/simulate
   * Simulates a What-If scenario across enterprise posture.
   */
  simulateScenario = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = scenarioSimulationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.simulate(parsed.data);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      if (err instanceof ScenarioEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in simulateScenario', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * POST /api/scenarios/assets/:assetId/simulate
   * Simulates remediation actions targeted at a single asset.
   */
  simulateAssetScenario = async (req: Request, res: Response): Promise<void> => {
    try {
      const assetId = req.params.assetId;
      if (!assetId) {
        res.status(400).json({ error: 'Validation Error', message: 'Asset ID is required in URL parameter' });
        return;
      }

      const actionsSchema = z.object({
        scenarioName: z.string().optional(),
        actions: z.array(scenarioActionSchema).min(1, 'At least one remediation action is required'),
      });

      const parsed = actionsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.simulateForAsset(
        assetId,
        parsed.data.actions,
        parsed.data.scenarioName
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      if (err instanceof ScenarioEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in simulateAssetScenario', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * GET /api/scenarios/presets
   * Retrieves executive scenario simulation presets.
   */
  getPresets = async (_req: Request, res: Response): Promise<void> => {
    try {
      const presets = this.service.getPresets();
      res.status(200).json({
        success: true,
        data: presets,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getPresets', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };
}

export const scenariosController = new ScenariosController();
