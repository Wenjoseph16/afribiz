import { mockPrisma } from '../setup';
import { listDisputes, getDispute, createDispute, updateDispute } from '../../services/disputes';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: ['DISPUTES'], settings: {} };
const mockDispute = {
  id: 'disp-1',
  businessId: 'biz-1',
  title: 'Problème',
  status: 'OPEN',
  amount: 15000,
  createdAt: new Date(),
};

describe('Disputes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const b = mockPrisma.business;
    b.findUnique = jest.fn().mockResolvedValue(mockBiz as any);
  });

  test('listDisputes returns paginated', async () => {
    jest.spyOn(mockPrisma.dispute, 'findMany').mockResolvedValue([mockDispute as any]);
    jest.spyOn(mockPrisma.dispute, 'count').mockResolvedValue(1);
    const r = await listDisputes('u1', {});
    expect(r.total).toBe(1);
  });

  test('getDispute returns dispute', async () => {
    jest.spyOn(mockPrisma.dispute, 'findFirst').mockResolvedValue(mockDispute as any);
    const r = await getDispute('u1', 'disp-1');
    expect(r.id).toBe('disp-1');
  });

  test('createDispute creates', async () => {
    jest.spyOn(mockPrisma.dispute, 'create').mockResolvedValue(mockDispute as any);
    const r = await createDispute('u1', { title: 'Problème', amount: 15000 });
    expect(r.title).toBe('Problème');
  });

  test('updateDispute updates status', async () => {
    jest.spyOn(mockPrisma.dispute, 'findFirst').mockResolvedValue(mockDispute as any);
    jest
      .spyOn(mockPrisma.dispute, 'update')
      .mockResolvedValue({ ...mockDispute, status: 'RESOLVED' } as any);
    const r = await updateDispute('u1', 'disp-1', { status: 'RESOLVED' });
    expect(r.status).toBe('RESOLVED');
  });
});
