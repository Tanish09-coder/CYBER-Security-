import { fetchApi } from './client';
import type { ControlsSummaryResponse } from '../types/api';

export const controlsApi = {
  getControlsSummary: (organizationId?: string) => {
    const query = new URLSearchParams();
    if (organizationId) {
      query.append('organizationId', organizationId);
    }
    
    const queryString = query.toString() ? `&${query.toString()}` : '';
    return fetchApi<ControlsSummaryResponse>(`/api/controls?summary=true${queryString}`);
  }
};
