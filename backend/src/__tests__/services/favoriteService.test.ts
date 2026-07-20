import { mockPrisma } from '../setup';
import { getFavorites, addFavorite, removeFavorite } from '../../services/favoriteService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockProduct = {
  id: 'p1',
  name: 'Produit',
  images: ['img.jpg'],
  price: 5000,
  slug: 'produit',
  businessId: 'b1',
  currency: 'XOF',
  rating: 4,
};
const mockFav = {
  id: 'fav-1',
  userId: 'u1',
  type: 'PRODUCT',
  referenceId: 'p1',
  productId: 'p1',
  createdAt: new Date(),
};

describe('Favorite Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getFavorites returns enriched favorites', async () => {
    jest.spyOn(mockPrisma.favorite, 'findMany').mockResolvedValue([mockFav as any]);
    jest.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(mockProduct as any);
    const r = await getFavorites('u1');
    expect(r).toHaveLength(1);
    expect(r[0]._type).toBe('product');
  });

  test('getFavorites filters by type', async () => {
    jest.spyOn(mockPrisma.favorite, 'findMany').mockResolvedValue([]);
    const r = await getFavorites('u1', 'BUSINESS');
    expect(r).toHaveLength(0);
  });

  test('addFavorite creates if not existing', async () => {
    jest.spyOn(mockPrisma.favorite, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.favorite, 'create').mockResolvedValue(mockFav as any);
    await expect(addFavorite('u1', 'PRODUCT', 'p1')).resolves.not.toThrow();
  });

  test('addFavorite throws 409 if already exists', async () => {
    jest.spyOn(mockPrisma.favorite, 'findUnique').mockResolvedValue(mockFav as any);
    await expect(addFavorite('u1', 'PRODUCT', 'p1')).rejects.toThrow('Already in favorites');
  });

  test('removeFavorite removes existing favorite', async () => {
    jest.spyOn(mockPrisma.favorite, 'findFirst').mockResolvedValue(mockFav as any);
    jest.spyOn(mockPrisma.favorite, 'delete').mockResolvedValue(mockFav as any);
    await expect(removeFavorite('u1', 'fav-1')).resolves.not.toThrow();
  });

  test('removeFavorite throws 404 if not found', async () => {
    jest.spyOn(mockPrisma.favorite, 'findFirst').mockResolvedValue(null);
    await expect(removeFavorite('u1', 'fav-x')).rejects.toThrow('Favorite not found');
  });
});
