import { mockPrisma } from '../setup';
import {
  checkPlanLimit,
  hasCopilotAccess,
  getPlanPrivilegeValue,
  invalidatePlanCache,
  assertCopilotAccess,
} from '../../services/planAccessService';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const freePlan = {
  id: 'platform-free',
  name: 'Gratuit',
  privileges: [
    { code: 'PRODUCTS_LIMIT', value: 10 },
    { code: 'CLIENTS_LIMIT', value: 50 },
    { code: 'BOOKINGS_LIMIT', value: 30 },
  ],
};

const afribizPlan = {
  id: 'platform-afribiz',
  name: 'AfriBiz',
  privileges: [
    { code: 'PRODUCTS_LIMIT', value: -1 },
    { code: 'CLIENTS_LIMIT', value: -1 },
    { code: 'BOOKINGS_LIMIT', value: -1 },
  ],
};

const copilotPlan = {
  id: 'platform-copilot',
  name: 'Copilot IA',
  privileges: [{ code: 'COPILOT_ACCESS', value: 1 }],
};

describe('planAccessService', () => {
  beforeEach(() => {
    invalidatePlanCache();
    jest.clearAllMocks();
  });

  it('ne bloque pas quand le business na pas de plan explicite (fallback Gratuit avec marge)', async () => {
    // business sans planId → fallback platform-free
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);

    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 5, 'produits')
    ).resolves.toBeUndefined();
  });

  it('bloque quand la limite du plan est atteinte', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);

    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 10, 'produits')
    ).rejects.toThrow(AppError);
    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 10, 'produits')
    ).rejects.toThrow(/Limite du plan/);
  });

  it('laisse passer quand le privilège est illimité (-1)', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(afribizPlan);

    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 999, 'produits')
    ).resolves.toBeUndefined();
  });

  it('laisse passer quand le privilège est absent ou le plan introuvable (tolérance)', async () => {
    // Plan introuvable → mock retourne null → aucun privilège → pas de blocage
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 999, 'produits')
    ).resolves.toBeUndefined();
    // Erreur DB → pas de blocage
    (mockPrisma.business.findUnique as jest.Mock).mockRejectedValue(new Error('db down'));
    await expect(
      checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 999, 'produits')
    ).resolves.toBeUndefined();
  });

  it('getPlanPrivilegeValue retourne null pour un privilège absent', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    const value = await getPlanPrivilegeValue('biz-1', 'COPILOT_ACCESS');
    expect(value).toBeNull();
  });

  it('hasCopilotAccess: vrai uniquement pour le plan Copilot IA ou COPILOT_ACCESS=1', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    expect(await hasCopilotAccess('biz-1')).toBe(false);

    // Invalide le cache 30s pour tester le changement de plan
    invalidatePlanCache();
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(copilotPlan);
    expect(await hasCopilotAccess('biz-1')).toBe(true);
  });

  it('assertCopilotAccess lève une erreur 403 sans accès Copilot', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    await expect(assertCopilotAccess('biz-1')).rejects.toThrow(AppError);
    await expect(assertCopilotAccess('biz-1')).rejects.toThrow(/Copilot IA/);
  });

  it('utilise le plan explicite du business si présent (pas le fallback)', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: 'platform-afribiz' });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(afribizPlan);
    const value = await getPlanPrivilegeValue('biz-1', 'PRODUCTS_LIMIT');
    expect(value).toBeNull(); // -1 → illimité → null
  });
});
