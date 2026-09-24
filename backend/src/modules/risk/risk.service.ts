// =============================================================================
// CyberRiskOS — Risk Engine Service Layer
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Migration: 014_risk_results.sql
// Rules:
// - Deterministic cache validation: check (asset_id, cve_id) + input_provenance_hash + model_version
// - Invalidate & recompute if inputs change (CVSS, KEV, criticality, exposure, controls)
// - NO silent fallback score calculation in Node
// - Safe error handling
// =============================================================================

import { riskEngineClient, RiskEngineClient, computeProvenanceHash } from './risk.client';
import { riskRepository, RiskRepository } from './risk.repository';
import { query } from '../../db';
import { logger } from '../../config/logger';
import {
  RiskEvaluationInputDTO,
  RiskEvaluationResultDTO,
  BatchRiskEvaluationInputDTO,
  BatchRiskEvaluationResultDTO,
  RiskScoreQueryParams,
} from './risk.types';

export class RiskService {
  constructor(
    private client: RiskEngineClient = riskEngineClient,
    private repo: RiskRepository = riskRepository
  ) {}

  /**
   * Evaluates an atomic (asset, vulnerability) pair.
   * Checks deterministic cache in risk_results:
   * - Cache Hit: existing record has identical input_provenance_hash and model_version
   * - Cache Miss / Stale: inputs or model version changed -> calls Python Risk Engine and persists
   */
  async evaluateAndPersist(payload: RiskEvaluationInputDTO): Promise<RiskEvaluationResultDTO> {
    const inputHash = computeProvenanceHash(payload);
    const targetModelVersion = '1.0.0';

    // 1. Check existing persisted result
    const existing = await this.repo.findByAssetAndCve(
      payload.asset.assetId,
      payload.vulnerability.cveId
    );

    // 2. Cache validation rule
    if (
      existing &&
      existing.input_provenance_hash === inputHash &&
      existing.model_version === targetModelVersion
    ) {
      logger.info('Risk evaluation cache hit: identical provenance hash and model version', {
        assetId: payload.asset.assetId,
        cveId: payload.vulnerability.cveId,
        inputHash,
      });

      return {
        assetId: existing.asset_id,
        assetName: payload.asset.assetName,
        cveId: existing.cve_id,
        baseCvss: existing.base_cvss,
        riskScore: existing.score,
        severity: existing.level,
        factors: existing.factors,
        missingDataWarnings: existing.missing_data_warnings,
        dataCompletenessScore: existing.data_completeness,
        riskFlags: existing.risk_flags,
        modelVersion: existing.model_version,
        provenanceHash: existing.input_provenance_hash,
        evaluatedAt: existing.evaluated_at,
        isCached: true,
      };
    }

    // 3. Cache miss or stale result: Call Python Risk Engine (strictly NO Node fallback calculation)
    logger.info('Risk evaluation cache miss or stale: calling Python Risk Engine', {
      assetId: payload.asset.assetId,
      cveId: payload.vulnerability.cveId,
      previousHash: existing?.input_provenance_hash,
      newHash: inputHash,
    });

    const freshResult = await this.client.evaluateRisk(payload);

    // 4. Persist newly evaluated result to risk_results
    try {
      await this.repo.upsertRiskResult(freshResult);
    } catch (err: any) {
      logger.error('Failed to persist risk result to risk_results database', {
        error: err.message,
        assetId: payload.asset.assetId,
        cveId: payload.vulnerability.cveId,
      });
    }

    return {
      ...freshResult,
      isCached: false,
    };
  }

  /**
   * Evaluates a batch of (asset, vulnerability) pairs.
   * Utilizes cache where input hashes match, and evaluates misses via Python Risk Engine.
   */
  async evaluateBatchAndPersist(
    payload: BatchRiskEvaluationInputDTO
  ): Promise<BatchRiskEvaluationResultDTO> {
    const targetModelVersion = '1.0.0';
    const results: RiskEvaluationResultDTO[] = [];
    const misses: { index: number; input: RiskEvaluationInputDTO }[] = [];

    // Check cache for each evaluation item
    for (let i = 0; i < payload.evaluations.length; i++) {
      const item = payload.evaluations[i];
      const inputHash = computeProvenanceHash(item);
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
          baseCvss: existing.base_cvss,
          riskScore: existing.score,
          severity: existing.level,
          factors: existing.factors,
          missingDataWarnings: existing.missing_data_warnings,
          dataCompletenessScore: existing.data_completeness,
          riskFlags: existing.risk_flags,
          modelVersion: existing.model_version,
          provenanceHash: existing.input_provenance_hash,
          evaluatedAt: existing.evaluated_at,
          isCached: true,
        };
      } else {
        misses.push({ index: i, input: item });
      }
    }

    // Evaluate misses via Python Risk Engine
    if (misses.length > 0) {
      const batchInput: BatchRiskEvaluationInputDTO = {
        evaluations: misses.map((m) => m.input),
      };

      const evaluatedMisses = await this.client.evaluateRiskBatch(batchInput);

      // Persist misses
      try {
        await this.repo.upsertBatchRiskScores(evaluatedMisses.results);
      } catch (err: any) {
        logger.error('Failed to batch persist risk results to database', {
          error: err.message,
          count: evaluatedMisses.results.length,
        });
      }

      // Slot evaluated misses back into ordered results array
      for (let j = 0; j < misses.length; j++) {
        const origIdx = misses[j].index;
        results[origIdx] = {
          ...evaluatedMisses.results[j],
          isCached: false,
        };
      }
    }

    return {
      results,
      totalEvaluated: results.length,
      modelVersion: targetModelVersion,
    };
  }

  /**
   * Queries paginated and filtered risk scores.
   */
  async getRiskScores(params: RiskScoreQueryParams) {
    return await this.repo.getRiskScores(params);
  }

  /**
   * Retrieves aggregated risk profile for a single asset.
   */
  async getAssetRiskSummary(assetId: string) {
    return await this.repo.getAssetRiskSummary(assetId);
  }

  /**
   * Retrieves risk exposure distribution across enterprise assets for a CVE.
   */
  async getVulnerabilityRiskDistribution(cveId: string) {
    return await this.repo.getVulnerabilityRiskDistribution(cveId);
  }

  /**
   * Evaluates all correlated vulnerabilities on an asset based on existing asset_vulnerabilities rows.
   */
  async evaluateCorrelatedAssetVulnerabilities(assetId: string): Promise<{
    assetId: string;
    evaluatedCount: number;
    results: RiskEvaluationResultDTO[];
  }> {
    // 1. Fetch asset details
    const assetSql = `
      SELECT id, name, business_criticality, is_internet_facing
      FROM assets
      WHERE id = $1
      LIMIT 1
    `;
    const assetRes = await query(assetSql, [assetId]);
    if (assetRes.rows.length === 0) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    const assetRow = assetRes.rows[0];

    // 2. Fetch asset controls
    const controlsSql = `
      SELECT control_code, status, source
      FROM asset_controls
      WHERE asset_id = $1
    `;
    let controls: any[] = [];
    try {
      const controlsRes = await query(controlsSql, [assetId]);
      controls = controlsRes.rows.map((r: any) => ({
        controlCode: r.control_code,
        status: r.status,
        source: r.source,
      }));
    } catch {
      // asset_controls might be empty or unmigrated in certain test setups
      controls = [];
    }

    // 3. Fetch correlated vulnerabilities
    const vulnsSql = `
      SELECT DISTINCT 
        v.cve_id,
        v.cvss_base_score,
        v.cvss_version,
        v.known_exploited,
        v.kev_known_ransomware_campaign_use,
        v.source_identifier
      FROM asset_vulnerabilities av
      JOIN vulnerabilities v ON av.cve_id = v.cve_id
      WHERE av.asset_id = $1
    `;
    const vulnsRes = await query(vulnsSql, [assetId]);

    const evaluations: RiskEvaluationInputDTO[] = vulnsRes.rows.map((v: any) => ({
      asset: {
        assetId: assetRow.id,
        assetName: assetRow.name,
        criticalityTier: assetRow.business_criticality,
        isInternetFacing: assetRow.is_internet_facing,
        controls,
      },
      vulnerability: {
        cveId: v.cve_id,
        cvssScore: v.cvss_base_score !== null ? parseFloat(v.cvss_base_score) : null,
        cvssVersion: v.cvss_version,
        isKnownExploited: Boolean(v.known_exploited),
        knownRansomwareCampaignUse: v.kev_known_ransomware_campaign_use,
        sourceIdentifier: v.source_identifier,
      },
    }));

    if (evaluations.length === 0) {
      return {
        assetId,
        evaluatedCount: 0,
        results: [],
      };
    }

    const batchResult = await this.evaluateBatchAndPersist({ evaluations });
    return {
      assetId,
      evaluatedCount: batchResult.totalEvaluated,
      results: batchResult.results,
    };
  }
}

export const riskService = new RiskService();
