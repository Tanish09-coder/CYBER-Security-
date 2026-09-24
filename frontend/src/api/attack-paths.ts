import { fetchApi } from './client';
import {
  AttackGraphAnalysisResultDTO,
  ChokePointDTO,
  AssetBlastRadiusDTO
} from '../types/attack-paths';

export const attackPathsApi = {
  getAttackGraph: () => {
    return fetchApi<{ success: boolean; data: AttackGraphAnalysisResultDTO }>('/v1/attack-paths');
  },
  
  getChokePoints: (limit: number = 10) => {
    return fetchApi<{ success: boolean; data: ChokePointDTO[] }>(`/v1/attack-paths/choke-points?limit=${limit}`);
  },

  getAssetBlastRadius: (assetId: string) => {
    return fetchApi<{ success: boolean; data: AssetBlastRadiusDTO }>(`/v1/attack-paths/asset/${assetId}`);
  }
};
