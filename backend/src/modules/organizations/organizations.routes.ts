// =============================================================================
// CyberRiskOS — Organizations & Business Units Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { OrganizationController } from './organizations.controller';

export function createOrganizationRouter(controller?: OrganizationController): Router {
  const router = Router();
  const ctrl = controller || new OrganizationController();

  // Organization CRUD
  router.post('/', ctrl.createOrganization);
  router.get('/', ctrl.listOrganizations);
  router.get('/:id', ctrl.getOrganization);
  router.patch('/:id', ctrl.updateOrganization);
  router.delete('/:id', ctrl.deleteOrganization);

  return router;
}

export function createBusinessUnitRouter(controller?: OrganizationController): Router {
  const router = Router();
  const ctrl = controller || new OrganizationController();

  // Business Unit CRUD
  router.post('/', ctrl.createBusinessUnit);
  router.get('/', ctrl.listBusinessUnits);
  router.get('/:id', ctrl.getBusinessUnit);
  router.patch('/:id', ctrl.updateBusinessUnit);
  router.delete('/:id', ctrl.deleteBusinessUnit);

  return router;
}
