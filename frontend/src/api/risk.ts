import { fetchApi } from './client';
import {
  RiskCalculationResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  OptimizerRequest,
  OptimizerResponse,
  FinancialExposureResponse
} from '../types/risk';

export const riskApi = {
  getRiskScores: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return fetchApi<RiskCalculationResponse>(`/v1/risk/scores?${query.toString()}`);
  },
  
  getFinancialExposure: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return fetchApi<FinancialExposureResponse>(`/v1/financial/exposure?${query.toString()}`);
  },
  
  simulateWhatIf: (data: WhatIfSimulationRequest) => {
    return fetchApi<WhatIfSimulationResponse>('/v1/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  optimizeBudget: (data: OptimizerRequest) => {
    return fetchApi<OptimizerResponse>('/v1/optimization/solve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
