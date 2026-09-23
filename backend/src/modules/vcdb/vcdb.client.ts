import axios, { AxiosInstance } from 'axios';
import AdmZip from 'adm-zip';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  VcdbUnavailableError,
  VcdbInvalidPayloadError,
  VcdbTimeoutError,
} from './vcdb.validation';

export interface VcdbFetchedData {
  incidents: any[];
  commitSha?: string;
  verisVersion?: string;
  bundleHashBuffer: Buffer;
}

export class VcdbClient {
  private http: AxiosInstance;
  private maxRetries: number;
  private maxDecompressedBytes: number;

  constructor(options?: {
    timeoutMs?: number;
    maxRetries?: number;
    maxDecompressedBytes?: number;
  }) {
    const timeout = options?.timeoutMs ?? env.VCDB_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? env.VCDB_MAX_RETRIES;
    // Default 200MB maximum uncompressed size safety limit
    this.maxDecompressedBytes = options?.maxDecompressedBytes ?? 200 * 1024 * 1024;

    this.http = axios.create({
      timeout,
      headers: {
        'User-Agent': 'CyberRiskOS-VCDB-Ingestion/1.0',
        Accept: '*/*',
      },
    });
  }

  /**
   * Executes an HTTP GET request with jittered exponential backoff for 5xx and timeouts.
   * Does NOT retry permanent 4xx errors.
   */
  private async executeWithRetry<T>(url: string, responseType: 'arraybuffer' | 'json' = 'json'): Promise<T> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const response = await this.http.get<T>(url, { responseType });
        return response.data;
      } catch (err: any) {
        attempt++;
        const status = err.response?.status;
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        const isTransient = status && status >= 500 && status < 600;
        const isRateLimit = status === 429;

        if (attempt > this.maxRetries || (!isTimeout && !isTransient && !isRateLimit)) {
          if (status === 404) {
            throw new VcdbUnavailableError(`Official VCDB resource not found (404): ${url}`, 404);
          }
          if (isTimeout) {
            throw new VcdbTimeoutError(`Request timed out fetching VCDB resource: ${url}`);
          }
          throw new VcdbUnavailableError(
            `Failed to fetch official VCDB resource from ${url}: ${err.message}`,
            status
          );
        }

        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delayMs = Math.min(baseDelay + jitter, 10000);

        logger.warn(`VCDB transient network error (Status: ${status || err.code}). Retrying in ${Math.round(delayMs)}ms (Attempt ${attempt}/${this.maxRetries})`, {
          url,
          attempt,
          delayMs,
        });

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new VcdbUnavailableError(`Exceeded maximum retries for VCDB resource: ${url}`);
  }

  /**
   * Retrieves the current commit SHA from official vz-risk/VCDB repository (if available via GitHub API).
   */
  async fetchCommitSha(): Promise<string | undefined> {
    try {
      const commitData = await this.executeWithRetry<any[]>(
        'https://api.github.com/repos/vz-risk/VCDB/commits?per_page=1'
      );
      if (Array.isArray(commitData) && commitData.length > 0 && commitData[0].sha) {
        return commitData[0].sha;
      }
    } catch (err: any) {
      logger.info('Could not retrieve commit SHA via GitHub API (likely unauthenticated rate limit); falling back to SHA-256 payload hash', {
        error: err.message,
      });
    }
    return undefined;
  }

  /**
   * Retrieves the official VERIS schema version from vz-risk/veris repository.
   */
  async fetchVerisVersion(): Promise<string | undefined> {
    try {
      const verisSchema = await this.executeWithRetry<any>(
        'https://raw.githubusercontent.com/vz-risk/veris/master/verisc.json'
      );
      if (verisSchema && typeof verisSchema === 'object') {
        const ver = verisSchema.version || verisSchema.id || verisSchema.title;
        if (typeof ver === 'string' && ver.length > 0) return ver;
      }
    } catch (err: any) {
      logger.info('Could not fetch remote verisc.json version; will detect version dynamically from incident records', {
        error: err.message,
      });
    }
    return undefined;
  }

  /**
   * Safely parses and validates a VCDB ZIP buffer without performing network calls.
   */
  parseZipBuffer(buffer: Buffer): { incidents: any[]; bundleHashBuffer: Buffer; uncompressedSizeBytes: number } {
    if (buffer.length < 30 || buffer.readUInt32LE(0) !== 0x04034b50) {
      throw new VcdbInvalidPayloadError('Downloaded VCDB resource is not a valid ZIP archive (missing PK header)');
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (err: any) {
      throw new VcdbInvalidPayloadError(`Failed to parse VCDB ZIP archive: ${err.message}`);
    }

    const entries = zip.getEntries();
    if (!entries || entries.length === 0) {
      throw new VcdbInvalidPayloadError('VCDB ZIP archive contains no file entries');
    }

    // Safely inspect entries for path traversal and valid entry format
    const targetEntry = entries.find((e) => {
      const name = e.entryName;
      if (name.includes('..') || name.startsWith('/') || name.startsWith('\\')) {
        throw new VcdbInvalidPayloadError(`Path traversal or unsafe filename detected in ZIP archive entry: ${name}`);
      }
      return name.endsWith('.json') || name.includes('vcdb');
    });

    if (!targetEntry) {
      throw new VcdbInvalidPayloadError('VCDB ZIP archive does not contain an expected .json incident array entry');
    }

    if (targetEntry.header.size > this.maxDecompressedBytes) {
      throw new VcdbInvalidPayloadError(
        `VCDB ZIP entry decompressed size (${targetEntry.header.size} bytes) exceeds maximum limit (${this.maxDecompressedBytes} bytes)`
      );
    }

    let decompressedText: string;
    try {
      decompressedText = zip.readAsText(targetEntry);
    } catch (err: any) {
      throw new VcdbInvalidPayloadError(`Failed to decompress VCDB ZIP entry ${targetEntry.entryName}: ${err.message}`);
    }

    let parsedIncidents: any[];
    try {
      parsedIncidents = JSON.parse(decompressedText);
    } catch (err: any) {
      throw new VcdbInvalidPayloadError(`Decompressed VCDB payload is not valid JSON: ${err.message}`);
    }

    if (!Array.isArray(parsedIncidents)) {
      throw new VcdbInvalidPayloadError('VCDB payload JSON is not an array of incidents');
    }

    return {
      incidents: parsedIncidents,
      bundleHashBuffer: buffer,
      uncompressedSizeBytes: decompressedText.length,
    };
  }

  /**
   * Downloads and safely extracts the canonical official VCDB joined JSON archive (`data/joined/vcdb.json.zip`).
   * Validates archive integrity, unsafe path traversal, expected entry name, and decompression size limits.
   */
  async fetchCanonicalJoinedZip(zipUrl?: string): Promise<VcdbFetchedData> {
    const url = zipUrl || env.VCDB_ZIP_URL;

    logger.info(`Fetching official canonical VCDB joined archive`, { url });

    const zipBuffer = await this.executeWithRetry<ArrayBuffer>(url, 'arraybuffer');
    const buffer = Buffer.from(zipBuffer);

    const parsed = this.parseZipBuffer(buffer);
    const commitSha = await this.fetchCommitSha();
    const verisVersion = await this.fetchVerisVersion();

    logger.info(`Successfully fetched and extracted canonical VCDB archive`, {
      totalIncidents: parsed.incidents.length,
      compressedBytes: buffer.length,
      decompressedBytes: parsed.uncompressedSizeBytes,
      commitSha: commitSha || 'N/A',
      verisVersion: verisVersion || 'dynamic',
    });

    return {
      incidents: parsed.incidents,
      commitSha,
      verisVersion,
      bundleHashBuffer: buffer,
    };
  }
}
