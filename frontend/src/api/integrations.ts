import { fetchApi } from './client';
import type { NvdStatusResponse, CisaKevStatusResponse, CisaKevSyncResponse } from '../types/api';

export const integrationApi = {
  getNvdStatus: () => {
    return fetchApi<NvdStatusResponse>('/api/integrations/nvd/status');
  },
  
  getCisaKevStatus: () => {
    return fetchApi<CisaKevStatusResponse>('/api/integrations/cisa-kev/status');
  },

  syncCisaKev: () => {
    return fetchApi<CisaKevSyncResponse>('/api/integrations/cisa-kev/sync', {
      method: 'POST',
    });
  }
};
