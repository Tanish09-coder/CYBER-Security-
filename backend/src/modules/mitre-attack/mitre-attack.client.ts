import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  MitreAttackIndex,
  DiscoveredEnterpriseRelease,
  StixBundle,
} from './mitre-attack.types';
import {
  MitreAttackUnavailableError,
  MitreAttackTimeoutError,
  MitreAttackInvalidPayloadError,
  mitreIndexSchema,
  stixBundleEnvelopeSchema,
} from './mitre-attack.validation';

export class MitreAttackClient {
  private axiosInstance: AxiosInstance;
  private indexUrl: string;
  private defaultEnterpriseUrl: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options?: {
    indexUrl?: string;
    enterpriseUrl?: string;
    timeoutMs?: number;
    maxRetries?: number;
  }) {
    this.indexUrl = options?.indexUrl || env.MITRE_ATTACK_INDEX_URL;
    this.defaultEnterpriseUrl = options?.enterpriseUrl || env.MITRE_ATTACK_ENTERPRISE_URL;
    this.timeoutMs = options?.timeoutMs || env.MITRE_ATTACK_TIMEOUT_MS;
    this.maxRetries =
      options?.maxRetries !== undefined ? options.maxRetries : env.MITRE_ATTACK_MAX_RETRIES;

    this.axiosInstance = axios.create({
      timeout: this.timeoutMs,
      maxContentLength: 150 * 1024 * 1024, // 150MB buffer for STIX enterprise bundles
      maxBodyLength: 150 * 1024 * 1024,
      headers: {
        'User-Agent': 'CyberRiskOS-MITRE-ATTACK-Ingestor/1.0',
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

  private async executeWithRetry<T>(
    operationName: string,
    url: string,
    validator: (data: unknown) => { success: boolean; data?: T; error?: any }
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        logger.info(`Fetching official MITRE ATT&CK resource: ${operationName}`, { url });
        const response = await this.axiosInstance.get<unknown>(url);

        const validation = validator(response.data);
        if (!validation.success) {
          logger.error(`MITRE ATT&CK ${operationName} payload failed validation`, {
            errors: validation.error?.format ? validation.error.format() : validation.error,
          });
          throw new MitreAttackInvalidPayloadError(
            `Received malformed response from MITRE ATT&CK ${operationName}`
          );
        }

        return validation.data as T;
      } catch (err: unknown) {
        if (err instanceof MitreAttackInvalidPayloadError) {
          throw err;
        }

        attempt++;
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;
        const isTimeout =
          axiosErr.code === 'ECONNABORTED' ||
          axiosErr.message?.toLowerCase().includes('timeout');

        // Never retry permanent 400 or 404
        if (status === 400 || status === 404) {
          logger.warn(`MITRE ATT&CK endpoint returned client error HTTP ${status}`, {
            status,
            url,
          });
          throw new MitreAttackUnavailableError(
            `MITRE ATT&CK endpoint rejected request with HTTP ${status}`
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
            `MITRE ATT&CK transient network error (Status: ${status || axiosErr.code}). Retrying in ${delay}ms (Attempt ${attempt}/${this.maxRetries})`,
            { status, attempt, delayMs: delay, url }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (isTimeout) {
          throw new MitreAttackTimeoutError(
            `MITRE ATT&CK request timed out after ${this.timeoutMs}ms for ${url}`
          );
        }

        throw new MitreAttackUnavailableError(
          axiosErr.message || `Failed to connect to MITRE ATT&CK endpoint ${url}`
        );
      }
    }

    throw new MitreAttackUnavailableError(
      `Exceeded maximum retry attempts connecting to MITRE ATT&CK for ${operationName}`
    );
  }

  async fetchIndex(): Promise<MitreAttackIndex> {
    return this.executeWithRetry<MitreAttackIndex>('index.json', this.indexUrl, (data) => {
      const res = mitreIndexSchema.safeParse(data);
      return res.success ? { success: true, data: res.data as MitreAttackIndex } : { success: false, error: res.error };
    });
  }

  async discoverLatestEnterpriseRelease(): Promise<DiscoveredEnterpriseRelease> {
    const index = await this.fetchIndex();

    // Find the collection corresponding to Enterprise ATT&CK
    // Identified by version URLs containing 'enterprise-attack' or collection metadata
    const enterpriseCollection = index.collections.find((c) =>
      c.versions.some((v) => v.url && v.url.toLowerCase().includes('enterprise-attack'))
    );

    if (!enterpriseCollection || enterpriseCollection.versions.length === 0) {
      throw new MitreAttackInvalidPayloadError(
        'Official MITRE index does not contain an Enterprise ATT&CK collection'
      );
    }

    // Sort versions by modified timestamp descending or numeric version
    const sortedVersions = [...enterpriseCollection.versions].sort((a, b) => {
      // First try numeric version compare
      const numA = parseFloat(a.version);
      const numB = parseFloat(b.version);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numB - numA;
      }
      return new Date(b.modified).getTime() - new Date(a.modified).getTime();
    });

    const latest = sortedVersions[0];
    if (!latest || !latest.url) {
      throw new MitreAttackInvalidPayloadError(
        'Latest Enterprise ATT&CK version in index is missing a valid release URL'
      );
    }

    logger.info('Discovered latest Enterprise ATT&CK release from official index', {
      version: latest.version,
      releaseUrl: latest.url,
      modified: latest.modified,
    });

    return {
      version: latest.version,
      url: latest.url,
      modified: latest.modified,
      collectionId: enterpriseCollection.id,
    };
  }

  async fetchBundle(bundleUrl: string): Promise<StixBundle> {
    return this.executeWithRetry<StixBundle>('STIX Bundle', bundleUrl, (data) => {
      const res = stixBundleEnvelopeSchema.safeParse(data);
      return res.success ? { success: true, data: res.data as StixBundle } : { success: false, error: res.error };
    });
  }

  getDefaultEnterpriseUrl(): string {
    return this.defaultEnterpriseUrl;
  }
}
