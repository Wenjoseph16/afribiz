import { mockPrisma } from '../setup';
import {
  saveItem,
  unsaveItem,
  listSavedItems,
  checkSaved,
  getSavedCount,
} from '../../services/savedItemService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockItem = {
  id: 'si-1',
  userId: 'u1',
  type: 'PROMOTION',
  referenceId: 'promo-1',
  createdAt: new Date(),
};

describe('SavedItem Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveItem creates new saved item', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.savedItem, 'create').mockResolvedValue(mockItem as any);
    const r = await saveItem('u1', { type: 'PROMOTION', referenceId: 'promo-1' });
    expect(r.id).toBe('si-1');
  });

  test('saveItem returns existing if already saved', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findUnique').mockResolvedValue(mockItem as any);
    const r = await saveItem('u1', { type: 'PROMOTION', referenceId: 'promo-1' });
    expect(r.id).toBe('si-1');
  });

  test('unsaveItem removes saved item', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findFirst').mockResolvedValue(mockItem as any);
    jest.spyOn(mockPrisma.savedItem, 'delete').mockResolvedValue(mockItem as any);
    const r = await unsaveItem('u1', 'si-1');
    expect(r.message).toBe('Élément retiré des favoris');
  });

  test('unsaveItem throws if not found', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findFirst').mockResolvedValue(null);
    await expect(unsaveItem('u1', 'si-x')).rejects.toThrow('Élément non trouvé');
  });

  test('listSavedItems returns paginated results', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findMany').mockResolvedValue([mockItem as any]);
    jest.spyOn(mockPrisma.savedItem, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.promotion, 'findUnique').mockResolvedValue({
      id: 'promo-1',
      title: 'Promo',
      discountValue: 20,
      promotionType: 'PERCENTAGE',
      endsAt: null,
    } as any);
    const r = await listSavedItems('u1', {});
    expect(r.data).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  test('checkSaved returns true when saved', async () => {
    jest.spyOn(mockPrisma.savedItem, 'findUnique').mockResolvedValue(mockItem as any);
    const r = await checkSaved('u1', 'PROMOTION', 'promo-1');
    expect(r.saved).toBe(true);
    expect(r.id).toBe('si-1');
  });

  test('getSavedCount returns count', async () => {
    jest.spyOn(mockPrisma.savedItem, 'count').mockResolvedValue(5);
    const r = await getSavedCount('promo-1');
    expect(r.count).toBe(5);
  });
});
