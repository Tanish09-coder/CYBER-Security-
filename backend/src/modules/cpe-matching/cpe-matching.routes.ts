// =============================================================================
// CyberRiskOS — CPE Matching Routes
// Owner: HARSH (Enterprise Context Lead)
// =============================================================================

import { Router } from 'express';
import { CpeMatchingController } from './cpe-matching.controller';

export function createCpeMatchingRouter(controller?: CpeMatchingController): Router {
  const router = Router();
  const ctrl = controller || new CpeMatchingController();

  // POST /api/cpe-matching/evaluate: Trigger matching for asset or inventory
  router.post('/evaluate', ctrl.evaluateMatches);

  return router;
}

export function createAssetVulnerabilityRouter(controller?: CpeMatchingController): Router {
  const router = Router({ mergeParams: true });
  const ctrl = controller || new CpeMatchingController();

  // GET /api/assets/:assetId/vulnerabilities
  router.get('/', ctrl.getAssetVulnerabilities);

  return router;
}
