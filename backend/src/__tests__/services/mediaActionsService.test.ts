import { mockPrisma } from '../setup';
import * as mediaActionsService from '../../services/mediaActionsService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockStory = {
  id: 'story-1',
  linkTargetType: 'PRODUCT',
  linkTargetId: 'prod-1',
  linkUrl: null,
  business: { id: 'biz-1', name: 'Biz', slug: 'biz', logo: null },
};

const mockProduct = {
  id: 'prod-1',
  name: 'Product',
  price: 1000,
  currency: 'FCFA',
  images: ['img.jpg'],
  slug: 'product',
  stock: 10,
  businessId: 'biz-1',
};

describe('mediaActionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMediaCommerceData', () => {
    it('should return commerce data for story with product link', async () => {
      (mockPrisma.story.findUnique as jest.Mock).mockResolvedValue(mockStory);
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      const result = await mediaActionsService.getMediaCommerceData('STORY', 'story-1');
      expect(result.commerce?.type).toBe('PRODUCT');
      expect(result.commerce?.action).toBe('add_to_cart');
    });

    it('should throw 404 if media not found', async () => {
      (mockPrisma.story.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(mediaActionsService.getMediaCommerceData('STORY', 'invalid')).rejects.toThrow(
        'Média introuvable'
      );
    });

    it('should return null commerce if no link target', async () => {
      (mockPrisma.story.findUnique as jest.Mock).mockResolvedValue({
        ...mockStory,
        linkTargetType: null,
        linkTargetId: null,
      });
      const result = await mediaActionsService.getMediaCommerceData('STORY', 'story-1');
      expect(result.commerce).toBeNull();
    });
  });

  describe('addToCartFromMedia', () => {
    it('should add item to existing cart', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.cart.upsert as jest.Mock).mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
      (mockPrisma.cartItem.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.cartItem.create as jest.Mock).mockResolvedValue({
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 2,
        total: 2000,
      });
      const result = await mediaActionsService.addToCartFromMedia('user-1', 'prod-1', 2);
      expect(result.total).toBe(2000);
    });

    it('should update quantity if item already in cart', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.cart.upsert as jest.Mock).mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
      (mockPrisma.cartItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'ci-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 1000,
      });
      (mockPrisma.cartItem.update as jest.Mock).mockResolvedValue({
        id: 'ci-1',
        quantity: 3,
        total: 3000,
      });
      const result = await mediaActionsService.addToCartFromMedia('user-1', 'prod-1', 2);
      expect(result.quantity).toBe(3);
    });

    it('should throw if product not found', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(mediaActionsService.addToCartFromMedia('user-1', 'invalid')).rejects.toThrow(
        'Produit introuvable'
      );
    });
  });

  describe('createOrderFromMedia', () => {
    it('should create an order', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.order.create as jest.Mock).mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
      });
      const result = await mediaActionsService.createOrderFromMedia('user-1', 'prod-1', 'biz-1');
      expect(result.id).toBe('order-1');
    });

    it('should throw if product not found', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        mediaActionsService.createOrderFromMedia('user-1', 'invalid', 'biz-1')
      ).rejects.toThrow('Produit introuvable');
    });
  });

  describe('createBookingFromMedia', () => {
    it('should create a booking', async () => {
      (mockPrisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'svc-1',
        name: 'Service',
        price: 5000,
      });
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.booking.create as jest.Mock).mockResolvedValue({
        id: 'book-1',
        status: 'PENDING',
      });
      const result = await mediaActionsService.createBookingFromMedia('user-1', 'svc-1', 'biz-1');
      expect(result.id).toBe('book-1');
    });
  });

  describe('installModuleFromMedia', () => {
    it('should install a module', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({
        id: 'mod-1',
        name: 'Module',
      });
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.developerModuleInstallation.create as jest.Mock).mockResolvedValue({
        id: 'install-1',
      });
      const result = await mediaActionsService.installModuleFromMedia('user-1', 'mod-1', 'biz-1');
      expect(result.id).toBe('install-1');
    });

    it('should throw if module already installed', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ id: 'mod-1' });
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing',
      });
      await expect(
        mediaActionsService.installModuleFromMedia('user-1', 'mod-1', 'biz-1')
      ).rejects.toThrow('Module déjà installé');
    });

    it('should throw if module not found', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        mediaActionsService.installModuleFromMedia('user-1', 'mod-1', 'biz-1')
      ).rejects.toThrow('Module introuvable');
    });
  });
});
