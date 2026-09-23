import { fetchApi } from './client';
import type { AssetListResponse } from '../types/api';

export interface GetAssetsParams {
  organizationId?: string;
  businessUnitId?: string;
  assetType?: string;
  isInternetFacing?: boolean;
  businessCriticality?: number;
  dataClassification?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const assetApi = {
  getAssets: (params: GetAssetsParams = {}) => {
    const query = new URLSearchParams();
    
    if (params.organizationId) query.append('organizationId', params.organizationId);
    if (params.businessUnitId) query.append('businessUnitId', params.businessUnitId);
    if (params.assetType) query.append('assetType', params.assetType);
    if (params.isInternetFacing !== undefined) query.append('isInternetFacing', params.isInternetFacing.toString());
    if (params.businessCriticality !== undefined) query.append('businessCriticality', params.businessCriticality.toString());
    if (params.dataClassification) query.append('dataClassification', params.dataClassification);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchApi<AssetListResponse>(`/api/assets${queryString}`);
  }
};
