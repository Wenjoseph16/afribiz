import { mockPrisma } from '../setup';
import {
  getBusinessClients,
  createTag,
  assignTag,
  getSegments,
  getCrmDashboardStats,
} from '../../services/crm';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz' };

describe('CRM Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getBusinessClients returns paginated clients', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.businessClient, 'findMany').mockResolvedValue([
      {
        id: 'bc-1',
        clientId: 'u1',
        firstName: 'Jean',
        lastName: 'Kone',
        email: 'j@t.com',
        totalOrders: 5,
        totalSpent: 50000,
        tags: [],
        segments: [],
        client: {},
      } as any,
    ]);
    jest.spyOn(mockPrisma.businessClient, 'count').mockResolvedValue(1);
    const r = await getBusinessClients('biz-1', {});
    expect(r.total).toBe(1);
  });

  test('createTag creates new tag', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.businessTag, 'findUnique').mockResolvedValue(null);
    jest
      .spyOn(mockPrisma.businessTag, 'create')
      .mockResolvedValue({ id: 'tag-1', name: 'VIP', color: '#6366f1' } as any);
    const r = await createTag('biz-1', 'VIP');
    expect(r.name).toBe('VIP');
  });

  test('createTag rejects duplicate', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz as any);
    jest.spyOn(mockPrisma.businessTag, 'findUnique').mockResolvedValue({ id: 'tag-1' } as any);
    await expect(createTag('biz-1', 'VIP')).rejects.toThrow('Ce tag existe déjà');
  });

  test('assignTag assigns tag to client', async () => {
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue({ id: 'u1' } as any);
    jest
      .spyOn(mockPrisma.businessClient, 'upsert')
      .mockResolvedValue({ id: 'bc-1', businessId: 'biz-1', clientId: 'u1' } as any);
    jest
      .spyOn(mockPrisma.businessTag, 'findFirst')
      .mockResolvedValue({ id: 'tag-1', name: 'VIP' } as any);
    jest.spyOn(mockPrisma.businessClientTag, 'upsert').mockResolvedValue({} as any);
    await assignTag('biz-1', 'u1', 'tag-1');
    expect(mockPrisma.businessClientTag.upsert).toHaveBeenCalled();
  });

  test('getSegments returns segments', async () => {
    jest
      .spyOn(mockPrisma.clientSegment, 'findMany')
      .mockResolvedValue([{ id: 'seg-1', name: 'Fideles', _count: { clients: 10 } } as any]);
    const r = await getSegments('biz-1');
    expect(r).toHaveLength(1);
  });

  test('getCrmDashboardStats aggregates stats', async () => {
    for (const m of [
      'businessClient',
      'businessClient',
      'businessClient',
      'businessClient',
      'clientSegment',
      'businessTag',
      'clientNote',
      'clientRisk',
    ]) {
      jest.spyOn(mockPrisma[m as keyof typeof mockPrisma], 'count').mockResolvedValue(5);
    }
    jest
      .spyOn(mockPrisma.businessClient, 'aggregate')
      .mockResolvedValue({ _avg: { totalOrders: 3 } } as any);
    jest.spyOn(mockPrisma.clientNote, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.businessClient, 'findMany').mockResolvedValue([]);
    const r = await getCrmDashboardStats('biz-1');
    expect(r.totalClients).toBe(5);
  });
});
