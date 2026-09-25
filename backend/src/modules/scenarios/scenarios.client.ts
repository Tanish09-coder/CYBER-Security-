// =============================================================================
// CyberRiskOS — What-If Simulation Engine Microservice HTTP Client
// Phase: Phase 4 — What-If Simulation Engine
// Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
// Spec: tasks/TANISH/TASKS.md (TANISH-P4-01)
// Rules:
// - Communicates with Python microservice via REST API
// - Explicit timeout and configurable URL
// - No secrets in logs
// - NO silent fallback calculation in Node
// - Propagates structured service-unavailable condition (503)
// =============================================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../../config/logger';
import { ScenarioSimulationResultDTO } from './scenarios.types';

export class ScenarioEngineServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 503,
    code: string = 'SCENARIO_ENGINE_UNAVAILABLE',
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'ScenarioEngineServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ScenarioEngineServiceError.prototype);
  }
}

export class ScenarioEngineClient {
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

  async simulateScenario(payload: any): Promise<ScenarioSimulationResultDTO> {
    try {
      const response = await this.client.post<ScenarioSimulationResultDTO>(
        '/api/v1/scenarios/simulate',
        payload
      );
      return response.data;
    } catch (err: unknown) {
      this.handleClientError(err, 'simulateScenario');
    }
  }

  private handleClientError(err: unknown, operation: string): never {
    const error = err as AxiosError<any>;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      logger.error(`Scenario Engine timeout during ${operation}`, {
        operation,
        timeoutMs: this.timeoutMs,
      });
      throw new ScenarioEngineServiceError(
        `Scenario Simulation Engine timed out after ${this.timeoutMs}ms during ${operation}`,
        504,
        'SCENARIO_ENGINE_TIMEOUT',
        { operation, timeoutMs: this.timeoutMs }
      );
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      const detail =
        typeof responseData === 'object' && responseData !== null
          ? responseData.detail || responseData.message || JSON.stringify(responseData)
          : String(responseData || 'Unknown upstream simulation engine error');

      logger.error(`Scenario Engine responded with status ${status} during ${operation}`, {
        operation,
        status,
      });

      if (status >= 400 && status < 500) {
        throw new ScenarioEngineServiceError(
          `Scenario Engine rejected input: ${detail}`,
          status,
          'SCENARIO_ENGINE_BAD_REQUEST',
          { status, operation }
        );
      }

      throw new ScenarioEngineServiceError(
        `Scenario Engine service error (${status}): ${detail}`,
        502,
        'SCENARIO_ENGINE_UPSTREAM_ERROR',
        { status, operation }
      );
    }

    const networkMessage = error.message || 'Connection refused or host unreachable';
    logger.error(`Scenario Engine unavailable during ${operation}`, {
      operation,
      message: networkMessage,
      baseUrl: this.baseUrl,
    });

    throw new ScenarioEngineServiceError(
      `Scenario Simulation Engine is unavailable at ${this.baseUrl}: ${networkMessage}`,
      503,
      'SCENARIO_ENGINE_UNAVAILABLE',
      { operation, baseUrl: this.baseUrl }
    );
  }
}

export const scenarioEngineClient = new ScenarioEngineClient();
