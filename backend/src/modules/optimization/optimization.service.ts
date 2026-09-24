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
  private static resultsStore = new Map<string, { id: string; result: OptimizationResultDTO; createdAt: string }>();

  static storeResult(id: string, result: OptimizationResultDTO): void {
    OptimizationService.resultsStore.set(id, { id, result, createdAt: new Date().toISOString() });
  }

  static getResult(id: string): OptimizationResultDTO | null {
    return OptimizationService.resultsStore.get(id)?.result || null;
  }

  static getLatestResult(): { id: string; result: OptimizationResultDTO } | null {
    const entries = Array.from(OptimizationService.resultsStore.entries());
    if (entries.length === 0) return null;
    const last = entries[entries.length - 1];
    return { id: last[0], result: last[1].result };
  }

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
      currency: request.currency ?? null, // null if not provided — org resolution below may supply it
      objective: request.objective,
      candidateActions,
      baselinePortfolioRisk: request.baselinePortfolioRisk,
      baselinePortfolioEal: request.baselinePortfolioEal,
    };

    const solverResult = await this.client.solveOptimization(payload);
    const resultId = `opt-res-${Date.now()}`;
    const resultWithId: OptimizationResultDTO = {
      ...solverResult,
      optimizationResultId: resultId,
    };
    OptimizationService.storeResult(resultId, resultWithId);
    return resultWithId;
  }

  /**
   * Adapts Harsh remediation_actions and organization/BU budget into a Tanish OptimizationRequestDTO.
   * Resolves modeled risk reduction and EAL reduction from authoritative risk_results and financial_results.
   * Prohibits invented modeled benefits.
   */
  async adaptRemediationActionsToOptimizationRequest(
    organizationId: string,
    options?: {
      budgetLimit?: number;
      businessUnitId?: string;
      objective?: any;
    }
  ): Promise<OptimizationRequestDTO> {
    // 1. Determine budget limit and currency
    const orgRes = await query<{ currency: string }>(
      `SELECT currency FROM organizations WHERE id = $1 LIMIT 1`,
      [organizationId]
    );
    const currency: string | null = orgRes.rows[0]?.currency ?? null; // null = org has no currency on record

    let budgetLimit = options?.budgetLimit;
    if (budgetLimit === undefined || budgetLimit === null) {
      const buSql = `
        SELECT COALESCE(SUM(budget), 0) AS total_budget 
        FROM business_units 
        WHERE organization_id = $1 ${options?.businessUnitId ? 'AND id = $2' : ''};
      `;
      const buParams = options?.businessUnitId ? [organizationId, options.businessUnitId] : [organizationId];
      const buRes = await query<{ total_budget: string }>(buSql, buParams);
      budgetLimit = parseFloat(buRes.rows[0]?.total_budget || '0');
    }

    // 2. Query authoritative remediation actions
    const actionsSql = `
      SELECT 
        id,
        title,
        description,
        action_type,
        remediation_cost,
        estimated_effort_hours,
        target_control_code,
        target_cve_id,
        affected_asset_ids,
        status
      FROM remediation_actions
      WHERE organization_id = $1
        AND status IN ('PLANNED', 'APPROVED', 'IN_PROGRESS')
      ORDER BY created_at ASC;
    `;
    const actionsRes = await query(actionsSql, [organizationId]);

    // 3. For each action, resolve authoritative risk reduction and EAL reduction
    const candidateActions: RemediationCandidateActionDTO[] = [];
    for (const row of actionsRes.rows) {
      const affectedAssets: string[] = Array.isArray(row.affected_asset_ids)
        ? row.affected_asset_ids
        : typeof row.affected_asset_ids === 'string'
        ? JSON.parse(row.affected_asset_ids)
        : [];
      const targetAssetId = affectedAssets.length > 0 ? affectedAssets[0] : '';
      const targetCveId = row.target_cve_id || null;
      const controlCode = row.target_control_code || null;

      let estimatedRiskReduction = 0.0;
      let estimatedEalReduction = 0.0;

      // Look up authoritative risk_results if asset and CVE are present
      if (targetAssetId && targetCveId) {
        const riskRes = await query<{ score: string }>(
          `SELECT score FROM risk_results WHERE asset_id = $1 AND cve_id = $2 LIMIT 1`,
          [targetAssetId, targetCveId]
        );
        if (riskRes.rows.length > 0 && riskRes.rows[0].score !== null) {
          estimatedRiskReduction = parseFloat(riskRes.rows[0].score);
        }

        const finRes = await query<{ eal: string }>(
          `SELECT eal FROM financial_results WHERE asset_id = $1 AND cve_id = $2 AND eal IS NOT NULL LIMIT 1`,
          [targetAssetId, targetCveId]
        );
        if (finRes.rows.length > 0 && finRes.rows[0].eal !== null) {
          estimatedEalReduction = parseFloat(finRes.rows[0].eal);
        }
      }

      // Map action type
      let actionType: string;
      if (row.action_type === 'ENABLE_CONTROL') {
        actionType = 'IMPLEMENT_CONTROL';
      } else if (row.action_type === 'PATCH_CVE' || row.action_type === 'REMEDIATE_VULNERABILITY') {
        actionType = 'PATCH_VULNERABILITY';
      } else {
        actionType = row.action_type;
      }

      candidateActions.push({
        actionId: row.id,
        actionType,
        targetAssetId,
        targetCveId,
        controlCode,
        cost: parseFloat(row.remediation_cost || '0.0'),
        estimatedRiskReduction,
        estimatedEalReduction,
        dependencies: [], // Contract gap: Harsh table lacks prerequisite_action_ids
        conflictsWith: [], // Contract gap: Harsh table lacks execution_constraints
        title: row.title,
        description: row.description,
      });
    }

    // 4. Query baseline portfolio metrics from authoritative tables (risk from risk_results, eal from financial_results)
    const riskBaselineRes = await query<{ avg_risk: string }>(
      `SELECT COALESCE(AVG(score), 0.0) AS avg_risk FROM risk_results WHERE organization_id = $1`,
      [organizationId]
    );
    const finBaselineRes = await query<{ total_eal: string }>(
      `SELECT COALESCE(SUM(eal), 0.0) AS total_eal FROM financial_results WHERE organization_id = $1 AND eal IS NOT NULL`,
      [organizationId]
    );
    const baselinePortfolioRisk = parseFloat(riskBaselineRes.rows[0]?.avg_risk || '0.0');
    const baselinePortfolioEal = parseFloat(finBaselineRes.rows[0]?.total_eal || '0.0');

    return {
      budgetLimit,
      currency,
      objective: options?.objective || 'MAX_MODELED_RISK_REDUCTION',
      candidateActions,
      baselinePortfolioRisk: baselinePortfolioRisk > 0 ? baselinePortfolioRisk : null,
      baselinePortfolioEal: baselinePortfolioEal > 0 ? baselinePortfolioEal : null,
    };
  }

  /**
   * Solves optimization for an entire organization using authoritative remediation actions and budget.
   */
  async solveForOrganization(
    organizationId: string,
    options?: {
      budgetLimit?: number;
      businessUnitId?: string;
      objective?: any;
    }
  ): Promise<OptimizationResultDTO> {
    const adapted = await this.adaptRemediationActionsToOptimizationRequest(organizationId, options);
    return await this.solve(adapted);
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
