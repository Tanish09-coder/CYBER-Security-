// =============================================================================
// CyberRiskOS — Investment Optimization HTTP Client (Node -> Python Engine)
// Phase: Phase 5 — Investment Optimization + ROSI
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/OPTIMIZATION.md
// Rules:
// - Explicit timeout
// - NO silent fallback calculation in Node
// - Structured 503 / 504 error propagation
// =============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../config/logger';
import {
  OptimizationRequestDTO,
  OptimizationResultDTO,
} from './optimization.types';

export class OptimizationEngineServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'OptimizationEngineServiceError';
  }
}

export class OptimizationEngineClient {
  private client: AxiosInstance;

  constructor(
    baseURL: string = process.env.RISK_ENGINE_URL || 'http://localhost:8000',
    timeoutMs: number = parseInt(process.env.RISK_ENGINE_TIMEOUT_MS || '30000', 10)
  ) {
    this.client = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CyberRiskOS-Backend/1.0.0 (OptimizationClient)',
      },
    });
  }

  async solveOptimization(payload: OptimizationRequestDTO): Promise<OptimizationResultDTO> {
    try {
      const response = await this.client.post<OptimizationResultDTO>(
        '/api/v1/optimization/solve',
        payload
      );
      return response.data;
    } catch (err) {
      this.handleAxiosError(err, 'solveOptimization');
    }
  }

  private handleAxiosError(err: unknown, operation: string): never {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<any>;

      if (axiosErr.code === 'ECONNREFUSED' || !axiosErr.response) {
        logger.error(`Optimization Engine is unavailable during ${operation}`, {
          baseURL: this.client.defaults.baseURL,
          code: axiosErr.code,
        });
        throw new OptimizationEngineServiceError(
          'Optimization Engine service is unavailable. Verify that the Python microservice is running.',
          503,
          'OPTIMIZATION_ENGINE_UNAVAILABLE'
        );
      }

      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
        logger.error(`Optimization Engine timed out during ${operation}`, {
          timeoutMs: this.client.defaults.timeout,
        });
        throw new OptimizationEngineServiceError(
          'Optimization Engine request timed out.',
          504,
          'OPTIMIZATION_ENGINE_TIMEOUT'
        );
      }

      const status = axiosErr.response.status;
      const detail = axiosErr.response.data?.detail || axiosErr.message;
      logger.error(`Optimization Engine returned error HTTP ${status} in ${operation}`, {
        status,
        detail,
      });

      throw new OptimizationEngineServiceError(
        `Optimization Engine error: ${detail}`,
        status,
        'OPTIMIZATION_ENGINE_ERROR'
      );
    }

    throw new OptimizationEngineServiceError(
      `Unexpected error in ${operation}: ${(err as Error).message}`,
      500,
      'INTERNAL_OPTIMIZATION_CLIENT_ERROR'
    );
  }
}

export const optimizationEngineClient = new OptimizationEngineClient();
