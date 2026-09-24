// =============================================================================
// CyberRiskOS — Attack Path HTTP Client (Node.js -> Python Engine)
// Phase: Phase 7B — Attack Path Intelligence
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: docs/ATTACK_PATH_MODEL.md
// =============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../config/logger';
import {
  AttackGraphInputDTO,
  AttackGraphAnalysisResultDTO,
} from './attack-paths.types';

export class AttackPathEngineServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AttackPathEngineServiceError';
  }
}

export class AttackPathEngineClient {
  private client: AxiosInstance;

  constructor(
    baseURL: string = process.env.RISK_ENGINE_URL || 'http://localhost:8000',
    timeoutMs: number = parseInt(process.env.RISK_ENGINE_TIMEOUT_MS || '5000', 10)
  ) {
    this.client = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CyberRiskOS-Backend/1.0.0 (AttackPathClient)',
      },
    });
  }

  async analyzeGraph(payload: AttackGraphInputDTO): Promise<AttackGraphAnalysisResultDTO> {
    try {
      const response = await this.client.post<AttackGraphAnalysisResultDTO>(
        '/api/v1/attack-paths/analyze',
        payload
      );
      return response.data;
    } catch (err) {
      this.handleAxiosError(err, 'analyzeGraph');
    }
  }

  private handleAxiosError(err: unknown, operation: string): never {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<any>;

      if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ENOTFOUND') {
        logger.error(`[AttackPathEngineClient] Connection error during ${operation}:`, {
          code: axiosErr.code,
          message: axiosErr.message,
        });
        throw new AttackPathEngineServiceError(
          'Attack Path Graph Engine is unavailable (connection refused). Please verify the Python risk-engine service is running.',
          503,
          'GRAPH_ENGINE_UNAVAILABLE'
        );
      }

      if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
        logger.error(`[AttackPathEngineClient] Timeout during ${operation}:`, {
          message: axiosErr.message,
        });
        throw new AttackPathEngineServiceError(
          'Attack Path Graph Engine timed out processing graph traversal.',
          504,
          'GRAPH_ENGINE_TIMEOUT'
        );
      }

      if (axiosErr.response) {
        const status = axiosErr.response.status;
        const detail = axiosErr.response.data?.detail || axiosErr.message;

        logger.error(`[AttackPathEngineClient] Upstream error during ${operation}:`, {
          status,
          detail,
        });

        if (status === 400 || status === 422) {
          throw new AttackPathEngineServiceError(
            `Invalid attack graph payload: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
            400,
            'GRAPH_INPUT_INVALID'
          );
        }

        throw new AttackPathEngineServiceError(
          `Attack Path Graph Engine failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
          status >= 500 ? 502 : status,
          'GRAPH_ENGINE_ERROR'
        );
      }
    }

    const message = err instanceof Error ? err.message : 'Unknown attack graph error';
    logger.error(`[AttackPathEngineClient] Unexpected error during ${operation}:`, { message });
    throw new AttackPathEngineServiceError(
      `Unexpected attack graph error: ${message}`,
      500,
      'INTERNAL_GRAPH_ERROR'
    );
  }
}

export const attackPathEngineClient = new AttackPathEngineClient();
