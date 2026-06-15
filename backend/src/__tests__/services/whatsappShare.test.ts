import { generateWhatsAppLink, buildOrderMessage } from '../../services/WhatsAppShareService';

describe('WhatsAppShareService', () => {
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
        ...base, orderNumber: 'CMD-001', totalAmount: '15000 FCFA',
        items: [{ name: 'Produit A', quantity: 2 }],
      });
      expect(msg).toContain('confirmée');
      expect(msg).toContain('CMD-001');
      expect(msg).toContain('Produit A');
    });

    it('should build ORDER_REFUSED message with reason', () => {
      const msg = buildOrderMessage('ORDER_REFUSED', {
        ...base, reason: 'Stock insuffisant',
      });
      expect(msg).toContain('refusée');
      expect(msg).toContain('Stock insuffisant');
    });

    it('should build PROMOTION message', () => {
      const msg = buildOrderMessage('PROMOTION', {
        ...base, totalAmount: '20%', publicUrl: 'https://afribiz.com/promo',
      });
      expect(msg).toContain('promotion');
      expect(msg).toContain('20%');
    });

    it('should build PRODUCT_SHARE message', () => {
      const msg = buildOrderMessage('PRODUCT_SHARE', {
        ...base, items: [{ name: 'Article Premium', quantity: 1 }],
        publicUrl: 'https://afribiz.com/product/1',
      });
      expect(msg).toContain('Découvrez');
      expect(msg).toContain('Article Premium');
    });

    it('should build BUSINESS_SHARE message', () => {
      const msg = buildOrderMessage('BUSINESS_SHARE', {
        ...base, publicUrl: 'https://afribiz.com/business/mon-business',
      });
      expect(msg).toContain('Mon Business');
    });
  });
});
