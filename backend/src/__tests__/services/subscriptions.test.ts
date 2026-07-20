import { mockPrisma } from '../setup';
import {
  listSubscriptionPlans,
  createSubscriptionPlan,
  createSubscription,
  cancelSubscription,
  getSubscriptionStats,
} from '../../services/subscriptions';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: ['SUBSCRIPTIONS'], settings: {} };
const mockPlan = {
  id: 'plan-1',
  businessId: 'biz-1',
  name: 'Premium',
  price: 10000,
  currency: 'FCFA',
  billingCycle: 'MONTHLY',
  isActive: true,
  isPublic: true,
  privileges: [],
  _count: { subscribers: 0 },
};

describe('Subscriptions Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPrisma.business.findFirst.mockResolvedValue(mockBiz as any);
  });

  test('listSubscriptionPlans returns paginated', async () => {
    mockPrisma.subscriptionPlan.findMany.mockResolvedValue([mockPlan as any]);
    mockPrisma.subscriptionPlan.count.mockResolvedValue(1);
    const r = await listSubscriptionPlans('u1', {});
    expect(r.total).toBe(1);
  });

  test('createSubscriptionPlan creates with privileges', async () => {
    mockPrisma.subscriptionPlan.create.mockResolvedValue(mockPlan as any);
    mockPrisma.subscriptionPrivilege.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue(mockPlan as any);
    const r = await createSubscriptionPlan('u1', {
      name: 'Premium',
      price: 10000,
      privileges: [{ code: 'FEATURE_1', label: 'Feature 1' }],
    });
    expect(r!.name).toBe('Premium');
  });

  test('createSubscription activates new sub', async () => {
    mockPrisma.subscriptionPlan.findFirst.mockResolvedValue(mockPlan as any);
    mockPrisma.businessSubscription.findFirst.mockResolvedValue(null);
    mockPrisma.businessSubscription.create.mockResolvedValue({
      id: 'sub-1',
      status: 'ACTIVE',
      plan: mockPlan,
      client: {},
    } as any);
    mockPrisma.subscriptionLog.create.mockResolvedValue({} as any);
    const r = await createSubscription('u1', { planId: 'plan-1', clientId: 'u1' });
    expect(r.status).toBe('ACTIVE');
  });

  test('createSubscription rejects duplicate active', async () => {
    mockPrisma.subscriptionPlan.findFirst.mockResolvedValue(mockPlan as any);
    mockPrisma.businessSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      status: 'ACTIVE',
    } as any);
    await expect(createSubscription('u1', { planId: 'plan-1', clientId: 'u1' })).rejects.toThrow(
      'deja un abonnement actif'
    );
  });

  test('cancelSubscription cancels with reason', async () => {
    mockPrisma.businessSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
    } as any);
    mockPrisma.businessSubscription.update.mockResolvedValue({
      id: 'sub-1',
      status: 'CANCELLED',
      plan: {},
      client: {},
    } as any);
    mockPrisma.subscriptionLog.create.mockResolvedValue({} as any);
    const r = await cancelSubscription('u1', 'sub-1', { reason: 'Non utilise' });
    expect(r.status).toBe('CANCELLED');
  });

  test('getSubscriptionStats aggregates', async () => {
    mockPrisma.subscriptionPlan.count.mockResolvedValue(3);
    mockPrisma.businessSubscription.count.mockResolvedValue(5);
    mockPrisma.subscriptionPayment.count.mockResolvedValue(7);
    mockPrisma.subscriptionPayment.aggregate.mockResolvedValue({ _sum: { amount: 100000 } } as any);
    const r = await getSubscriptionStats('u1');
    expect(r.totalPlans).toBe(3);
  });
});
