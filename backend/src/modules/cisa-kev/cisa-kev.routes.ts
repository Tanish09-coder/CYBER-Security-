import { Router } from 'express';
import { CisaKevController } from './cisa-kev.controller';

export function createCisaKevRouter(controller?: CisaKevController): Router {
  const router = Router();
  const ctrl = controller || new CisaKevController();

  router.post('/sync', ctrl.syncCatalog);
  router.get('/status', ctrl.getStatus);
  router.get('/cve/:cveId', ctrl.getKevByCve);

  return router;
}
