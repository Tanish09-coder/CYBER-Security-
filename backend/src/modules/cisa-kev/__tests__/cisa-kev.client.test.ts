import axios from 'axios';
import { CisaKevClient } from '../cisa-kev.client';
import {
  CisaKevUnavailableError,
  CisaKevTimeoutError,
  CisaKevInvalidPayloadError,
} from '../cisa-kev.types';
import catalogFixture from './fixtures/cisa-kev-catalog.json';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CisaKevClient', () => {
  let mockGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet = jest.fn();
    mockedAxios.create.mockReturnValue({
      get: mockGet,
    } as any);
  });

  it('should fetch the official KEV catalog successfully', async () => {
    mockGet.mockResolvedValueOnce({
      data: catalogFixture,
    });

    const client = new CisaKevClient();
    const result = await client.fetchCatalog();

    expect(result).toBeDefined();
    expect(result.catalogVersion).toBe('2024.05.01');
    expect(result.vulnerabilities.length).toBe(2);
    expect(result.vulnerabilities[0].cveID).toBe('CVE-2021-44228');
  });

  it('should retry on HTTP 503 and succeed on next attempt', async () => {
    mockGet
      .mockRejectedValueOnce({
        response: { status: 503, statusText: 'Service Unavailable' },
      })
      .mockResolvedValueOnce({
        data: catalogFixture,
      });

    const client = new CisaKevClient({ maxRetries: 2 });
    const result = await client.fetchCatalog();

    expect(result.vulnerabilities.length).toBe(2);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should throw CisaKevTimeoutError when requests time out beyond retries', async () => {
    mockGet.mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
    });

    const client = new CisaKevClient({ maxRetries: 1 });
    await expect(client.fetchCatalog()).rejects.toThrow(CisaKevTimeoutError);
  });

  it('should NOT retry on HTTP 404', async () => {
    mockGet.mockRejectedValueOnce({
      response: { status: 404, statusText: 'Not Found' },
    });

    const client = new CisaKevClient({ maxRetries: 3 });
    await expect(client.fetchCatalog()).rejects.toThrow(CisaKevUnavailableError);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should throw CisaKevInvalidPayloadError when response envelope is malformed', async () => {
    mockGet.mockResolvedValueOnce({
      data: { invalidKey: 'not a valid catalog' },
    });

    const client = new CisaKevClient({ maxRetries: 0 });
    await expect(client.fetchCatalog()).rejects.toThrow(CisaKevInvalidPayloadError);
  });
});
