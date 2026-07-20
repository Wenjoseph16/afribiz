import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

export const developerKeys = {
  profile: ['developer-profile'] as const,
  dashboard: ['developer-dashboard'] as const,
  modules: {
    all: ['developer-modules'] as const,
    detail: (id: string) => ['developer-modules', id] as const,
    versions: (id: string) => ['developer-modules', id, 'versions'] as const,
    reviews: (id: string) => ['developer-modules', id, 'reviews'] as const,
  },
  marketplace: {
    all: ['marketplace-modules'] as const,
    detail: (slug: string) => ['marketplace-modules', slug] as const,
  },
  tickets: {
    all: ['developer-tickets'] as const,
    detail: (id: string) => ['developer-tickets', id] as const,
  },
  revenues: {
    all: ['developer-revenues'] as const,
    summary: ['developer-revenues', 'summary'] as const,
  },
  payouts: ['developer-payouts'] as const,
};

export function useDeveloperActivation() {
  const qc = useQueryClient();
  const { setTokens, setUser } = useAuthStore();
  return useMutation({
    mutationFn: () => apiClient.activateDeveloperRole(),
    onSuccess: (response) => {
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      }
      qc.invalidateQueries({ queryKey: developerKeys.profile });
    },
  });
}

export function useDeveloperProfile() {
  return useQuery({
    queryKey: developerKeys.profile,
    queryFn: async () => {
      const res = await apiClient.getDeveloperProfile();
      return res.data.data;
    },
    retry: false,
  });
}

export function useUpdateDeveloperProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.updateDeveloperProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.profile });
    },
  });
}

export function useSubmitDeveloperVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.submitDeveloperVerification(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.profile });
    },
  });
}

export function useDeveloperDashboard() {
  return useQuery({
    queryKey: developerKeys.dashboard,
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperDashboard();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement dashboard developpeur:', error);
        return null;
      }
    },
    retry: false,
  });
}

export function useDeveloperModules(status?: string) {
  return useQuery({
    queryKey: [...developerKeys.modules.all, status],
    queryFn: async () => {
      try {
        const params = status ? { status } : undefined;
        const res = await apiClient.getDeveloperModules(params);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement modules developpeur:', error);
        return null;
      }
    },
    retry: false,
  });
}

export function useDeveloperModule(id: string) {
  return useQuery({
    queryKey: developerKeys.modules.detail(id),
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperModule(id);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement module developpeur:', error);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateDeveloperModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDeveloperModule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function useUpdateDeveloperModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateDeveloperModule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function useUploadModuleImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, formData }: { moduleId: string; formData: FormData }) =>
      apiClient.uploadModuleImage(moduleId, formData),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.detail(variables.moduleId) });
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function usePublishDeveloperModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.publishDeveloperModule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function useGetModuleVersions(moduleId: string) {
  return useQuery({
    queryKey: developerKeys.modules.versions(moduleId),
    queryFn: async () => {
      try {
        const res = await apiClient.getModuleVersions(moduleId);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement versions module:', error);
        return [];
      }
    },
    enabled: !!moduleId,
    retry: false,
  });
}

export function useCreateModuleVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) =>
      apiClient.createModuleVersion(moduleId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
      qc.invalidateQueries({ queryKey: developerKeys.modules.versions(variables.moduleId) });
    },
  });
}

export function useUploadModuleVersionFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      versionId,
      file,
    }: {
      moduleId: string;
      versionId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.uploadModuleVersionFile(moduleId, versionId, formData);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.versions(variables.moduleId) });
    },
  });
}

export function useMarketplaceModules(params?: {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: [...developerKeys.marketplace.all, params],
    queryFn: async () => {
      try {
        const res = await apiClient.getMarketplaceModules(params);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement marketplace modules:', error);
        return null;
      }
    },
    retry: false,
  });
}

export function useMarketplaceModule(slug: string) {
  return useQuery({
    queryKey: developerKeys.marketplace.detail(slug),
    queryFn: async () => {
      try {
        const res = await apiClient.getMarketplaceModule(slug);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement module marketplace:', error);
        return null;
      }
    },
    enabled: !!slug,
    retry: false,
  });
}

export function usePurchaseMarketplaceModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      moduleId,
      data,
    }: {
      moduleId: string;
      data: { provider: string; phone: string };
    }) => apiClient.purchaseMarketplaceModule(moduleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
      qc.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });
}

export function useStartMarketplaceModuleTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => apiClient.startMarketplaceModuleTrial(moduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
      qc.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });
}

export function useBusinessInstalledModules() {
  return useQuery({
    queryKey: ['business-installed-modules'],
    queryFn: async () => {
      try {
        const res = await apiClient.getBusinessInstalledModules();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement modules installes:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useConfirmModuleUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (installationId: string) => apiClient.confirmModuleUpdate(installationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-modules', 'installed'] });
    },
  });
}

export function useReinstallModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => apiClient.reinstallModule(moduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-modules', 'installed'] });
    },
  });
}

export function useConfirmMarketplaceModulePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { providerRef: string }) => apiClient.confirmMarketplaceModulePayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
      qc.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });
}

export function useInstallMarketplaceModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => apiClient.installMarketplaceModule(moduleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
      qc.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });
}

export function useModuleReviews(moduleId: string) {
  return useQuery({
    queryKey: developerKeys.modules.reviews(moduleId),
    queryFn: async () => {
      try {
        const res = await apiClient.getModuleReviews(moduleId);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement avis module:', error);
        return [];
      }
    },
    enabled: !!moduleId,
    retry: false,
  });
}

export function useCreateModuleReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) =>
      apiClient.createModuleReview(moduleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function useRespondToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      apiClient.respondToReview(reviewId, response),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.modules.all });
    },
  });
}

export function useDeveloperTickets() {
  return useQuery({
    queryKey: developerKeys.tickets.all,
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperTickets();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement tickets:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useDeveloperTicket(id: string) {
  return useQuery({
    queryKey: developerKeys.tickets.detail(id),
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperTicket(id);
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement ticket:', error);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateDeveloperTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDeveloperTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.tickets.all });
    },
  });
}

export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string; content: string }) =>
      apiClient.replyToTicket(ticketId, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.tickets.all });
    },
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      apiClient.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.tickets.all });
    },
  });
}

export function useDeveloperInstallations(status?: string) {
  return useQuery({
    queryKey: ['developer-installations', status],
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperInstallations();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement installations:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useDeveloperOrders(params?: { type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['developer-orders', params],
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperOrders();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement commandes dev:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useDeveloperSubscriptions() {
  return useQuery({
    queryKey: ['developer-subscriptions'],
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperSubscriptions();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement abonnements dev:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useDeveloperRevenues() {
  return useQuery({
    queryKey: developerKeys.revenues.all,
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperRevenues();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement revenus:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useDeveloperRevenueSummary() {
  return useQuery({
    queryKey: developerKeys.revenues.summary,
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperRevenueSummary();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement resume revenus:', error);
        return null;
      }
    },
    retry: false,
  });
}

export function useDeveloperPayouts() {
  return useQuery({
    queryKey: developerKeys.payouts,
    queryFn: async () => {
      try {
        const res = await apiClient.getDeveloperPayouts();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement retraits:', error);
        return [];
      }
    },
    retry: false,
  });
}

export function useRequestDeveloperPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.requestDeveloperPayout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: developerKeys.payouts });
      qc.invalidateQueries({ queryKey: developerKeys.revenues.all });
    },
  });
}
