import { mockPrisma } from '../setup';
import { listMenuItems, createMenuItem, getMenuItemStats } from '../../services/menu';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'RestoT', modules: ['MENU'], settings: {} };
const mockItem = {
  id: 'item-1',
  businessId: 'biz-1',
  name: 'Pizza',
  price: 5000,
  isActive: true,
  categoryId: null,
};

describe('Menu Service', () => {
  beforeEach(() => {
    const m = mockPrisma.business;
    m.findUnique = jest.fn().mockResolvedValue(mockBiz as any);
  });

  test('listMenuItems returns paginated', async () => {
    mockPrisma.menuItem.findMany.mockResolvedValue([mockItem as any]);
    mockPrisma.menuItem.count.mockResolvedValue(1);
    const r = await listMenuItems('u1', {});
    expect(r.total).toBe(1);
  });

  test('createMenuItem creates item', async () => {
    const mockTx = {
      menuItem: {
        create: jest.fn().mockResolvedValue(mockItem),
        findUnique: jest.fn().mockResolvedValue(mockItem),
      },
      menuItemVariant: { createMany: jest.fn() },
    };
    (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (fn: any) => fn(mockTx));
    const r = await createMenuItem('u1', {
      name: 'Pizza',
      price: 5000,
      categoryId: 'cat-1',
    } as any);
    expect(r).toBeDefined();
  });

  test('getMenuItemStats aggregates', async () => {
    mockPrisma.menuItem.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    mockPrisma.menuItem.aggregate.mockResolvedValue({ _sum: { orderCount: 50 } } as any);
    mockPrisma.menuItem.groupBy.mockResolvedValue([{ status: 'ACTIVE', _count: 8 }] as any);
    const r = await getMenuItemStats('u1');
    expect(r.total).toBe(10);
  });
});
