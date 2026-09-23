import { Router } from 'express';
import { VcdbController } from './vcdb.controller';

export function createVcdbRouter(controller?: VcdbController): Router {
  const router = Router();
  const ctrl = controller || new VcdbController();

  // Ingestion & Lifecycle Endpoints
  router.post('/sync', (req, res) => ctrl.sync(req, res));
  router.get('/status', (req, res) => ctrl.getStatus(req, res));

  // Query Endpoints
  router.get('/statistics', (req, res) => ctrl.getStatistics(req, res));
  router.get('/incidents', (req, res) => ctrl.getIncidents(req, res));
  router.get('/incidents/:vcdbId', (req, res) => ctrl.getIncidentById(req, res));

  // Compatibility aliases when mounted directly at /api/v1/incidents
  router.get('/', (req, res) => ctrl.getIncidents(req, res));
  router.get('/:vcdbId', (req, res) => ctrl.getIncidentById(req, res));

  return router;
}
