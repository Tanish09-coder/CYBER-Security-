import { fetchApi } from './client';
import type { NvdStatusResponse, CisaKevStatusResponse, CisaKevSyncResponse } from '../types/api';

export const integrationApi = {
  getNvdStatus: () => {
    return fetchApi<NvdStatusResponse>('/api/integrations/nvd/status');
  },
  
  syncNvd: () => {
    return fetchApi<any>('/api/integrations/nvd/sync', {
      method: 'POST',
    });
  },

  getCisaKevStatus: () => {
    return fetchApi<CisaKevStatusResponse>('/api/integrations/cisa-kev/status');
  },

  syncCisaKev: () => {
    return fetchApi<CisaKevSyncResponse>('/api/integrations/cisa-kev/sync', {
      method: 'POST',
    });
  },

  getMitreStatus: () => {
    return fetchApi<any>('/api/integrations/mitre-attack/status');
  },

  syncMitreAttack: () => {
    return fetchApi<any>('/api/integrations/mitre-attack/sync', {
      method: 'POST',
    });
  },

  getVcdbStatus: () => {
    return fetchApi<any>('/api/integrations/vcdb/status');
  },

  syncVcdb: () => {
    return fetchApi<any>('/api/integrations/vcdb/sync', {
      method: 'POST',
    });
  }
};
