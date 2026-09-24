// =============================================================================
// CyberRiskOS — What-If Simulation Engine Router Layer
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// =============================================================================

import { Router } from 'express';
import { scenariosController, ScenariosController } from './scenarios.controller';

export function createScenariosRouter(controller: ScenariosController = scenariosController): Router {
  const router = Router();

  // Scenario simulation execution
  router.post('/simulate', controller.simulateScenario);
  router.post('/assets/:assetId/simulate', controller.simulateAssetScenario);

  // Executive & tactical presets
  router.get('/presets', controller.getPresets);

  return router;
}
