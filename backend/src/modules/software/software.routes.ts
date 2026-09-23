// =============================================================================
// CyberRiskOS — Software Inventory Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { SoftwareController } from './software.controller';

export function createSoftwareRouter(controller?: SoftwareController): Router {
  const router = Router();
  const ctrl = controller || new SoftwareController();

  // Standalone Software Package CRUD
  router.get('/:id', ctrl.getSoftware);
  router.patch('/:id', ctrl.updateSoftware);
  router.delete('/:id', ctrl.deleteSoftware);

  return router;
}

export function createAssetSoftwareRouter(controller?: SoftwareController): Router {
  const router = Router({ mergeParams: true });
  const ctrl = controller || new SoftwareController();

  // Asset-scoped Software Endpoints
  router.get('/', ctrl.listAssetSoftware);
  router.post('/', ctrl.registerAssetSoftware);

  return router;
}
