// =============================================================================
// CyberRiskOS — Financial Engine Microservice HTTP Client
// Phase: Phase 3 — Financial Exposure / EAL Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/FINANCIAL_MODEL.md
// Rules:
// - Communicates with Python microservice via REST API
// - Explicit timeout and configurable URL
// - No secrets in logs
// - NO silent fallback calculation in Node
// - Propagates structured service-unavailable condition (503)
// =============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';
import { logger } from '../../config/logger';
import {
  FinancialExposureInputDTO,
  FinancialExposureResultDTO,
  BatchFinancialExposureInputDTO,
  BatchFinancialExposureResultDTO,
} from './financial.types';

export class FinancialEngineServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 503,
    code: string = 'FINANCIAL_ENGINE_UNAVAILABLE',
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'FinancialEngineServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, FinancialEngineServiceError.prototype);
  }
}

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

export function computeFinancialProvenanceHash(payload: FinancialExposureInputDTO): string {
  const canonical = canonicalJsonStringify(payload);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export class FinancialEngineClient {
  private client: AxiosInstance;
  public readonly baseUrl: string;
  public readonly timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs?: number) {
    this.baseUrl = baseUrl || process.env.RISK_ENGINE_URL || 'http://localhost:8000';
    this.timeoutMs =
      timeoutMs ??
      (process.env.RISK_ENGINE_TIMEOUT_MS
        ? parseInt(process.env.RISK_ENGINE_TIMEOUT_MS, 10)
        : 30000);

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async evaluateFinancialExposure(
    payload: FinancialExposureInputDTO
  ): Promise<FinancialExposureResultDTO> {
    try {
      const response = await this.client.post<FinancialExposureResultDTO>(
        '/api/v1/financial/evaluate',
        payload
      );
      return response.data;
    } catch (err: unknown) {
      this.handleClientError(err, 'evaluateFinancialExposure', {
        assetId: payload.asset?.assetId,
        cveId: payload.vulnerability?.cveId,
      });
    }
  }

  async evaluateFinancialBatch(
    payload: BatchFinancialExposureInputDTO
  ): Promise<BatchFinancialExposureResultDTO> {
    try {
      const response = await this.client.post<BatchFinancialExposureResultDTO>(
        '/api/v1/financial/evaluate/batch',
        payload
      );
      return response.data;
    } catch (err: unknown) {
      this.handleClientError(err, 'evaluateFinancialBatch', {
        batchSize: payload.evaluations?.length,
      });
    }
  }

  private handleClientError(err: unknown, operation: string, context: Record<string, any>): never {
    const error = err as AxiosError<any>;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logger.error(`Financial Engine timeout during ${operation}`, {
        operation,
        timeoutMs: this.timeoutMs,
        ...context,
      });
      throw new FinancialEngineServiceError(
        `Financial Engine timed out after ${this.timeoutMs}ms during ${operation}`,
        504,
        'FINANCIAL_ENGINE_TIMEOUT',
        { operation, timeoutMs: this.timeoutMs }
      );
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const detail =
        typeof responseData === 'object' && responseData !== null
          ? responseData.detail || responseData.message || JSON.stringify(responseData)
          : String(responseData || 'Unknown upstream financial engine error');

      logger.error(`Financial Engine responded with status ${status} during ${operation}`, {
        operation,
        status,
        ...context,
      });

      if (status >= 400 && status < 500) {
        throw new FinancialEngineServiceError(
          `Financial Engine rejected input: ${detail}`,
          status,
          'FINANCIAL_ENGINE_BAD_REQUEST',
          { status, operation }
        );
      }

      throw new FinancialEngineServiceError(
        `Financial Engine service error (${status}): ${detail}`,
        502,
        'FINANCIAL_ENGINE_UPSTREAM_ERROR',
        { status, operation }
      );
    }

    const networkMessage = error.message || 'Connection refused or host unreachable';
    logger.error(`Financial Engine unavailable during ${operation}`, {
      operation,
      message: networkMessage,
      baseUrl: this.baseUrl,
      ...context,
    });

    throw new FinancialEngineServiceError(
      `Financial Engine is unavailable at ${this.baseUrl}: ${networkMessage}`,
      503,
      'FINANCIAL_ENGINE_UNAVAILABLE',
      { operation, baseUrl: this.baseUrl }
    );
  }
}

export const financialEngineClient = new FinancialEngineClient();
