import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const storyKeys = {
  all: ['stories'] as const,
  active: ['stories', 'active'] as const,
  business: (id: string) => ['stories', 'business', id] as const,
  highlights: (businessId: string) => ['stories', 'highlights', businessId] as const,
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
      const res = await apiClient.getActiveStories();
      return (res.data.data || []) as StoryGroup[];
    },
    refetchInterval: 30000,
  });
}

export function useBusinessStories(businessId: string) {
  return useQuery({
    queryKey: storyKeys.business(businessId),
    queryFn: async () => {
      const res = await apiClient.getBusinessStories(businessId);
      return res.data.data || [];
    },
    enabled: !!businessId,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createStory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
    },
  });
}

export function useViewStory() {
  return useMutation({
    mutationFn: (storyId: string) => apiClient.viewStory(storyId),
  });
}

export function useClickStory() {
  return useMutation({
    mutationFn: (storyId: string) => apiClient.clickStory(storyId),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteStory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.active }),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateStory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
      qc.invalidateQueries({ queryKey: storyKeys.all });
    },
  });
}

export function useAddSticker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, sticker }: { storyId: string; sticker: any }) =>
      apiClient.addSticker(storyId, sticker),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
    },
  });
}

export function useRemoveSticker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, stickerId }: { storyId: string; stickerId: string }) =>
      apiClient.removeSticker(storyId, stickerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
    },
  });
}

export function useGetHighlights(businessId: string) {
  return useQuery({
    queryKey: storyKeys.highlights(businessId),
    queryFn: async () => {
      const res = await apiClient.getHighlights(businessId);
      return res.data.data || [];
    },
    enabled: !!businessId,
  });
}

export function useToggleHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storyId, isHighlight }: { storyId: string; isHighlight: boolean }) =>
      apiClient.toggleHighlight(storyId, isHighlight),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storyKeys.active });
    },
  });
}

export function useFeedItems(params?: { types?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: storyKeys.feed(params),
    queryFn: async () => {
      const res = await apiClient.getFeedItems(params);
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
    mutationFn: (data: any) => apiClient.createFeedItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.feed() }),
  });
}

export function useDeleteFeedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteFeedItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: storyKeys.feed() }),
  });
}
