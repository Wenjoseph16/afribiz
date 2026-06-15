import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export function useSimulationEnvironments() {
  return useQuery({
    queryKey: ['simulation-environments'],
    queryFn: async () => {
      const res = await apiClient.getSimulationEnvironments();
      return res.data.data?.environments || [];
    },
  });
}

export function useTestEndpoint() {
  return useMutation({
    mutationFn: ({ moduleSlug, data }: { moduleSlug: string; data: { endpoint: string; method: string; body?: any } }) =>
      apiClient.testSimulationEndpoint(moduleSlug, data),
  });
}

export function useSimulationEndpoints() {
  return useQuery({
    queryKey: ['simulation-endpoints'],
    queryFn: async () => {
      const res = await apiClient.getSimulationEndpoints();
      return res.data.data?.endpoints || [];
    },
  });
}

export function useSimulationMockData(moduleSlug: string, dataType: string) {
  return useQuery({
    queryKey: ['simulation-mock', moduleSlug, dataType],
    queryFn: async () => {
      const res = await apiClient.getSimulationMockData(moduleSlug, dataType);
      return res.data.data?.data || [];
    },
    enabled: !!moduleSlug && !!dataType,
  });
}
