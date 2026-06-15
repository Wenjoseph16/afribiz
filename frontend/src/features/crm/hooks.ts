import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const crmKeys = {
  dashboard: ['crm-dashboard'] as const,
  clients: ['crm-clients'] as const,
  clientDetail: (id: string) => ['crm-clients', id] as const,
  tags: ['crm-tags'] as const,
  segments: ['crm-segments'] as const,
};

export function useCrmDashboardStats() {
  return useQuery({
    queryKey: crmKeys.dashboard,
    queryFn: async () => {
      const res = await apiClient.getCrmDashboardStats();
      return res.data.data;
    },
  });
}

export function useCrmClients(params?: {
  search?: string;
  tagId?: string;
  segmentId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...crmKeys.clients, params],
    queryFn: async () => {
      const res = await apiClient.getCrmClients(params);
      return res.data.data;
    },
  });
}

export function useCrmClientDetail(clientId: string) {
  return useQuery({
    queryKey: crmKeys.clientDetail(clientId),
    queryFn: async () => {
      const res = await apiClient.getCrmClientDetail(clientId);
      return res.data.data;
    },
    enabled: !!clientId,
  });
}

export function useCrmTags() {
  return useQuery({
    queryKey: crmKeys.tags,
    queryFn: async () => {
      const res = await apiClient.getCrmTags();
      return res.data.data;
    },
  });
}

export function useCrmCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const res = await apiClient.createCrmTag(name, color);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.tags }),
  });
}

export function useCrmDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string) => {
      await apiClient.deleteCrmTag(tagId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.tags }),
  });
}

export function useCrmAssignTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      await apiClient.assignCrmTag(clientId, tagId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.clients });
    },
  });
}

export function useCrmRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, tagId }: { clientId: string; tagId: string }) => {
      await apiClient.removeCrmTag(clientId, tagId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.clients });
    },
  });
}

export function useCrmSegments() {
  return useQuery({
    queryKey: crmKeys.segments,
    queryFn: async () => {
      const res = await apiClient.getCrmSegments();
      return res.data.data;
    },
  });
}

export function useCrmCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; conditions?: any; isDynamic?: boolean }) => {
      const res = await apiClient.createCrmSegment(data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.segments }),
  });
}

export function useCrmUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ segmentId, data }: { segmentId: string; data: any }) => {
      const res = await apiClient.updateCrmSegment(segmentId, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.segments }),
  });
}

export function useCrmDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (segmentId: string) => {
      await apiClient.deleteCrmSegment(segmentId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.segments }),
  });
}

export function useCrmRecalculateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (segmentId: string) => {
      const res = await apiClient.recalculateCrmSegment(segmentId);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.segments }),
  });
}

export function useCrmAssignClientToSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, segmentId }: { clientId: string; segmentId: string }) => {
      await apiClient.assignClientToSegment(clientId, segmentId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.clients });
    },
  });
}

export function useCrmRemoveClientFromSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, segmentId }: { clientId: string; segmentId: string }) => {
      await apiClient.removeClientFromSegment(clientId, segmentId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crmKeys.clients });
    },
  });
}

export function useCrmAddClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, content }: { clientId: string; content: string }) => {
      const res = await apiClient.createCrmClientNote(clientId, content);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: crmKeys.clientDetail(variables.clientId) });
    },
  });
}

export function useCrmUpdateClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const res = await apiClient.updateCrmClientNote(noteId, content);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.clients }),
  });
}

export function useCrmDeleteClientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      await apiClient.deleteCrmClientNote(noteId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmKeys.clients }),
  });
}

export function useCustomer360(clientId: string) {
  return useQuery({
    queryKey: ['customer-360', clientId],
    queryFn: async () => {
      const res = await apiClient.getCustomer360(clientId);
      return res.data.data;
    },
    enabled: !!clientId,
  });
}
