import { Router } from 'express';
import { ThreatIntelController } from './threat-intel.controller';
import { MitreAttackController } from '../mitre-attack/mitre-attack.controller';

export function createThreatIntelRouter(controller?: ThreatIntelController): Router {
  const router = Router();
  const ctrl = controller || new ThreatIntelController();
  
  // Create an instance of MitreAttackController to reuse its methods for aliases
  const mitreCtrl = new MitreAttackController();

  router.get('/summary', (req, res) => ctrl.getSummary(req, res));
  router.get('/kev', (req, res) => ctrl.getKevCatalog(req, res));
  
  // MITRE aliases
  router.get('/attack/tactics', (req, res) => mitreCtrl.getTactics(req, res));
  router.get('/attack/techniques', (req, res) => mitreCtrl.getTechniques(req, res));

  return router;
}
