export interface VerificationLevelLimits {
  maxTransactionAmount: number | null;
  maxDailyTransactions: number | null;
  maxEscrowAmount: number | null;
  commissionRate: number;
  escrowReleaseDelay: number; // hours
  canMarketplacePriority: boolean;
  badgeVerifie: boolean;
}

export const VERIFICATION_LIMITS: Record<string, VerificationLevelLimits> = {
  ARGENT: {
    maxTransactionAmount: 200000,
    maxDailyTransactions: 10,
    maxEscrowAmount: 500000,
    commissionRate: 3.5,
    escrowReleaseDelay: 48,
    canMarketplacePriority: false,
    badgeVerifie: false,
  },
  OR: {
    maxTransactionAmount: 2000000,
    maxDailyTransactions: 50,
    maxEscrowAmount: 5000000,
    commissionRate: 2.5,
    escrowReleaseDelay: 24,
    canMarketplacePriority: true,
    badgeVerifie: true,
  },
  PLATINE: {
    maxTransactionAmount: null,
    maxDailyTransactions: null,
    maxEscrowAmount: null,
    commissionRate: 1.5,
    escrowReleaseDelay: 12,
    canMarketplacePriority: true,
    badgeVerifie: true,
  },
};
