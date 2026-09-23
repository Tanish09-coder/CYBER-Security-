import axios from 'axios';
import { NvdClient } from '../nvd.client';
import { NvdRateLimitError, NvdInvalidRequestError, NvdTimeoutError } from '../nvd.types';
import v31Fixture from './fixtures/nvd-cve-v31.json';
import searchFixture from './fixtures/nvd-search-response.json';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('NvdClient', () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    mockedAxios.create.mockReturnValue({
      get: mockGet,
    } as any);
  });

  it('should include apiKey header when configured and instantiate axios with it', () => {
    const secretKey = 'test-secret-nvd-api-key-12345';
    new NvdClient({
      apiKey: secretKey,
      baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    });

    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          apiKey: secretKey,
        }),
      })
    );
  });

  it('should fetch a CVE by ID successfully', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        totalResults: 1,
        vulnerabilities: [{ cve: v31Fixture }],
      },
    });

    const client = new NvdClient({ apiKey: 'mock-key', requestDelayMs: 0 });
    const result = await client.fetchCveById('CVE-2021-44228');

    expect(result).toBeDefined();
    expect(result?.id).toBe('CVE-2021-44228');
    expect(mockGet).toHaveBeenCalledWith('', {
      params: { cveId: 'CVE-2021-44228' },
    });
  });

  it('should retry on HTTP 429 rate limit with backoff and succeed', async () => {
    // Fail with 429 once, then succeed
    mockGet
      .mockRejectedValueOnce({
        response: { status: 429, statusText: 'Too Many Requests' },
      })
      .mockResolvedValueOnce({
        data: {
          totalResults: 1,
          vulnerabilities: [{ cve: v31Fixture }],
        },
      });

    const client = new NvdClient({
      maxRetries: 2,
      requestDelayMs: 0,
    });
    const result = await client.fetchCveById('CVE-2021-44228');

    expect(result?.id).toBe('CVE-2021-44228');
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should throw NvdRateLimitError when 429 persists beyond max retries', async () => {
    mockGet.mockRejectedValue({
      response: { status: 429, statusText: 'Too Many Requests' },
    });

    const client = new NvdClient({
      maxRetries: 1,
      requestDelayMs: 0,
    });

    await expect(client.fetchCveById('CVE-2021-44228')).rejects.toThrow(
      NvdRateLimitError
    );
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on HTTP 400 Bad Request', async () => {
    mockGet.mockRejectedValueOnce({
      response: { status: 400, statusText: 'Bad Request' },
    });

    const client = new NvdClient({
      maxRetries: 3,
      requestDelayMs: 0,
    });

    await expect(client.fetchCveById('INVALID-FORMAT')).rejects.toThrow(
      NvdInvalidRequestError
    );
    // Should fail immediately without retrying
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should retry on HTTP 503 Service Unavailable and succeed', async () => {
    mockGet
      .mockRejectedValueOnce({
        response: { status: 503, statusText: 'Service Unavailable' },
      })
      .mockResolvedValueOnce({
        data: {
          totalResults: 1,
          vulnerabilities: [{ cve: v31Fixture }],
        },
      });

    const client = new NvdClient({
      maxRetries: 2,
      requestDelayMs: 0,
    });
    const result = await client.fetchCveById('CVE-2021-44228');

    expect(result?.id).toBe('CVE-2021-44228');
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should handle request timeout and throw NvdTimeoutError after retries', async () => {
    mockGet.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
    });

    const client = new NvdClient({
      maxRetries: 1,
      requestDelayMs: 0,
    });

    await expect(client.fetchCveById('CVE-2021-44228')).rejects.toThrow(
      NvdTimeoutError
    );
  });

  it('should correctly pass pagination parameters in date range query', async () => {
    mockGet.mockResolvedValueOnce({
      data: searchFixture,
    });

    const client = new NvdClient({ requestDelayMs: 0 });
    const result = await client.fetchCvesByDateRange({
      pubStartDate: '2024-02-01T00:00:00.000Z',
      pubEndDate: '2024-02-10T23:59:59.000Z',
      startIndex: 100,
      resultsPerPage: 50,
    });

    expect(result.totalResults).toBe(2);
    expect(mockGet).toHaveBeenCalledWith('', {
      params: {
        pubStartDate: '2024-02-01T00:00:00.000Z',
        pubEndDate: '2024-02-10T23:59:59.000Z',
        startIndex: 100,
        resultsPerPage: 50,
      },
    });
  });
});
