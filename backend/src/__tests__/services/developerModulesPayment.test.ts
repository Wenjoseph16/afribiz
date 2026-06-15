/**
 * Developer Modules Payment & Trial unit tests
 *
 * Tests: purchaseModule, startTrial, completeModulePurchase, confirmModulePayment
 */

import { mockPrisma } from '../setup';
import * as developerModules from '../../services/developerModules';
import * as paymentProcessor from '../../services/paymentProcessor';
import { AppError } from '../../middlewares/errorHandler';

// Mock paymentProcessor
jest.mock('../../services/paymentProcessor', () => ({
  processMobileMoney: jest.fn(),
  saveTransaction: jest.fn(),
}));

// Mock DeveloperRepository
jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: 'dev-1', userId: 'user-1' }),
  },
}));

const mockModule = {
  id: 'module-1',
  name: 'Factura Pro',
  slug: 'factura-pro',
  developerId: 'dev-1',
  price: 25000,
  currency: 'FCFA',
  isFree: false,
  isPublished: true,
  description: 'Gestion des factures',
};

const mockBusiness = {
  id: 'biz-1',
  ownerId: 'user-1',
  name: 'Ma Boutique',
  slug: 'ma-boutique',
};

describe('DeveloperModules — Paiement & Essai', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ ...mockModule });
    (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue({ ...mockModule });
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ ...mockBusiness });
    (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.developerModuleInstallation.create as jest.Mock).mockResolvedValue({
      id: 'inst-1', moduleId: 'module-1', businessId: 'biz-1', status: 'ACTIVE', installedAt: new Date('2025-01-15'),
    });
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });
    (mockPrisma.businessSettings as any).upsert = jest.fn().mockResolvedValue({ id: 'settings-1' });
    (mockPrisma.moduleLicense.create as jest.Mock).mockResolvedValue({
      id: 'lic-1', licenseKey: 'TRIAL-KEY', status: 'ACTIVE',
    });
  });

  describe('purchaseModule', () => {
    it('should throw 404 if module does not exist', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        developerModules.purchaseModule('module-inexistant', 'user-1', { provider: 'TMONEY', phone: '22901000001' })
      ).rejects.toThrow(AppError);
    });

    it('should throw 400 if module is not published', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ ...mockModule, isPublished: false });
      await expect(
        developerModules.purchaseModule('module-1', 'user-1', { provider: 'TMONEY', phone: '22901000001' })
      ).rejects.toThrow("Ce module n'est pas disponible");
    });

    it('should throw 409 if module already installed', async () => {
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-install', status: 'ACTIVE' });
      await expect(
        developerModules.purchaseModule('module-1', 'user-1', { provider: 'TMONEY', phone: '22901000001' })
      ).rejects.toThrow('Module déjà installé');
    });

    it('should install free modules directly without payment', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ ...mockModule, price: 0, isFree: true });
      const result = await developerModules.purchaseModule('module-1', 'user-1', { provider: 'TMONEY', phone: '22901000001' });
      expect(result).toHaveProperty('id', 'inst-1');
      expect(paymentProcessor.processMobileMoney).not.toHaveBeenCalled();
    });

    it('should initiate payment for paid modules with test phone', async () => {
      (paymentProcessor.processMobileMoney as jest.Mock).mockResolvedValue({
        providerRef: 'TMONEY_123456_ABC123', status: 'SUCCESS', fee: 250,
      });
      (mockPrisma.paymentTransaction.create as jest.Mock).mockResolvedValue({ id: 'tx-1', status: 'SUCCESS' });
      (mockPrisma.developerRevenue.create as jest.Mock).mockResolvedValue({ id: 'rev-1' });

      const result = await developerModules.purchaseModule('module-1', 'user-1', {
        provider: 'TMONEY', phone: '22901000001',
      });

      expect(paymentProcessor.processMobileMoney).toHaveBeenCalledWith('TMONEY', '22901000001', 25000, expect.any(String));
      expect(paymentProcessor.saveTransaction).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });

    it('should return PENDING for non-test phones', async () => {
      (paymentProcessor.processMobileMoney as jest.Mock).mockResolvedValue({
        providerRef: 'FLOOZ_123456_DEF456', status: 'PENDING', fee: 250,
        message: 'Paiement FLOOZ initié. Confirmez sur votre téléphone.',
      });
      (mockPrisma.paymentTransaction.create as jest.Mock).mockResolvedValue({ id: 'tx-1', status: 'PENDING' });

      const result = await developerModules.purchaseModule('module-1', 'user-1', {
        provider: 'FLOOZ', phone: '+22890123456',
      });

      expect((result as any).status).toBe('PENDING');
      expect(result).toHaveProperty('providerRef');
    });

    it('should throw 404 if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        developerModules.purchaseModule('module-1', 'user-1', { provider: 'TMONEY', phone: '22901000001' })
      ).rejects.toThrow('Business non trouvé');
    });
  });

  describe('startTrial', () => {
    it('should start a 7-day trial successfully', async () => {
      (mockPrisma.developerModuleInstallation.create as jest.Mock).mockResolvedValue({
        id: 'inst-trial-1', moduleId: 'module-1', businessId: 'biz-1', status: 'TRIAL',
        installedAt: new Date(), settings: { isTrial: true, trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString() },
      });

      const result = await developerModules.startTrial('module-1', 'user-1');

      expect(result).toHaveProperty('success', true);
      expect(result.installation.status).toBe('TRIAL');
      expect(result.trialEndsAt).toBeDefined();
      expect(mockPrisma.developerModuleInstallation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'TRIAL', settings: expect.objectContaining({ isTrial: true }) }),
        })
      );
    });

    it('should throw 400 if module is free', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ ...mockModule, isFree: true, price: 0 });
      await expect(developerModules.startTrial('module-1', 'user-1')).rejects.toThrow('Ce module est gratuit');
    });

    it('should throw 400 if module has no price', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue({ ...mockModule, price: null });
      await expect(developerModules.startTrial('module-1', 'user-1')).rejects.toThrow('Ce module est gratuit');
    });

    it('should throw 409 if already installed', async () => {
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-install', status: 'TRIAL' });
      await expect(developerModules.startTrial('module-1', 'user-1')).rejects.toThrow('Module déjà installé');
    });

    it('should throw 404 if module does not exist', async () => {
      (mockPrisma.developerModule.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(developerModules.startTrial('module-inexistant', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('completeModulePurchase', () => {
    it('should create installation, license, and revenue', async () => {
      (mockPrisma.developerRevenue.create as jest.Mock).mockResolvedValue({ id: 'rev-1', amount: 25000 });

      const result = await developerModules.completeModulePurchase('module-1', 'user-1', 'biz-1', 25000);

      expect(result.success).toBe(true);
      expect(result.installation.status).toBe('ACTIVE');
      expect(result.license).toBeDefined();
      expect(mockPrisma.developerModuleInstallation.create).toHaveBeenCalled();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should fail gracefully if revenue creation fails', async () => {
      (mockPrisma.developerRevenue.create as jest.Mock).mockRejectedValue(new Error('Schema issue'));

      const result = await developerModules.completeModulePurchase('module-1', 'user-1', 'biz-1', 25000);

      expect(result.success).toBe(true);
    });
  });

  describe('confirmModulePayment', () => {
    it('should confirm a pending payment', async () => {
      (mockPrisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx-1', providerRef: 'TMONEY_123_ABC', userId: 'user-1', status: 'PENDING', amount: 25000,
        metadata: { moduleId: 'module-1' },
      });
      (mockPrisma.paymentTransaction.update as jest.Mock).mockResolvedValue({ id: 'tx-1', status: 'SUCCESS' });

      const result = await developerModules.confirmModulePayment('user-1', 'TMONEY_123_ABC');

      expect(result.success).toBe(true);
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCESS' }) })
      );
    });

    it('should throw 404 if transaction not found', async () => {
      (mockPrisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(developerModules.confirmModulePayment('user-1', 'INVALID_REF')).rejects.toThrow('Transaction non trouvée');
    });

    it('should throw 400 if already confirmed', async () => {
      (mockPrisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx-1', status: 'SUCCESS', providerRef: 'TMONEY_123_ABC', userId: 'user-1',
      });
      await expect(developerModules.confirmModulePayment('user-1', 'TMONEY_123_ABC')).rejects.toThrow('Transaction déjà confirmée');
    });

    it('should complete purchase when metadata has moduleId', async () => {
      (mockPrisma.paymentTransaction.findFirst as jest.Mock).mockResolvedValue({
        id: 'tx-1', providerRef: 'FLOOZ_456_DEF', userId: 'user-1', status: 'PENDING', amount: 25000,
        metadata: { moduleId: 'module-1' },
      });
      (mockPrisma.paymentTransaction.update as jest.Mock).mockResolvedValue({ id: 'tx-1', status: 'SUCCESS' });

      const result = await developerModules.confirmModulePayment('user-1', 'FLOOZ_456_DEF');

      expect(result).toHaveProperty('installation');
      expect(result.message).toContain('installé');
    });
  });
});
