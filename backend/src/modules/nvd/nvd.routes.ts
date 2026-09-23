import { Router } from 'express';
import { NvdController } from './nvd.controller';

export function createNvdRouter(controller?: NvdController): Router {
  const router = Router();
  const ctrl = controller || new NvdController();

  router.post('/sync', ctrl.syncIncremental);
  router.post('/sync/date-range', ctrl.syncDateRange);
  router.post('/cve/:cveId', ctrl.syncCve);
  router.get('/status', ctrl.getStatus);

  return router;
}

export function createVulnerabilityRouter(controller?: NvdController): Router {
  const router = Router();
  const ctrl = controller || new NvdController();

  router.get('/:cveId', ctrl.getVulnerability);

  return router;
}
