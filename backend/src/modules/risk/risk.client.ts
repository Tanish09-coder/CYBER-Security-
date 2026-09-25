// =============================================================================
// CyberRiskOS — Risk Engine Microservice HTTP Client
// Phase: Phase 2 — Risk Quantification
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/RISK_ENGINE_CONTRACT.md
// Rules:
// - Communicates with Python Risk Engine via REST API
// - Explicit timeout and configurable URL
// - No secrets in logs
// - NO silent fallback score generation in Node
// - Returns/propagates structured service-unavailable condition if Python is unreachable
// =============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';
import { logger } from '../../config/logger';
import {
  RiskEvaluationInputDTO,
  RiskEvaluationResultDTO,
  BatchRiskEvaluationInputDTO,
  BatchRiskEvaluationResultDTO,
} from './risk.types';

export class RiskEngineServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Record<string, any>;

  constructor(message: string, statusCode: number = 503, code: string = 'RISK_ENGINE_UNAVAILABLE', details: Record<string, any> = {}) {
    super(message);
    this.name = 'RiskEngineServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, RiskEngineServiceError.prototype);
  }
}

/**
 * Deterministic canonical JSON serialization.
 * Recursively sorts all dictionary keys to produce identical byte representation
 * matching Python's `json.dumps(..., sort_keys=True, separators=(',', ':'))`.
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`);
  return '{' + entries.join(',') + '}';
}

/**
 * Computes deterministic SHA-256 provenance hash of normalized evaluation input DTO.
 */
export function computeProvenanceHash(payload: RiskEvaluationInputDTO): string {
  const canonical = canonicalJsonStringify(payload);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export class RiskEngineClient {
  private client: AxiosInstance;
  public readonly baseUrl: string;
  public readonly timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs?: number) {
    this.baseUrl = baseUrl || process.env.RISK_ENGINE_URL || 'http://localhost:8000';
    this.timeoutMs = timeoutMs ?? (process.env.RISK_ENGINE_TIMEOUT_MS ? parseInt(process.env.RISK_ENGINE_TIMEOUT_MS, 10) : 30000);

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Evaluates an atomic (asset_id, vulnerability_id) pair via Python Risk Engine.
   * If the engine is unavailable, throws a structured RiskEngineServiceError (503).
   * Strictly NO silent local fallback score calculation.
   */
  async evaluateRisk(payload: RiskEvaluationInputDTO): Promise<RiskEvaluationResultDTO> {
    try {
      const response = await this.client.post<RiskEvaluationResultDTO>(
        '/api/v1/risk/evaluate',
        payload
      );
      return response.data;
    } catch (err: unknown) {
      this.handleClientError(err, 'evaluateRisk', {
        assetId: payload.asset?.assetId,
        cveId: payload.vulnerability?.cveId,
      });
    }
  }

  /**
   * Evaluates a batch of (asset_id, vulnerability_id) pairs via Python Risk Engine.
   * If the engine is unavailable, throws a structured RiskEngineServiceError (503).
   * Strictly NO silent local fallback score calculation.
   */
  async evaluateRiskBatch(
    payload: BatchRiskEvaluationInputDTO
  ): Promise<BatchRiskEvaluationResultDTO> {
    try {
      const response = await this.client.post<BatchRiskEvaluationResultDTO>(
        '/api/v1/risk/evaluate/batch',
        payload
      );
      return response.data;
    } catch (err: unknown) {
      this.handleClientError(err, 'evaluateRiskBatch', {
        batchSize: payload.evaluations?.length,
      });
    }
  }

  /**
   * Centralized safe error handling:
   * - No secret leakage in error logs or exception payloads
   * - Distinguishes timeouts, 4xx bad requests, 5xx server errors, and network connection drops
   * - Throws structured RiskEngineServiceError
   */
  private handleClientError(err: unknown, operation: string, context: Record<string, any>): never {
    const error = err as AxiosError<any>;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logger.error(`Risk Engine timeout during ${operation}`, {
        operation,
        timeoutMs: this.timeoutMs,
        ...context,
      });
      throw new RiskEngineServiceError(
        `Python Risk Engine timed out after ${this.timeoutMs}ms during ${operation}`,
        504,
        'RISK_ENGINE_TIMEOUT',
        { operation, timeoutMs: this.timeoutMs }
      );
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const detail = typeof responseData === 'object' && responseData !== null
        ? responseData.detail || responseData.message || JSON.stringify(responseData)
        : String(responseData || 'Unknown upstream risk engine error');

      logger.error(`Risk Engine responded with status ${status} during ${operation}`, {
        operation,
        status,
        ...context,
      });

      if (status >= 400 && status < 500) {
        throw new RiskEngineServiceError(
          `Risk Engine rejected evaluation input: ${detail}`,
          status,
          'RISK_ENGINE_BAD_REQUEST',
          { status, operation }
        );
      }

      throw new RiskEngineServiceError(
        `Risk Engine service error (${status}): ${detail}`,
        502,
        'RISK_ENGINE_UPSTREAM_ERROR',
        { status, operation }
      );
    }

    // Network level error: Connection refused, DNS failure, etc.
    const networkMessage = error.message || 'Connection refused or host unreachable';
    logger.error(`Python Risk Engine unavailable during ${operation}`, {
      operation,
      message: networkMessage,
      baseUrl: this.baseUrl,
      ...context,
    });

    throw new RiskEngineServiceError(
      `Python Risk Engine is unavailable at ${this.baseUrl}: ${networkMessage}`,
      503,
      'RISK_ENGINE_UNAVAILABLE',
      { operation, baseUrl: this.baseUrl }
    );
  }
}

export const riskEngineClient = new RiskEngineClient();
