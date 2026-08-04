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
      try {
        const res = await apiClient.getMyScore();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement score:', error);
        return null;
      }
    },
    retry: false,
  });
}

export function useScoreHistory(days?: number) {
  return useQuery({
    queryKey: afriScoreKeys.history(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getScoreHistory(days);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement historique score:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: afriScoreKeys.badges,
    queryFn: async () => {
      try {
        const res = await apiClient.getMyBadges();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement badges:', error);
        return [];
      }
    },
    retry: false,
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
      try {
        const res = await apiClient.getPublicScore(businessId);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement score public:', error);
        return null;
      }
    },
    enabled: !!businessId,
    retry: false,
  });
}

export function useHubPlatformStats() {
  return useQuery({
    queryKey: hubKeys.platformStats,
    queryFn: async () => {
      try {
        const res = await apiClient.getHubPlatformStats();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement stats plateforme:', error);
        return { totalBusinesses: 0, totalOrders: 0, totalRevenue: 0, avgScore: 0 };
      }
    },
    retry: false,
  });
}

export function useHubSectorBenchmarks() {
  return useQuery({
    queryKey: hubKeys.sectorBenchmarks,
    queryFn: async () => {
      try {
        const res = await apiClient.getHubSectorBenchmarks();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement benchmarks secteurs:', error);
        return { sectors: [] };
      }
    },
    retry: false,
  });
}

export function useHubSectorStats(sector: string) {
  return useQuery({
    queryKey: hubKeys.sectorStats(sector),
    queryFn: async () => {
      try {
        const res = await apiClient.getHubSectorStats(sector);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement stats secteur:', error);
        return null;
      }
    },
    enabled: !!sector,
    retry: false,
  });
}

export function useHubGeographicStats() {
  return useQuery({
    queryKey: hubKeys.geoStats,
    queryFn: async () => {
      try {
        const res = await apiClient.getHubGeographicStats();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement stats geographiques:', error);
        return { regions: [] };
      }
    },
    retry: false,
  });
}

export function useHubGrowthStats() {
  return useQuery({
    queryKey: hubKeys.growthStats,
    queryFn: async () => {
      try {
        const res = await apiClient.getHubGrowthStats();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement croissance:', error);
        return { newBusinesses: 0, transactionGrowth: 0, adoptionRate: 0 };
      }
    },
    retry: false,
  });
}

export function useHubPaymentTrends() {
  return useQuery({
    queryKey: hubKeys.paymentTrends,
    queryFn: async () => {
      try {
        const res = await apiClient.getHubPaymentTrends();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement tendances paiements:', error);
        return { totalPayments: 0, successRate: 0, avgAmount: 0, pendingAmount: 0 };
      }
    },
    retry: false,
  });
}

export function usePartnerReports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: hubKeys.partnerReports(params),
    queryFn: async () => {
      try {
        const res = await apiClient.getPartnerReports(params);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement rapports:', error);
        return { reports: [] };
      }
    },
    retry: false,
  });
}

export function usePartnerReportDetail(id: string) {
  return useQuery({
    queryKey: hubKeys.partnerReport(id),
    queryFn: async () => {
      try {
        const res = await apiClient.getPartnerReportDetail(id);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement rapport:', error);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
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

export function usePartnerBusinesses(params?: {
  q?: string;
  sector?: string;
  country?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: hubKeys.partnerBusinesses(params),
    queryFn: async () => {
      try {
        const res = await apiClient.searchPartnerBusinesses(params?.q || '');
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement businesses:', error);
        return { businesses: [] };
      }
    },
    retry: false,
  });
}

export function usePartnerBusinessDetails(businessId: string) {
  return useQuery({
    queryKey: hubKeys.partnerBusiness(businessId),
    queryFn: async () => {
      try {
        const res = await apiClient.getPartnerBusinessDetails(businessId);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement details business:', error);
        return null;
      }
    },
    enabled: !!businessId,
    retry: false,
  });
}

export function useMyConsents() {
  return useQuery({
    queryKey: consentKeys.all,
    queryFn: async () => {
      try {
        const res = await apiClient.getMyConsents();
        const data = res.data.data;
        return { consents: data ? [data] : [] };
      } catch (error) {
        console.warn('Erreur chargement consentements:', error);
        return { consents: [] };
      }
    },
    retry: false,
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
      try {
        const res = await apiClient.adminGetPartners(params);
        const data = res.data.data;
        return Array.isArray(data) ? { partners: data, total: data.length, totalPages: 1 } : data;
      } catch (error) {
        console.warn('Erreur chargement partenaires:', error);
        return { partners: [], total: 0, totalPages: 1 };
      }
    },
    retry: false,
  });
}

export function useAdminGetPartnerDetail(id: string) {
  return useQuery({
    queryKey: adminHubKeys.partner(id),
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetPartnerDetail(id);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement partenaire:', error);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
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
      try {
        const res = await apiClient.adminGetDataAccessLogs(params);
        const data = res.data.data;
        return data?.data
          ? { logs: data.data, total: data.total, totalPages: data.totalPages }
          : data;
      } catch (error) {
        console.warn('Erreur chargement logs:', error);
        return { logs: [], total: 0, totalPages: 1 };
      }
    },
    retry: false,
  });
}

export function useAdminGetReports(params?: { page?: number; limit?: number; type?: string }) {
  return useQuery({
    queryKey: adminHubKeys.reports(params),
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetReports(params);
        const data = res.data.data;
        return data?.data
          ? { reports: data.data, total: data.total, totalPages: data.totalPages }
          : data;
      } catch (error) {
        console.warn('Erreur chargement rapports admin:', error);
        return { reports: [], total: 0, totalPages: 1 };
      }
    },
    retry: false,
  });
}

export function useAdminGetPlatformAnalytics() {
  return useQuery({
    queryKey: adminHubKeys.analytics,
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetPlatformAnalytics();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement analytics plateforme:', error);
        return {
          totalBusinesses: 0,
          totalPartners: 0,
          totalReports: 0,
          totalAccessLogs: 0,
          activeConsents: 0,
          avgScore: 0,
        };
      }
    },
    retry: false,
  });
}

// ── Analytics Hooks ──

export function useSearchTrends(days?: number) {
  return useQuery({
    queryKey: analyticsKeys.searchTrends(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getSearchTrends({ days });
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement tendances recherche:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: analyticsKeys.conversionFunnel,
    queryFn: async () => {
      try {
        const res = await apiClient.getConversionFunnel();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement entonnoir conversion:', error);
        return { stages: [], conversionRates: {}, totalVisitors: 0 };
      }
    },
    retry: false,
  });
}

export function useRetentionCohorts() {
  return useQuery({
    queryKey: analyticsKeys.retentionCohorts,
    queryFn: async () => {
      try {
        const res = await apiClient.getRetentionCohorts();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement cohorts:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useProductRecommendations(limit?: number) {
  return useQuery({
    queryKey: analyticsKeys.productRecommendations(limit),
    queryFn: async () => {
      try {
        const res = await apiClient.getProductRecommendations({ limit });
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement recommandations:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useEngagementAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.engagement,
    queryFn: async () => {
      try {
        const res = await apiClient.get('/analytics/engagement');
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement engagement:', error);
        return {
          totalClients: 0,
          activeClients: 0,
          engagementRate: 0,
          pageViews30d: 0,
          conversations30d: 0,
        };
      }
    },
    retry: false,
  });
}

// ── Copilot Hooks ──

export function useDailyTips() {
  return useQuery({
    queryKey: copilotKeys.dailyTips,
    queryFn: async () => {
      try {
        const res = await apiClient.getDailyTips();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement conseils:', error);
        return { tips: [], totalUnresolvedIssues: 0 };
      }
    },
    retry: false,
  });
}

export function useBusinessHealth() {
  return useQuery({
    queryKey: copilotKeys.businessHealth,
    queryFn: async () => {
      try {
        const res = await apiClient.getBusinessHealth();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement sante business:', error);
        return {
          healthScore: 0,
          status: 'fair',
          metrics: {
            afriScore: 0,
            orders30d: 0,
            pageViews30d: 0,
            totalProducts: 0,
            activeAdCampaigns: 0,
          },
        };
      }
    },
    retry: false,
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

// ── Présence temps réel (compteur utilisateurs connectés — WF Auth) ──

export const adminPresenceKeys = {
  presence: ['admin', 'presence'] as const,
};

export function useAdminPresence(refetchInterval?: number) {
  return useQuery({
    queryKey: adminPresenceKeys.presence,
    queryFn: async () => {
      try {
        const res = await apiClient.getAdminPresence();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement présence:', error);
        return { count: 0, byRole: {}, users: [] };
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}

// ── AnalyticsEvent Hooks (chantier 1 — flux temps réel) ──

export const analyticsEventKeys = {
  events: (params?: any) => ['analytics-events', 'feed', params] as const,
  summary: (days?: number) => ['analytics-events', 'summary', days] as const,
  breakdownType: (days?: number) => ['analytics-events', 'breakdown', 'type', days] as const,
  breakdownCategory: (days?: number) =>
    ['analytics-events', 'breakdown', 'category', days] as const,
  counters: (days?: number) => ['analytics-events', 'counters', days] as const,
};

export function useAnalyticsEvents(params?: any, refetchInterval?: number) {
  return useQuery({
    queryKey: analyticsEventKeys.events(params),
    queryFn: async () => {
      try {
        const res = await apiClient.getAnalyticsEvents(params);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement flux événements:', error);
        return { events: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}

export function useAnalyticsEventsSummary(days = 30, refetchInterval?: number) {
  return useQuery({
    queryKey: analyticsEventKeys.summary(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getAnalyticsEventsSummary({ days });
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement résumé événements:', error);
        return { total: 0, today: 0, byType: [], byCategory: [], days };
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}

export function useAnalyticsBreakdownByType(days = 30, refetchInterval?: number) {
  return useQuery({
    queryKey: analyticsEventKeys.breakdownType(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getAnalyticsEventsBreakdownType({ days });
        return res.data.data?.breakdown ?? [];
      } catch (error) {
        console.warn('Erreur chargement répartition par type:', error);
        return [];
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}

export function useAnalyticsBreakdownByCategory(days = 30, refetchInterval?: number) {
  return useQuery({
    queryKey: analyticsEventKeys.breakdownCategory(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getAnalyticsEventsBreakdownCategory({ days });
        return res.data.data?.breakdown ?? [];
      } catch (error) {
        console.warn('Erreur chargement répartition par catégorie:', error);
        return [];
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}

export function useAnalyticsEventsCounters(days = 30, refetchInterval?: number) {
  return useQuery({
    queryKey: analyticsEventKeys.counters(days),
    queryFn: async () => {
      try {
        const res = await apiClient.getAnalyticsEventsCounters({ days });
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement compteurs événements:', error);
        return { period: days, totals: {}, revenue: 0, eventCount: 0 };
      }
    },
    retry: false,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}
