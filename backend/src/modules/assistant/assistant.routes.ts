// =============================================================================
// CyberRiskOS — AI Explanation Assistant Routes
// Phase: Phase 8 — AI Explanation Assistant
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// =============================================================================

import { Router } from 'express';
import { AssistantController, assistantController } from './assistant.controller';

export function createAssistantRouter(controller: AssistantController = assistantController): Router {
  const router = Router();

  /**
   * POST /api/assistant/explain-risk
   * Generates a grounded AI explanation for a risk score result from Risk Model v1.
   */
  router.post('/explain-risk', controller.explainRisk);

  /**
   * POST /api/assistant/explain-financial
   * Generates a grounded AI explanation for a financial exposure / EAL result.
   */
  router.post('/explain-financial', controller.explainFinancial);

  /**
   * POST /api/v1/assistant/compare-strategies
   * Generates a grounded AI comparison of two optimization strategies without picking a winner.
   */
  router.post('/compare-strategies', controller.compareStrategies);

  /**
   * POST /api/v1/assistant/contain-breach
   * Analyzes active server hacking and triggers AI breach containment agent.
   */
  router.post('/contain-breach', controller.containBreach);

  return router;
}


