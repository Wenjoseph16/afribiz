'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const gamificationKeys = {
  dashboard: ['gamification', 'dashboard'] as const,
  quests: ['gamification', 'quests'] as const,
  completedQuests: ['gamification', 'quests', 'completed'] as const,
  streaks: ['gamification', 'streaks'] as const,
  ranking: ['gamification', 'ranking'] as const,
  leaderboard: (category?: string) => ['gamification', 'leaderboard', category] as const,
  challenges: ['gamification', 'challenges'] as const,
};

export function useGamificationDashboard() {
  return useQuery({
    queryKey: gamificationKeys.dashboard,
    queryFn: async () => {
      const res = await apiClient.getGamificationDashboard();
      return res.data.data;
    },
  });
}

export function useMyQuests() {
  return useQuery({
    queryKey: gamificationKeys.quests,
    queryFn: async () => {
      const res = await apiClient.getMyQuests();
      return res.data.data;
    },
  });
}

export function useMyCompletedQuests() {
  return useQuery({
    queryKey: gamificationKeys.completedQuests,
    queryFn: async () => {
      const res = await apiClient.getCompletedQuests();
      return res.data.data;
    },
  });
}

export function useMyStreaks() {
  return useQuery({
    queryKey: gamificationKeys.streaks,
    queryFn: async () => {
      const res = await apiClient.getMyStreaks();
      return res.data.data;
    },
  });
}

export function useMyRanking() {
  return useQuery({
    queryKey: gamificationKeys.ranking,
    queryFn: async () => {
      const res = await apiClient.getMyRanking();
      return res.data.data;
    },
  });
}

export function useLeaderboard(category?: string) {
  return useQuery({
    queryKey: gamificationKeys.leaderboard(category),
    queryFn: async () => {
      const params = category ? { category } : {};
      const res = await apiClient.getLeaderboard({ category });
      return res.data.data;
    },
  });
}

export function useMyChallenges() {
  return useQuery({
    queryKey: gamificationKeys.challenges,
    queryFn: async () => {
      const res = await apiClient.getMyChallenges();
      return res.data.data;
    },
  });
}

export function useInitializeQuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.initializeQuests(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gamificationKeys.quests });
      qc.invalidateQueries({ queryKey: gamificationKeys.dashboard });
    },
  });
}
