import { fetchApi } from './client';
import type { VulnerabilityListResponse, VulnerabilityDetailResponse } from '../types/api';

export interface GetVulnerabilitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  severity?: string;
  kevOnly?: boolean;
  ransomwareOnly?: boolean;
}

export const vulnerabilityApi = {
  getVulnerabilities: (params: GetVulnerabilitiesParams = {}) => {
    const query = new URLSearchParams();
    
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.severity) query.append('severity', params.severity);
    if (params.kevOnly) query.append('kevOnly', 'true');
    if (params.ransomwareOnly) query.append('ransomwareOnly', 'true');
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<VulnerabilityListResponse>(`/api/vulnerabilities${queryString}`);
  },
  
  getVulnerabilityById: (cveId: string) => {
    return fetchApi<VulnerabilityDetailResponse>(`/api/vulnerabilities/${encodeURIComponent(cveId)}`);
  }
};
