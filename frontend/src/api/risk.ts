import { fetchApi } from './client';
import {
  RiskCalculationRequest,
  RiskCalculationResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  OptimizerRequest,
  OptimizerResponse
} from '../types/risk';

export const riskApi = {
  calculateRisk: (data: RiskCalculationRequest) => {
    return fetchApi<RiskCalculationResponse>('/v1/risk/calculate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  simulateWhatIf: (data: WhatIfSimulationRequest) => {
    return fetchApi<WhatIfSimulationResponse>('/v1/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  optimizeBudget: (data: OptimizerRequest) => {
    return fetchApi<OptimizerResponse>('/v1/optimizer/solve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
