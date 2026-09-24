// =============================================================================
// CyberRiskOS — Risk Engine Router Layer
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// =============================================================================

import { Router } from 'express';
import { riskController, RiskController } from './risk.controller';

export function createRiskRouter(controller: RiskController = riskController): Router {
  const router = Router();

  // On-demand evaluation endpoints
  router.post('/evaluate', controller.evaluateSingle);
  router.post('/evaluate/batch', controller.evaluateBatch);

  // Query & Explorer endpoints for Screen N8
  router.get('/scores', controller.getRiskScores);
  router.get('/assets/:assetId', controller.getAssetRisk);
  router.post('/assets/:assetId/evaluate', controller.evaluateAssetVulnerabilities);
  router.get('/vulnerabilities/:cveId', controller.getVulnerabilityRisk);

  return router;
}
