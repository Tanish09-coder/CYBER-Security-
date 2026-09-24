// =============================================================================
// CyberRiskOS — Executive Dashboard Routes Layer
// Phase: Phase 6 — Executive Decision Dashboard
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P6-02)
// =============================================================================

import { Router } from 'express';
import { executiveController, ExecutiveController } from './executive.controller';

export function createExecutiveRouter(
  controller: ExecutiveController = executiveController
): Router {
  const router = Router();

  router.get('/posture', controller.getPosture);
  router.get('/top-risks', controller.getTopRisks);
  router.get('/financial-summary', controller.getFinancialSummary);

  return router;
}
