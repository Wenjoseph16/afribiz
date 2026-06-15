import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// Keys
export const adsKeys = {
  all: ['ads'] as const,
  myCampaigns: ['ads', 'my-campaigns'] as const,
  campaign: (id: string) => ['ads', id] as const,
  campaignStats: (id: string) => ['ads', id, 'stats'] as const,
  active: (params?: any) => ['ads', 'active', params] as const,
  admin: {
    campaigns: (params?: any) => ['ads', 'admin', 'campaigns', params] as const,
    stats: ['ads', 'admin', 'stats'] as const,
    revenue: ['ads', 'admin', 'revenue'] as const,
    packages: ['ads', 'admin', 'packages'] as const,
  },
};

// Advertiser hooks
export function useCreateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createAdCampaign(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adsKeys.myCampaigns }); },
  });
}

export function useMyAdCampaigns() {
  return useQuery({
    queryKey: adsKeys.myCampaigns,
    queryFn: async () => { const res = await apiClient.getMyAdCampaigns(); return res.data.data; },
  });
}

export function useAdCampaign(id: string) {
  return useQuery({
    queryKey: adsKeys.campaign(id),
    queryFn: async () => { const res = await apiClient.getAdCampaignById(id); return res.data.data; },
    enabled: !!id,
  });
}

export function useAdCampaignStats(id: string) {
  return useQuery({
    queryKey: adsKeys.campaignStats(id),
    queryFn: async () => { const res = await apiClient.getAdCampaignStats(id); return res.data.data; },
    enabled: !!id,
  });
}

export function useActiveAds(params?: { page?: string; position?: string }) {
  return useQuery({
    queryKey: adsKeys.active(params),
    queryFn: async () => { const res = await apiClient.getActiveAds(params); return res.data.data; },
  });
}

// Admin hooks
export function useAdminAdCampaigns(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: adsKeys.admin.campaigns(params),
    queryFn: async () => { const res = await apiClient.adminGetAllAdCampaigns(params); return res.data; },
  });
}

export function useAdminValidateAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminValidateAdCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads', 'admin'] }); },
  });
}

export function useAdminRejectAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.adminRejectAdCampaign(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads', 'admin'] }); },
  });
}

export function useAdminSuspendAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.adminSuspendAdCampaign(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads', 'admin'] }); },
  });
}

export function useAdminAdRevenue() {
  return useQuery({
    queryKey: adsKeys.admin.revenue,
    queryFn: async () => { const res = await apiClient.adminGetAdRevenue(); return res.data.data; },
  });
}

export function useAdminAdPackages() {
  return useQuery({
    queryKey: adsKeys.admin.packages,
    queryFn: async () => { const res = await apiClient.adminGetAdPackages(); return res.data.data; },
  });
}

export function useAdminCreateAdPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.adminCreateAdPackage(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adsKeys.admin.packages }); },
  });
}

export function useAdminAdStats() {
  return useQuery({
    queryKey: adsKeys.admin.stats,
    queryFn: async () => { const res = await apiClient.adminGetAdStats(); return res.data.data; },
  });
}

// Campaign owner actions
export function usePauseAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.pauseAdCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adsKeys.myCampaigns }); },
  });
}

export function useResumeAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.resumeAdCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adsKeys.myCampaigns }); },
  });
}

export function useDeleteAdCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAdCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: adsKeys.myCampaigns }); },
  });
}
