// =============================================================================
// CyberRiskOS — Investment Optimization Service Layer
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// =============================================================================

import {
  optimizationEngineClient,
  OptimizationEngineClient,
} from './optimization.client';
import { query } from '../../db';
import { logger } from '../../config/logger';
import {
  OptimizationRequestDTO,
  OptimizationResultDTO,
  RemediationCandidateActionDTO,
  StrategyComparisonRequestDTO,
  StrategyComparisonResponseDTO,
} from './optimization.types';

export class OptimizationService {
  constructor(private client: OptimizationEngineClient = optimizationEngineClient) {}

  /**
   * Solves multi-strategy security investment optimization under budget constraints.
   */
  async solve(request: OptimizationRequestDTO): Promise<OptimizationResultDTO> {
    const candidateActions = request.candidateActions;

    // Strict contract: optimizer must operate on explicit candidate actions containing authoritative
    // actionId, implementationCost, feasibility, dependencies, mutual exclusions, and modeled benefit.
    // Prohibit inventing remediation costs or benefits from CVSS / KEV in production.
    if (!candidateActions || candidateActions.length === 0) {
      throw new Error(
        'Cannot execute optimization: Explicit candidate remediation actions required. ' +
        'Candidate actions must contain authoritative implementationCost, dependencies, and modeled benefits ' +
        'from enterprise contracts (Harsh-owned). Synthetic cost/benefit fallbacks are prohibited.'
      );
    }

    logger.info('Executing Investment Optimization via Python Optimizer', {
      budgetLimit: request.budgetLimit,
      candidatesCount: candidateActions.length,
      objective: request.objective || 'ALL_STRATEGIES',
    });

    const payload: OptimizationRequestDTO = {
      budgetLimit: request.budgetLimit,
      currency: request.currency || 'USD',
      objective: request.objective,
      candidateActions,
      baselinePortfolioRisk: request.baselinePortfolioRisk,
      baselinePortfolioEal: request.baselinePortfolioEal,
    };

    return await this.client.solveOptimization(payload);
  }

  /**
   * Compares two candidate strategies side-by-side to highlight executive trade-offs.
   */
  compareStrategies(req: StrategyComparisonRequestDTO): StrategyComparisonResponseDTO {
    const stratA = req.strategyA;
    const stratB = req.strategyB;

    const costDelta = roundNumber(stratA.totalCost - stratB.totalCost, 2);
    const ealReductionDelta = roundNumber(stratA.totalEalReduction - stratB.totalEalReduction, 2);

    let tradeOffSummary: string;
    if (stratA.totalEalReduction > stratB.totalEalReduction) {
      tradeOffSummary = `${stratA.strategyName} achieves $${Math.abs(ealReductionDelta).toLocaleString()} greater modeled loss reduction, requiring $${Math.abs(costDelta).toLocaleString()} ${costDelta >= 0 ? 'additional' : 'less'} investment than ${stratB.strategyName}.`;
    } else {
      tradeOffSummary = `${stratB.strategyName} achieves $${Math.abs(ealReductionDelta).toLocaleString()} greater modeled loss reduction, requiring $${Math.abs(costDelta).toLocaleString()} ${costDelta <= 0 ? 'additional' : 'less'} investment than ${stratA.strategyName}.`;
    }

    return {
      strategyA: {
        id: stratA.strategyId,
        name: stratA.strategyName,
        totalCost: stratA.totalCost,
        totalEalReduction: stratA.totalEalReduction,
        rosiPct: stratA.rosiPct,
      },
      strategyB: {
        id: stratB.strategyId,
        name: stratB.strategyName,
        totalCost: stratB.totalCost,
        totalEalReduction: stratB.totalEalReduction,
        rosiPct: stratB.rosiPct,
      },
      costDelta,
      ealReductionDelta,
      tradeOffSummary,
    };
  }
}

function roundNumber(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

export const optimizationService = new OptimizationService();
