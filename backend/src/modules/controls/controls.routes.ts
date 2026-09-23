// =============================================================================
// CyberRiskOS — Security Controls Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { ControlsController } from './controls.controller';

export function createControlsRouter(controller?: ControlsController): Router {
  const router = Router();
  const ctrl = controller || new ControlsController();

  // Catalog & Coverage Endpoints
  router.get('/', ctrl.listControls);
  router.get('/:code', ctrl.getControl);

  return router;
}

export function createAssetControlsRouter(controller?: ControlsController): Router {
  const router = Router({ mergeParams: true });
  const ctrl = controller || new ControlsController();

  // Asset-scoped Controls Posture Endpoints
  router.get('/', ctrl.listAssetControls);
  router.post('/', ctrl.setAssetControls);
  router.patch('/:controlCode', ctrl.updateAssetControl);
  router.delete('/:controlCode', ctrl.deleteAssetControl);

  return router;
}
