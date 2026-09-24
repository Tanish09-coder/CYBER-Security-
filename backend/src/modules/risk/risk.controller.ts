// =============================================================================
// CyberRiskOS — Risk Engine Controller Layer
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Rules:
// - Deterministic pagination and validation
// - Controllers must NOT query PostgreSQL directly
// - Clean API responses exposing: score, level, modelVersion, factors,
//   data completeness, evaluatedAt, provenance hash
// - No raw database internals exposed
// - Structured 503/504 when Python Risk Engine is unavailable or times out
// =============================================================================

import { Request, Response } from 'express';
import { riskService, RiskService } from './risk.service';
import { RiskEngineServiceError } from './risk.client';
import {
  riskEvaluationInputSchema,
  batchRiskEvaluationInputSchema,
  riskScoreQuerySchema,
} from './risk.validation';
import { logger } from '../../config/logger';

export class RiskController {
  constructor(private service: RiskService = riskService) {}

  /**
   * POST /api/risk/evaluate
   * Evaluates a single (asset, vulnerability) atomic pair on demand.
   */
  evaluateSingle = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = riskEvaluationInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.evaluateAndPersist(parsed.data);

      // Clean response conforming to API contract without database internals
      res.status(200).json({
        assetId: result.assetId,
        assetName: result.assetName || parsed.data.asset.assetName,
        cveId: result.cveId,
        score: result.riskScore,
        level: result.severity,
        baseCvss: result.baseCvss,
        modelVersion: result.modelVersion,
        inputProvenanceHash: result.provenanceHash,
        dataCompleteness: result.dataCompletenessScore,
        factors: result.factors,
        missingDataWarnings: result.missingDataWarnings,
        riskFlags: result.riskFlags,
        evaluatedAt: result.evaluatedAt,
        isCached: result.isCached || false,
        // Compatibility aliases
        riskScore: result.riskScore,
        severity: result.severity,
        provenanceHash: result.provenanceHash,
        dataCompletenessScore: result.dataCompletenessScore,
      });
    } catch (err: unknown) {
      if (err instanceof RiskEngineServiceError) {
        logger.error('Risk Engine service error in evaluateSingle', {
          code: err.code,
          statusCode: err.statusCode,
          message: err.message,
        });
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }

      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Unexpected error in evaluateSingle', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * POST /api/risk/evaluate/batch
   * Evaluates a batch of (asset, vulnerability) atomic pairs.
   */
  evaluateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = batchRiskEvaluationInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const batchResult = await this.service.evaluateBatchAndPersist(parsed.data);

      const items = batchResult.results.map((r) => ({
        assetId: r.assetId,
        assetName: r.assetName,
        cveId: r.cveId,
        score: r.riskScore,
        level: r.severity,
        baseCvss: r.baseCvss,
        modelVersion: r.modelVersion,
        inputProvenanceHash: r.provenanceHash,
        dataCompleteness: r.dataCompletenessScore,
        factors: r.factors,
        missingDataWarnings: r.missingDataWarnings,
        riskFlags: r.riskFlags,
        evaluatedAt: r.evaluatedAt,
        isCached: r.isCached || false,
        riskScore: r.riskScore,
        severity: r.severity,
        provenanceHash: r.provenanceHash,
        dataCompletenessScore: r.dataCompletenessScore,
      }));

      res.status(200).json({
        items,
        totalEvaluated: batchResult.totalEvaluated,
        modelVersion: batchResult.modelVersion,
      });
    } catch (err: unknown) {
      if (err instanceof RiskEngineServiceError) {
        logger.error('Risk Engine service error in evaluateBatch', {
          code: err.code,
          statusCode: err.statusCode,
          message: err.message,
        });
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }

      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Unexpected error in evaluateBatch', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * GET /api/risk/scores
   * Returns paginated risk scores with multi-criteria filtering.
   */
  getRiskScores = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = riskScoreQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.getRiskScores(parsed.data);

      res.status(200).json({
        items: result.items,
        data: result.items,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getRiskScores', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * GET /api/risk/assets/:assetId
   * Returns aggregated risk profile and vulnerability breakdown for an asset.
   */
  getAssetRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Validation Error', message: 'Asset ID is required' });
        return;
      }

      const summary = await this.service.getAssetRiskSummary(assetId);
      if (!summary) {
        res.status(404).json({ error: 'Not Found', message: `Asset not found: ${assetId}` });
        return;
      }

      res.status(200).json(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getAssetRisk', { error: message, assetId: req.params.assetId });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * GET /api/risk/vulnerabilities/:cveId
   * Returns enterprise exposure distribution across assets for a CVE.
   */
  getVulnerabilityRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cveId } = req.params;
      if (!cveId) {
        res.status(400).json({ error: 'Validation Error', message: 'CVE ID is required' });
        return;
      }

      const distribution = await this.service.getVulnerabilityRiskDistribution(cveId);
      if (!distribution) {
        res.status(404).json({ error: 'Not Found', message: `Vulnerability not found: ${cveId}` });
        return;
      }

      res.status(200).json(distribution);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getVulnerabilityRisk', { error: message, cveId: req.params.cveId });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  /**
   * POST /api/risk/assets/:assetId/evaluate
   * Triggers automatic batch evaluation of all correlated vulnerabilities on an asset.
   */
  evaluateAssetVulnerabilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Validation Error', message: 'Asset ID is required' });
        return;
      }

      const result = await this.service.evaluateCorrelatedAssetVulnerabilities(assetId);
      res.status(200).json(result);
    } catch (err: unknown) {
      if (err instanceof RiskEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }

      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in evaluateAssetVulnerabilities', {
        error: message,
        assetId: req.params.assetId,
      });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };
}

export const riskController = new RiskController();
