import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const referralKeys = {
  all: ['referrals'] as const,
  stats: ['referrals', 'stats'] as const,
};

export function useMyReferralCode() {
  return useQuery({
    queryKey: referralKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyReferralCode();
      return res.data.data;
    },
  });
}

export function useInviteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => apiClient.inviteReferral(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: [...referralKeys.all, 'list'],
    queryFn: async () => {
      const res = await apiClient.getMyReferrals();
      return res.data.data;
    },
  });
}

export function useMyReferralRewards() {
  return useQuery({
    queryKey: [...referralKeys.all, 'rewards'],
    queryFn: async () => {
      const res = await apiClient.getMyReferralRewards();
      return res.data.data;
    },
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: referralKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getReferralStats();
      return res.data.data;
    },
  });
}
