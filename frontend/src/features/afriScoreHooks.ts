'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const afriScoreKeys = {
  myScore: ['afriscore', 'me'] as const,
  history: (days?: number) => ['afriscore', 'history', days] as const,
  badges: ['afriscore', 'badges'] as const,
  publicScore: (id: string) => ['afriscore', 'public', id] as const,
};

export const hubKeys = {
  platformStats: ['datahub', 'platform', 'stats'] as const,
  sectorBenchmarks: ['datahub', 'platform', 'sectors'] as const,
  sectorStats: (sector: string) => ['datahub', 'platform', 'sectors', sector] as const,
  geoStats: ['datahub', 'platform', 'geographic'] as const,
  growthStats: ['datahub', 'platform', 'growth'] as const,
  paymentTrends: ['datahub', 'platform', 'payments'] as const,
  partnerReports: (params?: any) => ['datahub', 'partner', 'reports', params] as const,
  partnerReport: (id: string) => ['datahub', 'partner', 'reports', id] as const,
  partnerBusinesses: (params?: any) => ['datahub', 'partner', 'businesses', params] as const,
  partnerBusiness: (id: string) => ['datahub', 'partner', 'business', id] as const,
};

export const consentKeys = {
  all: ['consents', 'me'] as const,
};

export const adminHubKeys = {
  partners: (params?: any) => ['admin', 'datahub', 'partners', params] as const,
  partner: (id: string) => ['admin', 'datahub', 'partners', id] as const,
  logs: (params?: any) => ['admin', 'datahub', 'logs', params] as const,
  reports: (params?: any) => ['admin', 'datahub', 'reports', params] as const,
  analytics: ['admin', 'datahub', 'analytics'] as const,
};

export const analyticsKeys = {
  searchTrends: (days?: number) => ['analytics', 'search-trends', days] as const,
  conversionFunnel: ['analytics', 'conversion-funnel'] as const,
  retentionCohorts: ['analytics', 'retention-cohorts'] as const,
  productRecommendations: (limit?: number) => ['analytics', 'recommendations', limit] as const,
  engagement: ['analytics', 'engagement'] as const,
};

export const copilotKeys = {
  dailyTips: ['copilot', 'daily-tips'] as const,
  businessHealth: ['copilot', 'business-health'] as const,
};

export function useMyScore() {
  return useQuery({
    queryKey: afriScoreKeys.myScore,
    queryFn: async () => {
      const res = await apiClient.getMyScore();
      return res.data.data;
    },
  });
}

export function useScoreHistory(days?: number) {
  return useQuery({
    queryKey: afriScoreKeys.history(days),
    queryFn: async () => {
      const res = await apiClient.get('/afriscore/mine/history', { params: { days } });
      return res.data.data;
    },
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: afriScoreKeys.badges,
    queryFn: async () => {
      const res = await apiClient.getMyBadges();
      return res.data.data;
    },
  });
}

export function useRecomputeScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.recomputeMyScore(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: afriScoreKeys.myScore });
      qc.invalidateQueries({ queryKey: afriScoreKeys.history() });
      qc.invalidateQueries({ queryKey: afriScoreKeys.badges });
    },
  });
}

export function usePublicScore(businessId: string) {
  return useQuery({
    queryKey: afriScoreKeys.publicScore(businessId),
    queryFn: async () => {
      const res = await apiClient.getPublicScore(businessId);
      return res.data.data;
    },
    enabled: !!businessId,
  });
}

export function useHubPlatformStats() {
  return useQuery({
    queryKey: hubKeys.platformStats,
    queryFn: async () => {
      const res = await apiClient.getHubPlatformStats();
      return res.data.data;
    },
  });
}

export function useHubSectorBenchmarks() {
  return useQuery({
    queryKey: hubKeys.sectorBenchmarks,
    queryFn: async () => {
      const res = await apiClient.getHubSectorBenchmarks();
      return res.data.data;
    },
  });
}

export function useHubSectorStats(sector: string) {
  return useQuery({
    queryKey: hubKeys.sectorStats(sector),
    queryFn: async () => {
      const res = await apiClient.getHubSectorStats(sector);
      return res.data.data;
    },
    enabled: !!sector,
  });
}

export function useHubGeographicStats() {
  return useQuery({
    queryKey: hubKeys.geoStats,
    queryFn: async () => {
      const res = await apiClient.getHubGeographicStats();
      return res.data.data;
    },
  });
}

export function useHubGrowthStats() {
  return useQuery({
    queryKey: hubKeys.growthStats,
    queryFn: async () => {
      const res = await apiClient.getHubGrowthStats();
      return res.data.data;
    },
  });
}

export function useHubPaymentTrends() {
  return useQuery({
    queryKey: hubKeys.paymentTrends,
    queryFn: async () => {
      const res = await apiClient.getHubPaymentTrends();
      return res.data.data;
    },
  });
}

export function usePartnerReports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: hubKeys.partnerReports(params),
    queryFn: async () => {
      const res = await apiClient.getPartnerReports(params);
      return res.data.data;
    },
  });
}

export function usePartnerReportDetail(id: string) {
  return useQuery({
    queryKey: hubKeys.partnerReport(id),
    queryFn: async () => {
      const res = await apiClient.getPartnerReportDetail(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useOrderPartnerReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; businessId?: string; sector?: string; country?: string }) =>
      apiClient.orderPartnerReport(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hubKeys.partnerReports() });
    },
  });
}

export function usePartnerBusinesses(params?: { q?: string; sector?: string; country?: string; city?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: hubKeys.partnerBusinesses(params),
    queryFn: async () => {
      const res = await apiClient.get('/admin/partners/search', { params });
      return res.data.data;
    },
  });
}

export function usePartnerBusinessDetails(businessId: string) {
  return useQuery({
    queryKey: hubKeys.partnerBusiness(businessId),
    queryFn: async () => {
      const res = await apiClient.getPartnerBusinessDetails(businessId);
      return res.data.data;
    },
    enabled: !!businessId,
  });
}

export function useMyConsents() {
  return useQuery({
    queryKey: consentKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyConsents();
      const data = res.data.data;
      return { consents: data ? [data] : [] };
    },
  });
}

export function useUpdateConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { level: string; partnerTypes: string[] } }) =>
      apiClient.updateConsent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: consentKeys.all }),
  });
}

export function useRevokeConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.revokeConsent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: consentKeys.all }),
  });
}

export function useCreateConsent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { category: string; level: string; partnerTypes: string[] }) =>
      apiClient.createConsent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: consentKeys.all }),
  });
}

export function useAdminGetPartners(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: adminHubKeys.partners(params),
    queryFn: async () => {
      const res = await apiClient.adminGetPartners(params);
      return res.data.data;
    },
  });
}

export function useAdminGetPartnerDetail(id: string) {
  return useQuery({
    queryKey: adminHubKeys.partner(id),
    queryFn: async () => {
      const res = await apiClient.adminGetPartnerDetail(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useAdminApprovePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminApprovePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminHubKeys.partners() });
    },
  });
}

export function useAdminSuspendPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminSuspendPartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminHubKeys.partners() });
    },
  });
}

export function useAdminRevokePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.adminRevokePartner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminHubKeys.partners() });
    },
  });
}

export function useAdminGetDataAccessLogs(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: adminHubKeys.logs(params),
    queryFn: async () => {
      const res = await apiClient.adminGetDataAccessLogs(params);
      return res.data.data;
    },
  });
}

export function useAdminGetReports(params?: { page?: number; limit?: number; type?: string }) {
  return useQuery({
    queryKey: adminHubKeys.reports(params),
    queryFn: async () => {
      const res = await apiClient.adminGetReports(params);
      return res.data.data;
    },
  });
}

export function useAdminGetPlatformAnalytics() {
  return useQuery({
    queryKey: adminHubKeys.analytics,
    queryFn: async () => {
      const res = await apiClient.adminGetPlatformAnalytics();
      return res.data.data;
    },
  });
}

// ── Analytics Hooks ──

export function useSearchTrends(days?: number) {
  return useQuery({
    queryKey: analyticsKeys.searchTrends(days),
    queryFn: async () => {
      const res = await apiClient.get('/analytics/search-trends', { params: { days } });
      return res.data.data;
    },
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: analyticsKeys.conversionFunnel,
    queryFn: async () => {
      const res = await apiClient.get('/analytics/conversion-funnel');
      return res.data.data;
    },
  });
}

export function useRetentionCohorts() {
  return useQuery({
    queryKey: analyticsKeys.retentionCohorts,
    queryFn: async () => {
      const res = await apiClient.get('/analytics/retention-cohorts');
      return res.data.data;
    },
  });
}

export function useProductRecommendations(limit?: number) {
  return useQuery({
    queryKey: analyticsKeys.productRecommendations(limit),
    queryFn: async () => {
      const res = await apiClient.get('/analytics/product-recommendations', { params: { limit } });
      return res.data.data;
    },
  });
}

export function useEngagementAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.engagement,
    queryFn: async () => {
      const res = await apiClient.get('/analytics/engagement');
      return res.data.data;
    },
  });
}

// ── Copilot Hooks ──

export function useDailyTips() {
  return useQuery({
    queryKey: copilotKeys.dailyTips,
    queryFn: async () => {
      const res = await apiClient.get('/copilot/daily-tips');
      return res.data.data;
    },
  });
}

export function useBusinessHealth() {
  return useQuery({
    queryKey: copilotKeys.businessHealth,
    queryFn: async () => {
      const res = await apiClient.get('/copilot/business-health');
      return res.data.data;
    },
  });
}

export function useAdminRecomputeAllScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.adminRecomputeAllScores(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: afriScoreKeys.myScore });
    },
  });
}
