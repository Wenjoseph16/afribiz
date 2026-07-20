import { mockPrisma } from '../setup';
import {
  listServices,
  getService,
  createService,
  deleteService,
  getServiceStats,
} from '../../services/service';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishNewMessage: jest.fn() }));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: ['SERVICES'], settings: {} };
const mockSvc = {
  id: 'svc-1',
  businessId: 'biz-1',
  name: 'Coaching',
  price: 50000,
  isActive: true,
  category: null,
  variants: [],
  _count: { reviews: 0 },
};

describe('Service Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const b = mockPrisma.business;
    b.findUnique = jest.fn().mockResolvedValue(mockBiz as any);
  });

  test('listServices returns paginated', async () => {
    jest.spyOn(mockPrisma.service, 'findMany').mockResolvedValue([mockSvc as any]);
    jest.spyOn(mockPrisma.service, 'count').mockResolvedValue(1);
    const r = await listServices('u1', {});
    expect(r.pagination.total).toBe(1);
  });

  test('getService returns service', async () => {
    jest.spyOn(mockPrisma.service, 'findFirst').mockResolvedValue(mockSvc as any);
    const r = await getService('u1', 'svc-1');
    expect(r.id).toBe('svc-1');
  });

  test('getService throws if not found', async () => {
    jest.spyOn(mockPrisma.service, 'findFirst').mockResolvedValue(null);
    await expect(getService('u1', 'svc-x')).rejects.toThrow('not found');
  });

  test('deleteService soft-deletes', async () => {
    jest.spyOn(mockPrisma.service, 'findFirst').mockResolvedValue(mockSvc as any);
    jest.spyOn(mockPrisma.service, 'update').mockResolvedValue(mockSvc as any);
    const r = await deleteService('u1', 'svc-1');
    expect(r.message).toContain('deleted');
  });

  test('getServiceStats aggregates', async () => {
    const countSpy = jest.spyOn(mockPrisma.service, 'count');
    countSpy.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
    const aggSpy = jest.spyOn(mockPrisma.service, 'aggregate');
    aggSpy.mockResolvedValue({ _sum: { orderCount: 50 } } as any);
    jest.spyOn(mockPrisma.serviceCategory, 'count').mockResolvedValue(3);
    const r = await getServiceStats('u1');
    expect(r.totalServices).toBe(10);
  });
});
