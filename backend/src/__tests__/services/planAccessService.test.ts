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
// Socket mocké : on capture le push temps réel sans serveur réel
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
jest.mock('../../services/socket', () => ({
  getIO: () => ({ to: mockTo }),
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

    await expect(checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 5, 'produits')).resolves.toBeUndefined();
  });

  it('bloque quand la limite du plan est atteinte', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);

    await expect(checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 10, 'produits')).rejects.toThrow(
      AppError
    );
    await expect(checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 10, 'produits')).rejects.toThrow(
      /Limite du plan/
    );
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

describe('checkPlanLimit — alertes de quota à 80%', () => {
  beforeEach(() => {
    invalidatePlanCache();
    jest.clearAllMocks();
  });

  it("crée une notification PLAN_LIMIT quand la limite est utilisée à >= 80%", async () => {
    // business avec owner (fallback Gratuit : PRODUCTS_LIMIT = 10 → seuil = 8)
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 8, 'produits');

    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    const data = (mockPrisma.notification.create as jest.Mock).mock.calls[0][0].data;
    expect(data.userId).toBe('owner-1');
    expect(data.type).toBe('PLAN_LIMIT');
    expect(data.link).toBe('/dashboard/business/subscription');
    expect(data.metadata.resource).toBe('PRODUCTS_LIMIT');
    expect(data.metadata.current).toBe(8);
    expect(data.metadata.limit).toBe(10);
    expect(data.title).toContain('produits');
  });

  it('ne crée pas de doublon si une alerte identique existe déjà (anti-spam 7 jours)', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });
    // Alerte existante pour CE business + CETTE ressource dans les 7 jours
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([
      { metadata: { resource: 'PRODUCTS_LIMIT', businessId: 'biz-1', pct: 80 } },
    ]);

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 9, 'produits');

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('notifie à nouveau quand l alerte existante concerne un AUTRE business (propriétaire multi-business)', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-2' });
    // Alerte récente pour le business B (pas biz-1) → ne doit pas bloquer l alerte de biz-1
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([
      { metadata: { resource: 'PRODUCTS_LIMIT', businessId: 'biz-B', pct: 80 } },
    ]);

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 8, 'produits');

    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    const data = (mockPrisma.notification.create as jest.Mock).mock.calls[0][0].data;
    expect(data.metadata.businessId).toBe('biz-1');
  });

  it('ne notifie pas quand l usage est en dessous de 80%', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 7, 'produits');

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('reste non-bloquant si la création de notification échoue', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.notification.create as jest.Mock).mockRejectedValue(new Error('db down'));

    // L alerte échoue en silence, mais le check de limite passe (pas de 500 métier)
    await expect(checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 8, 'produits')).resolves.toBeUndefined();
  });

  it('ne notifie pas quand le business n a pas de propriétaire', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ planId: null });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 8, 'produits');

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it('pousse la notification en temps réel sur la room user:{ownerId}', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      planId: null,
      ownerId: 'owner-1',
    });
    (mockPrisma.subscriptionPlan.findUnique as jest.Mock).mockResolvedValue(freePlan);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({
      id: 'notif-1',
      type: 'PLAN_LIMIT',
      title: 'Limite produits presque atteinte',
    });

    await checkPlanLimit('biz-1', 'PRODUCTS_LIMIT', 8, 'produits');

    expect(mockTo).toHaveBeenCalledWith('user:owner-1');
    expect(mockEmit).toHaveBeenCalledWith('notification:new', expect.objectContaining({ id: 'notif-1' }));
  });
});
