import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const storyKeys = {
  all: ['stories'] as const,
  active: ['stories', 'active'] as const,
  business: (id: string) => ['stories', 'business', id] as const,
  feed: (params?: any) => ['feed', params] as const,
};

export interface StoryGroup {
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    type: string;
  };
  stories: any[];
  allViewed: boolean;
}

export function useActiveStories() {
  return useQuery({
    queryKey: storyKeys.active,
    queryFn: async () => {
      const res = await apiClient.get('/stories');
      return (res.data.data || []) as StoryGroup[];
    },
    refetchInterval: 30000,
  });
}

export function useBusinessStories(businessId: string) {
  return useQuery({
    queryKey: storyKeys.business(businessId),
    queryFn: async () => {
      const res = await apiClient.get('/stories/business/' + businessId);
      return res.data.data || [];
    },
    enabled: !!businessId,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/stories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
    },
  });
}

export function useViewStory() {
  return useMutation({
    mutationFn: (storyId: string) => apiClient.post('/stories/' + storyId + '/view'),
  });
}

export function useClickStory() {
  return useMutation({
    mutationFn: (storyId: string) => apiClient.post('/stories/' + storyId + '/click'),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/stories/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.active }),
  });
}

export function useFeedItems(params?: { types?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: storyKeys.feed(params),
    queryFn: async () => {
      const res = await apiClient.get('/feed', { params });
      return res.data.data as {
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });
}

export function useCreateFeedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/feed', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.feed() }),
  });
}

export function useDeleteFeedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/feed/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.feed() }),
  });
}
