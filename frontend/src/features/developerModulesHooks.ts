import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type {
  ModulePermission, ModuleLicense, DeveloperApiKey, ModuleWebhook,
  WebhookDelivery, ModuleAnalytics, ModuleErrorLog, ModuleValidation,
  ValidationCheck, ModuleConfiguration, ModuleActivityLog,
  PermissionCheckResult, PermissionSummary, LicenseCheckResult,
  LicenseStats, ModuleAnalyticsData, DeveloperAnalyticsOverview,
  ActivityStats, ModuleSubscription,
} from '@/types/developer';

export const extendedDevKeys = {
  permissions: {
    list: (moduleId: string) => ['module-permissions', moduleId] as const,
    summary: (moduleId: string) => ['module-permissions', moduleId, 'summary'] as const,
    check: (moduleId: string, businessId: string) => ['module-permissions', moduleId, 'check', businessId] as const,
  },
  licenses: {
    list: (moduleId: string) => ['module-licenses', moduleId] as const,
    all: ['module-licenses-all'] as const,
    business: (businessId: string) => ['module-licenses-business', businessId] as const,
    stats: ['module-licenses-stats'] as const,
    check: (moduleId: string, businessId: string) => ['module-licenses-check', moduleId, businessId] as const,
  },
  apiKeys: {
    all: ['developer-api-keys'] as const,
  },
  webhooks: {
    all: ['developer-webhooks'] as const,
    deliveries: (id: string) => ['webhook-deliveries', id] as const,
  },
  analytics: {
    overview: ['developer-analytics-overview'] as const,
    detail: (moduleId: string) => ['module-analytics', moduleId] as const,
    errors: (moduleId: string) => ['module-errors', moduleId] as const,
  },
  validation: {
    detail: (moduleId: string) => ['module-validation', moduleId] as const,
    history: (moduleId: string) => ['module-validation-history', moduleId] as const,
    pending: ['validations-pending'] as const,
  },
  configuration: {
    detail: (moduleId: string, businessId: string) => ['module-config', moduleId, businessId] as const,
    list: (moduleId: string) => ['module-configs', moduleId] as const,
    business: (businessId: string) => ['module-configs-business', businessId] as const,
  },
  activity: {
    list: (moduleId: string) => ['module-activity', moduleId] as const,
    feed: ['developer-activity-feed'] as const,
    stats: (moduleId: string) => ['module-activity-stats', moduleId] as const,
    business: (businessId: string) => ['module-activity-business', businessId] as const,
  },
};

// ============================================
// PERMISSIONS HOOKS
// ============================================

export function useModulePermissions(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.permissions.list(moduleId),
    queryFn: async () => {
      const res = await apiClient.getModulePermissions(moduleId);
      return res.data.data as ModulePermission[];
    },
    enabled: !!moduleId,
  });
}

export function useAddModulePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: { resource: string; accessLevel: string; description?: string; isRequired?: boolean } }) =>
      apiClient.addModulePermission(moduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-permissions'] }),
  });
}

export function useRemoveModulePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissionId: string) => apiClient.removeModulePermission(permissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-permissions'] }),
  });
}

export function usePermissionSummary(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.permissions.summary(moduleId),
    queryFn: async () => {
      const res = await apiClient.getPermissionSummary(moduleId);
      return res.data.data as PermissionSummary;
    },
    enabled: !!moduleId,
  });
}

export function useCheckModulePermissions(moduleId: string, businessId: string) {
  return useQuery({
    queryKey: extendedDevKeys.permissions.check(moduleId, businessId),
    queryFn: async () => {
      const res = await apiClient.checkModulePermissions(moduleId, businessId);
      return res.data.data as PermissionCheckResult;
    },
    enabled: !!moduleId && !!businessId,
  });
}

// ============================================
// LICENSES HOOKS
// ============================================

export function useModuleLicenses(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.licenses.list(moduleId),
    queryFn: async () => {
      const res = await apiClient.getModuleLicenses(moduleId);
      return res.data.data as ModuleLicense[];
    },
    enabled: !!moduleId,
  });
}

export function useBusinessLicenses(businessId: string) {
  return useQuery({
    queryKey: extendedDevKeys.licenses.business(businessId),
    queryFn: async () => {
      const res = await apiClient.getBusinessLicenses(businessId);
      return res.data.data as ModuleLicense[];
    },
    enabled: !!businessId,
  });
}

export function useLicenseStats() {
  return useQuery({
    queryKey: extendedDevKeys.licenses.stats,
    queryFn: async () => {
      const res = await apiClient.getLicenseStats();
      return res.data.data as LicenseStats;
    },
  });
}

export function useCheckLicense(moduleId: string, businessId: string) {
  return useQuery({
    queryKey: extendedDevKeys.licenses.check(moduleId, businessId),
    queryFn: async () => {
      const res = await apiClient.checkLicense(moduleId, businessId);
      return res.data.data as LicenseCheckResult;
    },
    enabled: !!moduleId && !!businessId,
  });
}

export function useCreateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { moduleId: string; businessId: string; licenseType: string; price?: number; currency?: string; expiresAt?: Date; autoRenew?: boolean }) =>
      apiClient.createLicense(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-licenses'] }),
  });
}

export function useActivateLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (licenseKey: string) => apiClient.activateLicense(licenseKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-licenses'] }),
  });
}

export function useRevokeLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => apiClient.revokeLicense(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-licenses'] }),
  });
}

export function useRenewLicense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, durationDays }: { id: string; durationDays?: number }) => apiClient.renewLicense(id, durationDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-licenses'] }),
  });
}

// ============================================
// API KEYS HOOKS
// ============================================

export function useApiKeys() {
  return useQuery({
    queryKey: extendedDevKeys.apiKeys.all,
    queryFn: async () => {
      const res = await apiClient.getApiKeys();
      return res.data.data as DeveloperApiKey[];
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; scopes?: string[]; expiresAt?: Date }) => apiClient.createApiKey(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: extendedDevKeys.apiKeys.all }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: extendedDevKeys.apiKeys.all }),
  });
}

// ============================================
// WEBHOOKS HOOKS
// ============================================

export function useWebhooks() {
  return useQuery({
    queryKey: extendedDevKeys.webhooks.all,
    queryFn: async () => {
      const res = await apiClient.getWebhooks();
      return res.data.data as ModuleWebhook[];
    },
  });
}

export function useWebhookDeliveries(webhookId: string, limit?: number) {
  return useQuery({
    queryKey: extendedDevKeys.webhooks.deliveries(webhookId),
    queryFn: async () => {
      const res = await apiClient.getWebhookDeliveries(webhookId, limit);
      return res.data.data as WebhookDelivery[];
    },
    enabled: !!webhookId,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string; events: string[]; moduleId?: string }) =>
      apiClient.createWebhook(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: extendedDevKeys.webhooks.all }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWebhook(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: extendedDevKeys.webhooks.all }),
  });
}

// ============================================
// ANALYTICS HOOKS
// ============================================

export function useModuleAnalytics(moduleId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...extendedDevKeys.analytics.detail(moduleId), { startDate, endDate }],
    queryFn: async () => {
      const res = await apiClient.getModuleAnalytics(moduleId, startDate, endDate);
      return res.data.data as ModuleAnalyticsData;
    },
    enabled: !!moduleId,
  });
}

export function useDeveloperAnalyticsOverview() {
  return useQuery({
    queryKey: extendedDevKeys.analytics.overview,
    queryFn: async () => {
      const res = await apiClient.getDeveloperAnalyticsOverview();
      return res.data.data as DeveloperAnalyticsOverview;
    },
  });
}

export function useTrackAnalytics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) =>
      apiClient.trackAnalytics(moduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-analytics'] }),
  });
}

export function useModuleErrors(moduleId: string, resolved?: boolean, limit?: number) {
  return useQuery({
    queryKey: [...extendedDevKeys.analytics.errors(moduleId), { resolved, limit }],
    queryFn: async () => {
      const res = await apiClient.getModuleErrors(moduleId, resolved, limit);
      return res.data.data as ModuleErrorLog[];
    },
    enabled: !!moduleId,
  });
}

export function useLogModuleError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: any }) =>
      apiClient.logModuleError(moduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-errors'] }),
  });
}

export function useResolveModuleError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (errorId: string) => apiClient.resolveModuleError(errorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-errors'] }),
  });
}

// ============================================
// VALIDATION HOOKS
// ============================================

export function useModuleValidation(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.validation.detail(moduleId),
    queryFn: async () => {
      const res = await apiClient.getModuleValidation(moduleId);
      return res.data.data as ModuleValidation;
    },
    enabled: !!moduleId,
  });
}

export function useValidationHistory(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.validation.history(moduleId),
    queryFn: async () => {
      const res = await apiClient.getValidationHistory(moduleId);
      return res.data.data as ModuleValidation[];
    },
    enabled: !!moduleId,
  });
}

export function usePendingValidations() {
  return useQuery({
    queryKey: extendedDevKeys.validation.pending,
    queryFn: async () => {
      const res = await apiClient.getPendingValidations();
      return res.data.data as ModuleValidation[];
    },
  });
}

export function useSubmitForValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) => apiClient.submitModuleForValidation(moduleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-validation'] }),
  });
}

export function useApproveValidationCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, score, details }: { checkId: string; score: number; details?: string }) =>
      apiClient.approveValidationCheck(checkId, score, details),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-validation'] }),
  });
}

export function useRejectValidationCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, details }: { checkId: string; details: string }) =>
      apiClient.rejectValidationCheck(checkId, details),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-validation'] }),
  });
}

export function useCompleteValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ validationId, status, notes }: { validationId: string; status: string; notes?: string }) =>
      apiClient.completeValidation(validationId, status, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-validation'] }),
  });
}

// ============================================
// CONFIGURATION HOOKS
// ============================================

export function useModuleConfiguration(moduleId: string, businessId: string) {
  return useQuery({
    queryKey: extendedDevKeys.configuration.detail(moduleId, businessId),
    queryFn: async () => {
      const res = await apiClient.getModuleConfiguration(moduleId, businessId);
      return res.data.data as ModuleConfiguration;
    },
    enabled: !!moduleId && !!businessId,
  });
}

export function useSaveModuleConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: { businessId: string; installationId: string; settings: any } }) =>
      apiClient.saveModuleConfiguration(moduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-config'] }),
  });
}

export function useToggleModuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, businessId, isActive }: { moduleId: string; businessId: string; isActive: boolean }) =>
      apiClient.toggleModuleActive(moduleId, businessId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-config'] }),
  });
}

export function useModuleConfigurations(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.configuration.list(moduleId),
    queryFn: async () => {
      const res = await apiClient.getModuleConfigurations(moduleId);
      return res.data.data as ModuleConfiguration[];
    },
    enabled: !!moduleId,
  });
}

export function useBusinessModules(businessId: string) {
  return useQuery({
    queryKey: extendedDevKeys.configuration.business(businessId),
    queryFn: async () => {
      const res = await apiClient.getBusinessModules(businessId);
      return res.data.data as ModuleConfiguration[];
    },
    enabled: !!businessId,
  });
}

// ============================================
// ACTIVITY LOG HOOKS
// ============================================

export function useModuleActivity(moduleId: string, limit?: number) {
  return useQuery({
    queryKey: [...extendedDevKeys.activity.list(moduleId), { limit }],
    queryFn: async () => {
      const res = await apiClient.getModuleActivity(moduleId, limit);
      return res.data.data as ModuleActivityLog[];
    },
    enabled: !!moduleId,
  });
}

export function useDeveloperActivityFeed(limit?: number) {
  return useQuery({
    queryKey: [...extendedDevKeys.activity.feed, { limit }],
    queryFn: async () => {
      const res = await apiClient.getDeveloperActivityFeed(limit);
      return res.data.data as ModuleActivityLog[];
    },
  });
}

export function useBusinessActivityFeed(businessId: string, limit?: number) {
  return useQuery({
    queryKey: [...extendedDevKeys.activity.business(businessId), { limit }],
    queryFn: async () => {
      const res = await apiClient.getBusinessActivityFeed(businessId, limit);
      return res.data.data as ModuleActivityLog[];
    },
    enabled: !!businessId,
  });
}

export function useLogActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: { activityType: string; businessId?: string; installationId?: string; description?: string; metadata?: any } }) =>
      apiClient.logActivity(moduleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-activity'] }),
  });
}

export function useActivityStats(moduleId: string) {
  return useQuery({
    queryKey: extendedDevKeys.activity.stats(moduleId),
    queryFn: async () => {
      const res = await apiClient.getActivityStats(moduleId);
      return res.data.data as ActivityStats;
    },
    enabled: !!moduleId,
  });
}
