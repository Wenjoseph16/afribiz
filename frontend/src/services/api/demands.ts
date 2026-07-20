import { apiClient } from '@/services/apiClient';
import type { ModuleDemand, ModuleMatch, ProposalType } from '@afribiz/shared';

export const createDemand = (data: {
  moduleType: string;
  title: string;
  description?: string;
  budget?: number;
  currency?: string;
  deadline?: string;
  isUrgent?: boolean;
}): Promise<ModuleDemand> => apiClient.post('/business/demands', data).then((r) => r.data.data);

export const getMyDemands = (): Promise<ModuleDemand[]> =>
  apiClient.get('/business/demands').then((r) => r.data.data);

export const getDemandMatches = (demandId: string): Promise<ModuleMatch[]> =>
  apiClient.get(`/business/demands/${demandId}/matches`).then((r) => r.data.data);

export const getOpenDemands = (params?: {
  moduleType?: string;
  search?: string;
}): Promise<ModuleDemand[]> =>
  apiClient.get('/developer/demands/open', { params }).then((r) => r.data.data);

export const applyToDemand = (
  demandId: string,
  data: {
    moduleId?: string;
    proposalType: ProposalType;
  }
): Promise<ModuleMatch> =>
  apiClient.post(`/developer/demands/${demandId}/apply`, data).then((r) => r.data.data);

export const approveDeveloper = (
  demandId: string,
  matchId: string
): Promise<{
  demandId: string;
  matchId: string;
  developerId: string;
}> => apiClient.post(`/business/demands/${demandId}/approve/${matchId}`).then((r) => r.data.data);

export const getMyMatchedDemands = (): Promise<any[]> =>
  apiClient.get('/developer/demands/my').then((r) => r.data.data);

export const getDeveloperDemandById = (id: string): Promise<any> =>
  apiClient.get(`/developer/demands/my/${id}`).then((r) => r.data.data);
