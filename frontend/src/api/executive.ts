import { fetchApi } from './client';
import {
  ExecutivePostureDTO,
  ExecutiveTopRiskDTO,
  ExecutiveFinancialSummaryDTO
} from '../types/executive';

export const executiveApi = {
  getPosture: () => {
    return fetchApi<{ success: boolean; data: ExecutivePostureDTO }>('/v1/executive/posture');
  },
  
  getTopRisks: (limit: number = 5) => {
    return fetchApi<{ success: boolean; data: ExecutiveTopRiskDTO[] }>(`/v1/executive/top-risks?limit=${limit}`);
  },

  getFinancialSummary: () => {
    return fetchApi<{ success: boolean; data: ExecutiveFinancialSummaryDTO }>('/v1/executive/financial-summary');
  }
};
