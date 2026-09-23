import { Router } from 'express';
import { MitreAttackController } from './mitre-attack.controller';

export function createMitreAttackRouter(controller?: MitreAttackController): Router {
  const router = Router();
  const ctrl = controller || new MitreAttackController();

  // Ingestion & Lifecycle Endpoints
  router.post('/sync', (req, res) => ctrl.syncEnterprise(req, res));
  router.get('/status', (req, res) => ctrl.getStatus(req, res));

  // Normalized Threat Intelligence Query Endpoints
  router.get('/tactics', (req, res) => ctrl.getTactics(req, res));
  router.get('/tactics/:attackId', (req, res) => ctrl.getTacticByAttackId(req, res));

  router.get('/techniques', (req, res) => ctrl.getTechniques(req, res));
  router.get('/techniques/:attackId', (req, res) => ctrl.getTechniqueByAttackId(req, res));

  router.get('/groups', (req, res) => ctrl.getGroups(req, res));
  router.get('/groups/:attackId', (req, res) => ctrl.getGroupByAttackId(req, res));

  router.get('/software', (req, res) => ctrl.getSoftware(req, res));
  router.get('/mitigations', (req, res) => ctrl.getMitigations(req, res));

  return router;
}
