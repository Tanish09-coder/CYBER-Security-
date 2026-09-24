import { fetchApi } from './client';

export interface OrganizationResponse {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  currency: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationListResponse {
  data: OrganizationResponse[];
  count: number;
}

export const organizationApi = {
  getOrganizations: () => {
    return fetchApi<OrganizationListResponse>('/api/organizations');
  }
};
