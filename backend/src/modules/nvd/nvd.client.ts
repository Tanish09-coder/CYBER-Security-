import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  NvdApiResponse,
  NvdCveItem,
  NvdQueryParams,
  NvdRateLimitError,
  NvdUnavailableError,
  NvdInvalidRequestError,
  NvdTimeoutError,
} from './nvd.types';

export class NvdClient {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private apiKey?: string;
  private timeoutMs: number;
  private maxRetries: number;
  private requestDelayMs: number;
  private lastRequestTime: number = 0;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
    maxRetries?: number;
    requestDelayMs?: number;
  }) {
    this.baseUrl = options?.baseUrl || env.NVD_BASE_URL;
    this.apiKey = options?.apiKey !== undefined ? options.apiKey : env.NVD_API_KEY;
    this.timeoutMs = options?.timeoutMs || env.NVD_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries !== undefined ? options.maxRetries : env.NVD_MAX_RETRIES;
    this.requestDelayMs = options?.requestDelayMs !== undefined ? options.requestDelayMs : env.NVD_REQUEST_DELAY_MS;

    const headers: Record<string, string> = {
      'User-Agent': 'CyberRiskOS-NVD-Ingestor/1.0',
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers['apiKey'] = this.apiKey;
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeoutMs,
      headers,
    });
  }

  private async paceRequest(): Promise<void> {
    if (this.requestDelayMs <= 0) return;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.requestDelayMs) {
      const waitTime = this.requestDelayMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  private calculateBackoffWithJitter(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * (exponential * 0.2));
    return exponential + jitter;
  }

  private async executeWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      await this.paceRequest();
      try {
        return await requestFn();
      } catch (err: unknown) {
        attempt++;
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;
        const isTimeout =
          axiosErr.code === 'ECONNABORTED' ||
          axiosErr.message?.toLowerCase().includes('timeout');

        // Do NOT retry on client bad request or invalid queries
        if (status === 400 || status === 404) {
          logger.warn(`NVD request rejected with HTTP ${status} (No retry)`, {
            status,
            url: axiosErr.config?.url,
          });
          throw new NvdInvalidRequestError(
            `NVD request rejected with HTTP ${status}: ${axiosErr.response?.statusText || 'Client error'}`
          );
        }

        const isRetryable =
          status === 429 ||
          (status !== undefined && status >= 500 && status <= 504) ||
          isTimeout ||
          axiosErr.code === 'ENOTFOUND' ||
          axiosErr.code === 'ECONNRESET';

        if (isRetryable && attempt <= this.maxRetries) {
          const delay = this.calculateBackoffWithJitter(attempt);
          logger.warn(
            `NVD API temporary error (Status: ${status || axiosErr.code}). Retrying in ${delay}ms (Attempt ${attempt}/${this.maxRetries})`,
            {
              status,
              attempt,
              maxRetries: this.maxRetries,
              delayMs: delay,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Map final error
        if (status === 429) {
          throw new NvdRateLimitError('NVD rate limit exceeded after maximum retries');
        }
        if (isTimeout) {
          throw new NvdTimeoutError(`NVD request timed out after ${this.timeoutMs}ms`);
        }
        if (status && status >= 500) {
          throw new NvdUnavailableError(`NVD API service unavailable (HTTP ${status})`);
        }

        throw new NvdUnavailableError(
          axiosErr.message || 'NVD API connection failed'
        );
      }
    }

    throw new NvdUnavailableError('Exceeded maximum retry attempts connecting to NVD API');
  }

  async fetchCveById(cveId: string): Promise<NvdCveItem | null> {
    const cleanId = cveId.trim().toUpperCase();
    logger.info(`Fetching CVE from NVD API`, { cveId: cleanId });

    const response = await this.executeWithRetry<NvdApiResponse>(async () => {
      const res = await this.axiosInstance.get<NvdApiResponse>('', {
        params: { cveId: cleanId },
      });
      return res.data;
    });

    if (!response.vulnerabilities || response.vulnerabilities.length === 0) {
      return null;
    }

    return response.vulnerabilities[0].cve;
  }

  async fetchCvesByDateRange(params: {
    pubStartDate: string;
    pubEndDate: string;
    startIndex?: number;
    resultsPerPage?: number;
  }): Promise<NvdApiResponse> {
    logger.info(`Fetching CVEs by publication date range`, {
      pubStartDate: params.pubStartDate,
      pubEndDate: params.pubEndDate,
      startIndex: params.startIndex || 0,
      resultsPerPage: params.resultsPerPage || 100,
    });

    return await this.executeWithRetry<NvdApiResponse>(async () => {
      const res = await this.axiosInstance.get<NvdApiResponse>('', {
        params: {
          pubStartDate: params.pubStartDate,
          pubEndDate: params.pubEndDate,
          startIndex: params.startIndex || 0,
          resultsPerPage: params.resultsPerPage || 100,
        },
      });
      return res.data;
    });
  }

  async fetchModifiedCves(params: {
    lastModStartDate: string;
    lastModEndDate: string;
    startIndex?: number;
    resultsPerPage?: number;
  }): Promise<NvdApiResponse> {
    logger.info(`Fetching modified CVEs for incremental sync`, {
      lastModStartDate: params.lastModStartDate,
      lastModEndDate: params.lastModEndDate,
      startIndex: params.startIndex || 0,
      resultsPerPage: params.resultsPerPage || 100,
    });

    return await this.executeWithRetry<NvdApiResponse>(async () => {
      const res = await this.axiosInstance.get<NvdApiResponse>('', {
        params: {
          lastModStartDate: params.lastModStartDate,
          lastModEndDate: params.lastModEndDate,
          startIndex: params.startIndex || 0,
          resultsPerPage: params.resultsPerPage || 100,
        },
      });
      return res.data;
    });
  }
}
