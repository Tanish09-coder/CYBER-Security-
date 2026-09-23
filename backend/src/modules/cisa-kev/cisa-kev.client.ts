import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  CisaKevCatalogResponse,
  CisaKevUnavailableError,
  CisaKevTimeoutError,
  CisaKevInvalidPayloadError,
} from './cisa-kev.types';
import { cisaKevCatalogEnvelopeSchema } from './cisa-kev.validation';

export class CisaKevClient {
  private axiosInstance: AxiosInstance;
  private catalogUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options?: {
    catalogUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
  }) {
    this.catalogUrl = options?.catalogUrl || env.CISA_KEV_URL;
    this.timeoutMs = options?.timeoutMs || env.CISA_KEV_TIMEOUT_MS;
    this.maxRetries =
      options?.maxRetries !== undefined ? options.maxRetries : env.CISA_KEV_MAX_RETRIES;

    this.axiosInstance = axios.create({
      timeout: this.timeoutMs,
      headers: {
        'User-Agent': 'CyberRiskOS-CISA-KEV-Ingestor/1.0',
        Accept: 'application/json',
      },
    });
  }

  private calculateBackoffWithJitter(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * (exponential * 0.2));
    return exponential + jitter;
  }

  async fetchCatalog(): Promise<CisaKevCatalogResponse> {
    logger.info('Fetching official CISA Known Exploited Vulnerabilities catalog', {
      url: this.catalogUrl,
    });

    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.axiosInstance.get<unknown>(this.catalogUrl);

        // Validate envelope shape
        const validation = cisaKevCatalogEnvelopeSchema.safeParse(response.data);
        if (!validation.success) {
          logger.error('CISA KEV payload failed schema validation', {
            errors: validation.error.format(),
          });
          throw new CisaKevInvalidPayloadError(
            'Received malformed response from CISA KEV endpoint'
          );
        }

        return response.data as CisaKevCatalogResponse;
      } catch (err: unknown) {
        if (err instanceof CisaKevInvalidPayloadError) {
          throw err;
        }

        attempt++;
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;
        const isTimeout =
          axiosErr.code === 'ECONNABORTED' ||
          axiosErr.message?.toLowerCase().includes('timeout');

        // Do not retry on client 404 or bad request
        if (status === 400 || status === 404) {
          logger.warn(`CISA KEV endpoint returned client error HTTP ${status}`, {
            status,
            url: this.catalogUrl,
          });
          throw new CisaKevUnavailableError(
            `CISA KEV endpoint rejected request with HTTP ${status}`
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
            `CISA KEV temporary network error (Status: ${status || axiosErr.code}). Retrying in ${delay}ms (Attempt ${attempt}/${this.maxRetries})`,
            {
              status,
              attempt,
              delayMs: delay,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (isTimeout) {
          throw new CisaKevTimeoutError(
            `CISA KEV request timed out after ${this.timeoutMs}ms`
          );
        }

        throw new CisaKevUnavailableError(
          axiosErr.message || 'Failed to connect to CISA KEV endpoint'
        );
      }
    }

    throw new CisaKevUnavailableError(
      'Exceeded maximum retry attempts connecting to CISA KEV catalog'
    );
  }
}
