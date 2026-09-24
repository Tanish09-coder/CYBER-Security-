import { fetchApi } from './client';
import {
  RiskExplanationRequestDTO,
  FinancialExplanationRequestDTO,
  StrategyComparisonRequestDTO,
  AIExplanationResponseDTO
} from '../types/assistant';

export const assistantApi = {
  explainRisk: (data: RiskExplanationRequestDTO) => {
    return fetchApi<{ success: boolean; data: AIExplanationResponseDTO }>('/v1/assistant/explain-risk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  explainFinancial: (data: FinancialExplanationRequestDTO) => {
    return fetchApi<{ success: boolean; data: AIExplanationResponseDTO }>('/v1/assistant/explain-financial', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  compareStrategies: (data: StrategyComparisonRequestDTO) => {
    return fetchApi<{ success: boolean; data: AIExplanationResponseDTO }>('/v1/assistant/compare-strategies', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
