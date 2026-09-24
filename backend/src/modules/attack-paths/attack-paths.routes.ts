// =============================================================================
// CyberRiskOS — Attack Path & Blast Radius Routes Layer
// Phase: Phase 7B — Attack Path Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P7B-02)
// =============================================================================

import { Router } from 'express';
import { attackPathsController, AttackPathsController } from './attack-paths.controller';

export function createAttackPathsRouter(
  controller: AttackPathsController = attackPathsController
): Router {
  const router = Router();

  router.get('/', controller.getAttackGraph);
  router.post('/analyze', controller.analyzeCustomGraph);
  router.get('/choke-points', controller.getChokePoints);
  router.get('/asset/:id', controller.getAssetBlastRadius);

  return router;
}
