import { fetchApi } from './client';
import type { 
  ThreatIntelSummaryResponse, 
  ThreatIntelKevResponse, 
  MitreTacticsResponse, 
  MitreTechniquesResponse 
} from '../types/api';

export interface ThreatIntelKevParams {
  page?: number;
  limit?: number;
  search?: string;
  ransomware?: boolean;
  dateAddedFrom?: string;
  dateAddedTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface MitreTacticsParams {
  limit?: number;
}

export interface MitreTechniquesParams {
  limit?: number;
}

export const threatIntelApi = {
  getSummary: async () => {
    const res = await fetchApi<{ data: ThreatIntelSummaryResponse }>('/api/threat-intel/summary');
    return res.data;
  },

  getKevCatalog: (params: ThreatIntelKevParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.ransomware) searchParams.append('ransomware', 'true');
    if (params.dateAddedFrom) searchParams.append('dateAddedFrom', params.dateAddedFrom);
    if (params.dateAddedTo) searchParams.append('dateAddedTo', params.dateAddedTo);
    if (params.dueDateFrom) searchParams.append('dueDateFrom', params.dueDateFrom);
    if (params.dueDateTo) searchParams.append('dueDateTo', params.dueDateTo);

    const query = searchParams.toString();
    return fetchApi<ThreatIntelKevResponse>(`/api/threat-intel/kev${query ? `?${query}` : ''}`);
  },

  getMitreTactics: (params: MitreTacticsParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return fetchApi<MitreTacticsResponse>(`/api/threat-intel/attack/tactics${query ? `?${query}` : ''}`);
  },

  getMitreTechniques: (params: MitreTechniquesParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return fetchApi<MitreTechniquesResponse>(`/api/threat-intel/attack/techniques${query ? `?${query}` : ''}`);
  }
};
