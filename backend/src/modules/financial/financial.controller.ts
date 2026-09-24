// =============================================================================
// CyberRiskOS — Financial Controller Layer
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Rules:
// - Deterministic pagination and validation
// - Controllers must NOT query PostgreSQL directly
// - Clean responses exposing EAL, SLE, ALEF, loss breakdown, isEstimated = true
// - Zero DB internals exposed
// - Structured 503/504 on service offline/timeout
// =============================================================================

import { Request, Response } from 'express';
import { financialService, FinancialService } from './financial.service';
import { FinancialEngineServiceError } from './financial.client';
import {
  financialExposureInputSchema,
  batchFinancialExposureInputSchema,
  financialExposureQuerySchema,
} from './financial.validation';
import { logger } from '../../config/logger';

export class FinancialController {
  constructor(private service: FinancialService = financialService) {}

  evaluateSingle = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = financialExposureInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.evaluateAndPersist(parsed.data);
      res.status(200).json(result);
    } catch (err: unknown) {
      if (err instanceof FinancialEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in financial evaluateSingle', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  evaluateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = batchFinancialExposureInputSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.evaluateBatchAndPersist(parsed.data);
      res.status(200).json(result);
    } catch (err: unknown) {
      if (err instanceof FinancialEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in financial evaluateBatch', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  getFinancialExposures = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = financialExposureQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await this.service.getFinancialExposures(parsed.data);
      res.status(200).json({
        items: result.items,
        results: result.items,
        data: result.items,
        total: result.total,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalItems: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getFinancialExposures', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  getAssetFinancial = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Validation Error', message: 'Asset ID is required' });
        return;
      }

      const summary = await this.service.getAssetFinancialSummary(assetId);
      if (!summary) {
        res.status(404).json({ error: 'Asset not found', message: `Asset not found: ${assetId}` });
        return;
      }

      res.status(200).json(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getAssetFinancial', { error: message, assetId: req.params.assetId });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  getEnterpriseSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const summary = await this.service.getEnterpriseFinancialSummary();
      res.status(200).json(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in getEnterpriseSummary', { error: message });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };

  evaluateAssetExposure = async (req: Request, res: Response): Promise<void> => {
    try {
      const { assetId } = req.params;
      if (!assetId) {
        res.status(400).json({ error: 'Validation Error', message: 'Asset ID is required' });
        return;
      }

      const result = await this.service.evaluateCorrelatedAssetFinancialExposure(assetId);
      res.status(200).json(result);
    } catch (err: unknown) {
      if (err instanceof FinancialEngineServiceError) {
        res.status(err.statusCode).json({
          error: 'Service Unavailable',
          code: err.code,
          message: err.message,
          details: err.details,
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      logger.error('Error in evaluateAssetExposure', { error: message, assetId: req.params.assetId });
      res.status(500).json({ error: 'Internal Server Error', message });
    }
  };
}

export const financialController = new FinancialController();
