import axios from 'axios';
import { MitreAttackClient } from '../mitre-attack.client';
import {
  MitreAttackUnavailableError,
  MitreAttackTimeoutError,
  MitreAttackInvalidPayloadError,
} from '../mitre-attack.validation';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MitreAttackClient', () => {
  let client: MitreAttackClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      get: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    client = new MitreAttackClient({
      indexUrl: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json',
      enterpriseUrl: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
      timeoutMs: 1000,
      maxRetries: 2,
    });
  });

  const validIndexPayload = {
    id: '10296991-439b-4202-90a3-e38812613ad4',
    name: 'MITRE ATT&CK',
    collections: [
      {
        id: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
        versions: [
          {
            version: '19.1',
            url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.1.json',
            modified: '2026-05-12T14:00:00.188Z',
          },
          {
            version: '19.2',
            url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.2.json',
            modified: '2026-08-05T21:33:58.496Z',
          },
          {
            version: '18.0',
            url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-18.0.json',
            modified: '2025-10-28T14:00:00.188Z',
          },
        ],
      },
    ],
  };

  const validBundlePayload = {
    type: 'bundle',
    id: 'bundle--test-enterprise',
    spec_version: '2.1',
    objects: [
      {
        type: 'x-mitre-tactic',
        id: 'x-mitre-tactic--ta0001',
        name: 'Initial Access',
      },
    ],
  };

  it('should fetch index and discover the latest Enterprise release dynamically', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: validIndexPayload });

    const release = await client.discoverLatestEnterpriseRelease();
    expect(release.version).toBe('19.2');
    expect(release.url).toBe(
      'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack-19.2.json'
    );
    expect(release.modified).toBe('2026-08-05T21:33:58.496Z');
  });

  it('should fetch a STIX bundle and validate envelope schema', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: validBundlePayload });

    const bundle = await client.fetchBundle('https://example.com/bundle.json');
    expect(bundle.type).toBe('bundle');
    expect(bundle.id).toBe('bundle--test-enterprise');
    expect(bundle.objects.length).toBe(1);
  });

  it('should reject invalid malformed index payload', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { invalid: 'no collections' } });

    await expect(client.fetchIndex()).rejects.toThrow(MitreAttackInvalidPayloadError);
  });

  it('should reject invalid STIX bundle missing objects array', async () => {
    mockAxiosInstance.get.mockResolvedValueOnce({ data: { type: 'not-a-bundle' } });

    await expect(client.fetchBundle('https://example.com/bad.json')).rejects.toThrow(
      MitreAttackInvalidPayloadError
    );
  });

  it('should retry on HTTP 503 and succeed on next attempt', async () => {
    const error503: any = new Error('Service Unavailable');
    error503.response = { status: 503 };

    mockAxiosInstance.get
      .mockRejectedValueOnce(error503)
      .mockResolvedValueOnce({ data: validBundlePayload });

    const bundle = await client.fetchBundle('https://example.com/bundle.json');
    expect(bundle.id).toBe('bundle--test-enterprise');
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on HTTP 404', async () => {
    const error404: any = new Error('Not Found');
    error404.response = { status: 404 };

    mockAxiosInstance.get.mockRejectedValue(error404);

    await expect(client.fetchBundle('https://example.com/missing.json')).rejects.toThrow(
      MitreAttackUnavailableError
    );
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
  });

  it('should throw MitreAttackTimeoutError when requests time out beyond retries', async () => {
    const timeoutErr: any = new Error('timeout of 1000ms exceeded');
    timeoutErr.code = 'ECONNABORTED';

    mockAxiosInstance.get.mockRejectedValue(timeoutErr);

    await expect(client.fetchBundle('https://example.com/timeout.json')).rejects.toThrow(
      MitreAttackTimeoutError
    );
  });
});
