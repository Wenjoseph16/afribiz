import {
  generateWhatsAppLink,
  buildOrderMessage,
  generateOrderWhatsAppLink,
  generateBusinessShareLink,
  sendWhatsAppMessage,
} from '../../services/WhatsAppShareService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('WhatsAppShareService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWhatsAppLink', () => {
    it('should generate a correct wa.me link', () => {
      const link = generateWhatsAppLink('+22890000000', 'Bonjour!');
      expect(link).toContain('wa.me/22890000000');
      expect(link).toContain(encodeURIComponent('Bonjour!'));
    });

    it('should clean phone number formatting', () => {
      const link = generateWhatsAppLink('+228 90 00 00 00', 'Test');
      expect(link).toContain('wa.me/22890000000');
    });

    it('should encode special characters', () => {
      const link = generateWhatsAppLink('22890000000', 'Bonjour & a bientot!');
      expect(link).toContain(encodeURIComponent('Bonjour & a bientot!'));
    });
  });

  describe('buildOrderMessage', () => {
    const base = { businessName: 'Mon Business', customerName: 'Jean Dupont' };

    it('should build ORDER_CONFIRMED message', () => {
      const msg = buildOrderMessage('ORDER_CONFIRMED', {
        ...base,
        orderNumber: 'CMD-001',
        totalAmount: '15000 FCFA',
        items: [{ name: 'Produit A', quantity: 2 }],
      });
      expect(msg).toContain('confirmée');
      expect(msg).toContain('CMD-001');
      expect(msg).toContain('Produit A');
    });

    it('should build ORDER_REFUSED message with reason', () => {
      const msg = buildOrderMessage('ORDER_REFUSED', { ...base, reason: 'Stock insuffisant' });
      expect(msg).toContain('refusée');
      expect(msg).toContain('Stock insuffisant');
    });

    it('should build ORDER_READY message', () => {
      const msg = buildOrderMessage('ORDER_READY', { ...base, orderNumber: 'CMD-002' });
      expect(msg).toContain('prête');
    });

    it('should build ORDER_SHIPPED message', () => {
      const msg = buildOrderMessage('ORDER_SHIPPED', { ...base });
      expect(msg).toContain('expédiée');
    });

    it('should build PROMOTION message', () => {
      const msg = buildOrderMessage('PROMOTION', {
        ...base,
        totalAmount: '20%',
        publicUrl: 'https://afribiz.com/promo',
      });
      expect(msg).toContain('Promotion spéciale');
      expect(msg).toContain('20%');
    });

    it('should build PRODUCT_SHARE message', () => {
      const msg = buildOrderMessage('PRODUCT_SHARE', {
        ...base,
        items: [{ name: 'Article Premium', quantity: 1 }],
        publicUrl: 'https://afribiz.com/product/1',
      });
      expect(msg).toContain('Découvrez');
    });

    it('should build BUSINESS_SHARE message', () => {
      const msg = buildOrderMessage('BUSINESS_SHARE', {
        ...base,
        publicUrl: 'https://afribiz.com/business/mon-business',
      });
      expect(msg).toContain('Mon Business');
    });
  });

  describe('generateOrderWhatsAppLink', () => {
    it('should generate full order WhatsApp link', () => {
      const link = generateOrderWhatsAppLink('22890000000', 'ORDER_CONFIRMED', {
        businessName: 'Biz',
      });
      expect(link).toContain('wa.me/22890000000');
      expect(link).toContain(encodeURIComponent('Biz'));
    });
  });

  describe('generateBusinessShareLink', () => {
    it('should generate business share link', () => {
      const link = generateBusinessShareLink(
        '22890000000',
        'Mon Business',
        'https://afribiz.com/biz'
      );
      expect(link).toContain('wa.me/22890000000');
      expect(link).toContain(encodeURIComponent('Mon Business'));
    });
  });

  describe('sendWhatsAppMessage', () => {
    it('should return simulated success', async () => {
      const r = await sendWhatsAppMessage('22890000000', 'Bonjour');
      expect(r.success).toBe(true);
      expect(r.messageId).toContain('simulated_');
    });
  });
});
