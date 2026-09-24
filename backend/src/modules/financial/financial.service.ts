// =============================================================================
// CyberRiskOS — Financial Service Layer
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Migration: 015_financial_results.sql
// Rules:
// - Deterministic cache validation: check (asset_id, cve_id) + input_provenance_hash + model_version
// - Invalidate & recompute if inputs change
// - Strictly NO silent fallback calculation in Node
// - Strict legal labeling: MODELED / ESTIMATED (isEstimated = true)
// =============================================================================

import {
  financialEngineClient,
  FinancialEngineClient,
  computeFinancialProvenanceHash,
} from './financial.client';
import { financialRepository, FinancialRepository } from './financial.repository';
import { query } from '../../db';
import { logger } from '../../config/logger';
import {
  FinancialExposureInputDTO,
  FinancialExposureResultDTO,
  BatchFinancialExposureInputDTO,
  BatchFinancialExposureResultDTO,
  FinancialExposureQueryParams,
} from './financial.types';

export class FinancialService {
  constructor(
    private client: FinancialEngineClient = financialEngineClient,
    private repo: FinancialRepository = financialRepository
  ) {}

  /**
   * Evaluates single (asset, vulnerability) financial exposure with deterministic caching.
   */
  async evaluateAndPersist(payload: FinancialExposureInputDTO): Promise<FinancialExposureResultDTO> {
    const inputHash = computeFinancialProvenanceHash(payload);
    const targetModelVersion = '1.0.0';

    const existing = await this.repo.findByAssetAndCve(
      payload.asset.assetId,
      payload.vulnerability.cveId
    );

    if (
      existing &&
      existing.input_provenance_hash === inputHash &&
      existing.model_version === targetModelVersion
    ) {
      logger.info('Financial evaluation cache hit', {
        assetId: payload.asset.assetId,
        cveId: payload.vulnerability.cveId,
        inputHash,
      });

      return {
        assetId: existing.asset_id,
        assetName: payload.asset.assetName,
        cveId: existing.cve_id,
        sle: existing.sle,
        alef: existing.alef,
        eal: existing.eal,
        ealStatus: (existing.eal_status as any) || (existing.eal !== null ? 'CALCULATED' : 'NOT_AVAILABLE'),
        currency: existing.currency,
        primaryLoss: existing.primary_loss,
        secondaryLoss: existing.secondary_loss,
        estimatedOutageHours: existing.estimated_outage_hours,
        hourlyDowntimeRate: existing.hourly_downtime_rate,
        recoveryCost: existing.recovery_cost,
        factors: existing.factors,
        missingDataWarnings: existing.missing_data_warnings,
        dataCompletenessScore: existing.data_completeness,
        modelVersion: existing.model_version,
        provenanceHash: existing.input_provenance_hash,
        isEstimated: true,
        evaluatedAt: existing.evaluated_at,
        isCached: true,
      };
    }

    logger.info('Financial evaluation cache miss or stale: calling Python Financial Engine', {
      assetId: payload.asset.assetId,
      cveId: payload.vulnerability.cveId,
    });

    const freshResult = await this.client.evaluateFinancialExposure(payload);

    try {
      await this.repo.upsertFinancialResult(freshResult);
    } catch (err: any) {
      logger.error('Failed to persist financial result to database', {
        error: err.message,
        assetId: payload.asset.assetId,
        cveId: payload.vulnerability.cveId,
      });
    }

    return {
      ...freshResult,
      isEstimated: true,
      isCached: false,
    };
  }

  /**
   * Evaluates batch of financial exposure pairs with cache optimization.
   */
  async evaluateBatchAndPersist(
    payload: BatchFinancialExposureInputDTO
  ): Promise<BatchFinancialExposureResultDTO> {
    const targetModelVersion = '1.0.0';
    const results: FinancialExposureResultDTO[] = [];
    const misses: { index: number; input: FinancialExposureInputDTO }[] = [];
    let totalEal = 0.0;
    let availableEalCount = 0;
    let currency = 'USD';

    for (let i = 0; i < payload.evaluations.length; i++) {
      const item = payload.evaluations[i];
      const inputHash = computeFinancialProvenanceHash(item);
      const existing = await this.repo.findByAssetAndCve(
        item.asset.assetId,
        item.vulnerability.cveId
      );

      if (
        existing &&
        existing.input_provenance_hash === inputHash &&
        existing.model_version === targetModelVersion
      ) {
        results[i] = {
          assetId: existing.asset_id,
          assetName: item.asset.assetName,
          cveId: existing.cve_id,
          sle: existing.sle,
          alef: existing.alef,
          eal: existing.eal,
          ealStatus: (existing.eal_status as any) || (existing.eal !== null ? 'CALCULATED' : 'NOT_AVAILABLE'),
          currency: existing.currency,
          primaryLoss: existing.primary_loss,
          secondaryLoss: existing.secondary_loss,
          estimatedOutageHours: existing.estimated_outage_hours,
          hourlyDowntimeRate: existing.hourly_downtime_rate,
          recoveryCost: existing.recovery_cost,
          factors: existing.factors,
          missingDataWarnings: existing.missing_data_warnings,
          dataCompletenessScore: existing.data_completeness,
          modelVersion: existing.model_version,
          provenanceHash: existing.input_provenance_hash,
          isEstimated: true,
          evaluatedAt: existing.evaluated_at,
          isCached: true,
        };
        if (existing.eal !== null && existing.eal !== undefined) {
          totalEal += existing.eal;
          availableEalCount++;
        }
        currency = existing.currency;
      } else {
        misses.push({ index: i, input: item });
      }
    }

    if (misses.length > 0) {
      const batchInput: BatchFinancialExposureInputDTO = {
        evaluations: misses.map((m) => m.input),
      };

      const evaluatedMisses = await this.client.evaluateFinancialBatch(batchInput);

      try {
        await this.repo.upsertBatchFinancialResults(evaluatedMisses.results);
      } catch (err: any) {
        logger.error('Failed to batch persist financial results to database', {
          error: err.message,
          count: evaluatedMisses.results.length,
        });
      }

      for (let j = 0; j < misses.length; j++) {
        const origIdx = misses[j].index;
        const res = evaluatedMisses.results[j];
        results[origIdx] = {
          ...res,
          isEstimated: true,
          isCached: false,
        };
        if (res.eal !== null && res.eal !== undefined) {
          totalEal += res.eal;
          availableEalCount++;
        }
        currency = res.currency;
      }
    }

    return {
      results,
      totalEvaluated: results.length,
      totalModeledEal: availableEalCount > 0 ? Math.round(totalEal * 100) / 100 : null,
      availableEalCount,
      currency,
      modelVersion: targetModelVersion,
    };
  }

  async getFinancialExposures(params: FinancialExposureQueryParams) {
    return await this.repo.getFinancialExposures(params);
  }

  async getAssetFinancialSummary(assetId: string) {
    return await this.repo.getAssetFinancialSummary(assetId);
  }

  async getEnterpriseFinancialSummary() {
    return await this.repo.getEnterpriseFinancialSummary();
  }

  async evaluateCorrelatedAssetFinancialExposure(assetId: string) {
    const assetSql = `
      SELECT 
        a.id, 
        a.name, 
        a.business_criticality, 
        a.is_internet_facing,
        a.organization_id,
        o.currency as org_currency,
        ofp.hourly_downtime_cost,
        ofp.hourly_recovery_rate
      FROM assets a
      JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN organization_financial_parameters ofp ON o.id = ofp.organization_id
      WHERE a.id = $1
      LIMIT 1
    `;
    const assetRes = await query(assetSql, [assetId]);
    if (assetRes.rows.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    const assetRow = assetRes.rows[0];

    const vulnsSql = `
      SELECT DISTINCT 
        v.cve_id,
        v.cvss_base_score,
        v.known_exploited,
        v.kev_known_ransomware_campaign_use
      FROM asset_vulnerabilities av
      JOIN vulnerabilities v ON av.cve_id = v.cve_id
      WHERE av.asset_id = $1
    `;
    const vulnsRes = await query(vulnsSql, [assetId]);

    const orgCurrency = assetRow.org_currency || 'USD';
    const hourlyDowntimeCost =
      assetRow.hourly_downtime_cost !== null && assetRow.hourly_downtime_cost !== undefined
        ? parseFloat(assetRow.hourly_downtime_cost)
        : null;

    const evaluations: FinancialExposureInputDTO[] = vulnsRes.rows.map((v: any) => ({
      asset: {
        assetId: assetRow.id,
        assetName: assetRow.name,
        criticalityTier: assetRow.business_criticality,
        isInternetFacing: assetRow.is_internet_facing,
        currency: orgCurrency,
        hourlyDowntimeCost,
        recoveryCost: null, // Contract gap: Harsh contract does not provide total recoveryCost
        estimatedOutageHours: null, // Contract gap: Harsh contract does not provide estimatedOutageHours
        annualizedLossEventFrequency: null, // Contract gap: Harsh contract does not provide asset-level ALEF
      },
      vulnerability: {
        cveId: v.cve_id,
        cvssScore: v.cvss_base_score !== null ? parseFloat(v.cvss_base_score) : null,
        isKnownExploited: Boolean(v.known_exploited),
        knownRansomwareCampaignUse: v.kev_known_ransomware_campaign_use,
      },
    }));

    if (evaluations.length === 0) {
      return {
        assetId,
        evaluatedCount: 0,
        totalModeledEal: 0.0,
        currency: orgCurrency,
        results: [],
      };
    }

    const batchRes = await this.evaluateBatchAndPersist({ evaluations });
    return {
      assetId,
      evaluatedCount: batchRes.totalEvaluated,
      totalModeledEal: batchRes.totalModeledEal,
      currency: batchRes.currency,
      results: batchRes.results,
    };
  }
}

export const financialService = new FinancialService();
