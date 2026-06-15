import { mockPrisma } from '../setup';
import * as adsService from '../../services/ads';
import { AppError } from '../../middlewares/errorHandler';

const mockBusiness = { id: 'biz-1', name: 'Test Business', slug: 'test-biz', logo: null, ownerId: 'user-1' };

const mockCampaign = {
  id: 'camp-1',
  name: 'Campagne Test',
  status: 'PENDING',
  advertiserType: 'BUSINESS',
  businessId: 'biz-1',
  developerId: null,
  budget: null,
  packageId: null,
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  description: null,
  objective: 'PROMOTION',
  companyName: null,
  responsibleName: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  country: null,
  city: null,
  geoTarget: [],
  validatedAt: null,
  validatedBy: null,
  rejectionReason: null,
  activatedAt: null,
  completedAt: null,
  suspendedAt: null,
  suspendReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  package: null,
  creatives: [],
  invoice: null,
  business: mockBusiness,
  _count: { impressions: 0, clicks: 0, conversions: 0 },
};

const mockPackage = {
  id: 'pkg-1',
  name: 'Standard',
  slug: 'standard',
  description: null,
  advertiserType: 'BUSINESS',
  placements: ['MARKETPLACE'],
  durationHours: 48,
  price: 5000,
  currency: 'FCFA',
  isActive: true,
};

describe('AdsService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getActiveAdCreatives', () => {
    it('should return shuffled active creatives filtered by page', async () => {
      const mockCreative = { id: 'cr-1', campaignId: 'camp-1', placementPage: 'MARKETPLACE', isActive: true, campaign: { status: 'ACTIVE', business: mockBusiness } };
      (mockPrisma.adCreative.findMany as jest.Mock).mockResolvedValue([mockCreative]);

      const result = await adsService.getActiveAdCreatives('MARKETPLACE');

      expect(result).toHaveLength(1);
      expect(mockPrisma.adCreative.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            campaign: { status: 'ACTIVE' },
            placementPage: 'MARKETPLACE',
          }),
        })
      );
    });

    it('should return empty array when no active creatives', async () => {
      (mockPrisma.adCreative.findMany as jest.Mock).mockResolvedValue([]);
      const result = await adsService.getActiveAdCreatives('HOMEPAGE');
      expect(result).toHaveLength(0);
    });
  });

  describe('createAdCampaign', () => {
    it('should create a campaign with creatives for BUSINESS', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.adCampaign.create as jest.Mock).mockResolvedValue({ ...mockCampaign, creatives: [{}] });

      const result = await adsService.createAdCampaign('user-1', {
        advertiserType: 'BUSINESS',
        businessId: 'biz-1',
        name: 'New Campaign',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        creatives: [{
          placementPage: 'MARKETPLACE', placementPosition: 'BANNER', format: 'BANNER_HORIZONTAL',
          mainImage: 'img.jpg', adText: 'Test ad', destinationUrl: 'https://example.com', cta: 'Acheter',
        }],
      });

      expect(result).toHaveProperty('creatives');
      expect(mockPrisma.adCampaign.create).toHaveBeenCalled();
    });

    it('should reject creation without businessId for BUSINESS type', async () => {
      await expect(
        adsService.createAdCampaign('user-1', { advertiserType: 'BUSINESS' })
      ).rejects.toThrow(AppError);
    });

    it('should reject creation with invalid advertiser type', async () => {
      await expect(
        adsService.createAdCampaign('user-1', { advertiserType: 'INVALID' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getAdCampaignById', () => {
    it('should return campaign by id with relations', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await adsService.getAdCampaignById('camp-1');
      expect(result.id).toBe('camp-1');
    });

    it('should throw 404 if not found', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(adsService.getAdCampaignById('nonexistent')).rejects.toThrow(AppError);
    });
  });

  describe('validateAdCampaign', () => {
    it('should validate and set status to ACTIVE if startDate is past', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PENDING', startDate: new Date(Date.now() - 1000) });
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      const result = await adsService.validateAdCampaign('camp-1', 'admin-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should validate and set status to SCHEDULED if startDate is future', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PENDING', startDate: new Date(Date.now() + 86400000) });
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'SCHEDULED' });

      const result = await adsService.validateAdCampaign('camp-1', 'admin-1');
      expect(result.status).toBe('SCHEDULED');
    });

    it('should reject validation if not PENDING', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });
      await expect(adsService.validateAdCampaign('camp-1', 'admin-1')).rejects.toThrow(AppError);
    });
  });

  describe('rejectAdCampaign', () => {
    it('should reject with reason', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'REJECTED' });

      const result = await adsService.rejectAdCampaign('camp-1', 'Contenu inapproprié');
      expect(result.status).toBe('REJECTED');
    });

    it('should require reason for rejection', async () => {
      await expect(adsService.rejectAdCampaign('camp-1', '')).rejects.toThrow(AppError);
    });
  });

  describe('suspendAdCampaign', () => {
    it('should suspend with reason', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'SUSPENDED' });

      const result = await adsService.suspendAdCampaign('camp-1', 'Violation des règles');
      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('pauseAdCampaign', () => {
    it('should pause an active campaign', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE', business: { ownerId: 'user-1' } });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'user-1' });
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PAUSED' });

      const result = await adsService.pauseAdCampaign('camp-1', 'user-1');
      expect(result.status).toBe('PAUSED');
    });

    it('should reject pause if not owner', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE', business: { ownerId: 'user-1' } });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'other-user' });

      await expect(adsService.pauseAdCampaign('camp-1', 'user-1')).rejects.toThrow(AppError);
    });

    it('should reject pause if not ACTIVE', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PENDING' });
      await expect(adsService.pauseAdCampaign('camp-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('resumeAdCampaign', () => {
    it('should resume a paused campaign', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PAUSED' });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'user-1' });
      (mockPrisma.adCampaign.update as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      const result = await adsService.resumeAdCampaign('camp-1', 'user-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should reject resume if not PAUSED', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });
      await expect(adsService.resumeAdCampaign('camp-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('deleteAdCampaign', () => {
    it('should delete a deletable campaign', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'PENDING' });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ ownerId: 'user-1' });
      (mockPrisma.adCampaign.delete as jest.Mock).mockResolvedValue({});

      await expect(adsService.deleteAdCampaign('camp-1', 'user-1')).resolves.toBeUndefined();
    });

    it('should reject delete for ACTIVE campaign', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });
      await expect(adsService.deleteAdCampaign('camp-1', 'user-1')).rejects.toThrow(AppError);
    });
  });

  describe('trackImpression', () => {
    it('should create impression record', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adImpression.create as jest.Mock).mockResolvedValue({ id: 'imp-1' });

      await adsService.trackImpression('camp-1', { creativeId: 'cr-1', page: 'marketplace', position: 'banner' });
      expect(mockPrisma.adImpression.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignId: 'camp-1', creativeId: 'cr-1',
          }),
        })
      );
    });

    it('should throw 404 if campaign not found', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(adsService.trackImpression('nonexistent', {})).rejects.toThrow(AppError);
    });
  });

  describe('trackClick', () => {
    it('should create click record and increment creative clicks', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adClick.create as jest.Mock).mockResolvedValue({ id: 'clk-1' });
      (mockPrisma.adCreative.update as jest.Mock).mockResolvedValue({});

      await adsService.trackClick('camp-1', { creativeId: 'cr-1', page: 'marketplace' });
      expect(mockPrisma.adClick.create).toHaveBeenCalled();
      expect(mockPrisma.adCreative.update).toHaveBeenCalled();
    });
  });

  describe('generateInvoice', () => {
    it('should generate invoice from campaign budget', async () => {
      const campaignWithBudget = { ...mockCampaign, budget: { toNumber: () => 15000 }, package: null, invoice: null };
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(campaignWithBudget);
      (mockPrisma.adInvoice.create as jest.Mock).mockResolvedValue({ id: 'inv-1', number: 'INV-ADS-...', amount: 15000, currency: 'FCFA', status: 'PENDING' });

      const result = await adsService.generateInvoice('camp-1');
      expect(result).toHaveProperty('id');
      expect(mockPrisma.adInvoice.create).toHaveBeenCalled();
    });

    it('should generate invoice from package price if no budget', async () => {
      const campaignWithPackage = { ...mockCampaign, budget: null, package: { price: { toNumber: () => 5000 }, durationHours: 48, name: 'Standard' }, invoice: null };
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(campaignWithPackage);
      (mockPrisma.adInvoice.create as jest.Mock).mockResolvedValue({ id: 'inv-2', amount: 5000 });

      const result = await adsService.generateInvoice('camp-1');
      expect(result).toHaveProperty('id');
    });

    it('should throw if invoice already exists', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({ ...mockCampaign, invoice: { id: 'existing' } });
      await expect(adsService.generateInvoice('camp-1')).rejects.toThrow(AppError);
    });

    it('should throw 404 if campaign not found', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(adsService.generateInvoice('camp-1')).rejects.toThrow(AppError);
    });
  });

  describe('getAdStats', () => {
    it('should return computed stats', async () => {
      (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign, budget: { toNumber: () => 50000 },
        _count: { impressions: 1000, clicks: 50, conversions: 5 },
      });
      (mockPrisma.adImpression.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: { toNumber: () => 10000 } } });
      (mockPrisma.adClick.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: { toNumber: () => 5000 } } });

      const stats = await adsService.getAdStats('camp-1');
      expect(stats.impressions).toBe(1000);
      expect(stats.clicks).toBe(50);
      expect(stats.ctr).toBe(5);
      expect(stats.totalSpend).toBe(15000);
    });
  });

  describe('getAdRevenue', () => {
    it('should return revenue aggregation', async () => {
      (mockPrisma.adInvoice.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: { toNumber: () => 100000 } } });
      (mockPrisma.adInvoice.findMany as jest.Mock).mockResolvedValue([
        { amount: { toNumber: () => 50000 }, status: 'PENDING', issuedAt: new Date() },
      ]);
      (mockPrisma.adImpression.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: { toNumber: () => 20000 } } });
      (mockPrisma.adClick.aggregate as jest.Mock).mockResolvedValue({ _sum: { cost: { toNumber: () => 10000 } } });

      const revenue = await adsService.getAdRevenue();
      expect(revenue.totalRevenue).toBe(100000);
      expect(revenue.pendingInvoices).toBe(50000);
      expect(revenue.totalAdSpend).toBe(30000);
    });
  });

  describe('expireCampaigns', () => {
    it('should mark expired campaigns as COMPLETED', async () => {
      (mockPrisma.adCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const count = await adsService.expireCampaigns();
      expect(count).toBe(3);
      expect(mockPrisma.adCampaign.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE', endDate: { lt: expect.any(Date) } },
          data: { status: 'COMPLETED', completedAt: expect.any(Date) },
        })
      );
    });
  });

  describe('autoActivateCampaigns', () => {
    it('should activate SCHEDULED campaigns whose startDate has passed', async () => {
      (mockPrisma.adCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const count = await adsService.autoActivateCampaigns();
      expect(count).toBe(2);
    });
  });

  describe('getAdPackages', () => {
    it('should return active packages', async () => {
      (mockPrisma.adPackage.findMany as jest.Mock).mockResolvedValue([mockPackage]);
      const pkgs = await adsService.getAdPackages();
      expect(pkgs).toHaveLength(1);
    });
  });

  describe('createAdPackage', () => {
    it('should create package', async () => {
      (mockPrisma.adPackage.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adPackage.create as jest.Mock).mockResolvedValue(mockPackage);

      const result = await adsService.createAdPackage({ name: 'Standard', slug: 'standard', price: 5000 });
      expect(result.slug).toBe('standard');
    });

    it('should reject duplicate slug', async () => {
      (mockPrisma.adPackage.findUnique as jest.Mock).mockResolvedValue(mockPackage);
      await expect(adsService.createAdPackage({ name: 'Standard', slug: 'standard' })).rejects.toThrow(AppError);
    });
  });

  describe('getAdCampaignsForBusiness', () => {
    it('should return all campaigns for a business', async () => {
      (mockPrisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);
      const campaigns = await adsService.getAdCampaignsForBusiness('biz-1');
      expect(campaigns).toHaveLength(1);
    });
  });

  describe('getAllAdCampaigns', () => {
    it('should return paginated campaigns', async () => {
      (mockPrisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);
      (mockPrisma.adCampaign.count as jest.Mock).mockResolvedValue(1);

      const result = await adsService.getAllAdCampaigns({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getMyCampaigns', () => {
    it('should return campaigns for BUSINESS role', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.adCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);

      const result = await adsService.getMyCampaigns('user-1', 'BUSINESS');
      expect(result).toHaveLength(1);
    });

    it('should return empty if no business found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await adsService.getMyCampaigns('user-1', 'BUSINESS');
      expect(result).toEqual([]);
    });
  });

  describe('getAdvertiserStats', () => {
    it('should return aggregated stats for BUSINESS', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.adCampaign.findMany as jest.Mock).mockResolvedValue([
        { ...mockCampaign, status: 'ACTIVE', budget: { toNumber: () => 50000 }, _count: { impressions: 500, clicks: 25, conversions: 2 } },
        { ...mockCampaign, id: 'camp-2', status: 'COMPLETED', budget: { toNumber: () => 30000 }, _count: { impressions: 300, clicks: 10, conversions: 1 } },
      ]);

      const stats = await adsService.getAdvertiserStats('user-1', 'BUSINESS');
      expect(stats.totalCampaigns).toBe(2);
      expect(stats.activeCampaigns).toBe(1);
      expect(stats.totalImpressions).toBe(800);
      expect(stats.totalBudget).toBe(80000);
    });
  });
});
