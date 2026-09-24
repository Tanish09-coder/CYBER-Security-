// =============================================================================
// CyberRiskOS — Investment Optimization Routes Layer
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// =============================================================================

import { Router } from 'express';
import { optimizationController, OptimizationController } from './optimization.controller';

export function createOptimizationRouter(
  controller: OptimizationController = optimizationController
): Router {
  const router = Router();

  router.post('/solve', controller.solve);
  router.get('/strategies', controller.getStrategies);
  router.post('/compare', controller.compare);

  return router;
}
