// =============================================================================
// CyberRiskOS — Financial Engine Router Layer
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// =============================================================================

import { Router } from 'express';
import { financialController, FinancialController } from './financial.controller';

export function createFinancialRouter(controller: FinancialController = financialController): Router {
  const router = Router();

  // On-demand evaluation endpoints
  router.post('/evaluate', controller.evaluateSingle);
  router.post('/evaluate/batch', controller.evaluateBatch);

  // Financial queries & summary for Screen N9
  router.get('/exposure', controller.getFinancialExposures);
  router.get('/summary', controller.getEnterpriseSummary);
  router.get('/assets/:assetId', controller.getAssetFinancial);
  router.post('/assets/:assetId/evaluate', controller.evaluateAssetExposure);

  return router;
}
