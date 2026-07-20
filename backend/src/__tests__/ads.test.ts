/**
 * Tests pour le module Publicité (Ads)
 */

import { mockPrisma } from './setup';
import * as adsService from '../services/ads';

describe('Ads - Campaign Management', () => {
  const mockCampaign = {
    id: 'camp-1',
    name: 'Campagne Test',
    advertiserType: 'BUSINESS',
    businessId: 'biz-1',
    status: 'PENDING',
    objective: 'BRAND_AWARENESS',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    geoTarget: ['Togo'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createAdCampaign: creates with valid data', async () => {
    (mockPrisma.adCampaign.create as jest.Mock).mockResolvedValue(mockCampaign);
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
      id: 'biz-1',
      ownerId: 'user-1',
    });

    const data = {
      name: 'Campagne Test',
      advertiserType: 'BUSINESS',
      businessId: 'biz-1',
      objective: 'BRAND_AWARENESS',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      geoTarget: ['Togo'],
      creatives: [
        {
          placementPage: 'HOMEPAGE',
          placementPosition: 'TOP_BANNER',
          format: 'BANNER_HORIZONTAL',
          adText: 'Texte pub',
          destinationUrl: 'https://example.com',
        },
      ],
    };

    const result = await adsService.createAdCampaign('user-1', data);
    expect(result).toBeDefined();
    expect(mockPrisma.adCampaign.create).toHaveBeenCalled();
  });

  test('getActiveAdCreatives: returns active creatives', async () => {
    const mockCreatives = [
      {
        id: 'creative-1',
        campaignId: 'camp-1',
        placementPage: 'MARKETPLACE',
        placementPosition: 'TOP_BANNER',
        format: 'BANNER_HORIZONTAL',
        mainImage: 'https://example.com/img.jpg',
        adText: 'Texte pub',
        destinationUrl: 'https://example.com',
        cta: 'Découvrir',
        isActive: true,
        campaign: { id: 'camp-1', name: 'Campagne Test', status: 'ACTIVE' },
      },
    ];
    (mockPrisma.adCreative.findMany as jest.Mock).mockResolvedValue(mockCreatives);

    const result = await adsService.getActiveAdCreatives('MARKETPLACE', 'TOP_BANNER');
    expect(result).toHaveLength(1);
    expect(result[0].adText).toBe('Texte pub');
    expect(result[0].mainImage).toBe('https://example.com/img.jpg');
  });

  test('getActiveAdCreatives: uses correct field names', async () => {
    const mockCreatives = [
      {
        id: 'creative-2',
        campaignId: 'camp-2',
        adText: 'Promo spéciale', // Must be adText not headline
        mainImage: '/img.jpg', // Must be mainImage not mediaUrl
        destinationUrl: '/page', // Must be destinationUrl not ctaUrl
        cta: 'Acheter', // Must be cta not ctaText
        isActive: true,
        campaign: { id: 'camp-2', name: 'Campagne 2', status: 'ACTIVE' },
      },
    ];
    (mockPrisma.adCreative.findMany as jest.Mock).mockResolvedValue(mockCreatives);

    const result = await adsService.getActiveAdCreatives('MARKETPLACE', 'TOP_BANNER');
    expect(result[0]).toHaveProperty('adText');
    expect(result[0]).toHaveProperty('mainImage');
    expect(result[0]).toHaveProperty('destinationUrl');
    expect(result[0]).toHaveProperty('cta');
    expect(result[0]).not.toHaveProperty('headline');
    expect(result[0]).not.toHaveProperty('mediaUrl');
    expect(result[0]).not.toHaveProperty('ctaUrl');
  });

  test('generateInvoice: creates invoice for campaign', async () => {
    (mockPrisma.adCampaign.findUnique as jest.Mock).mockResolvedValue({
      ...mockCampaign,
      packageId: 'pkg-1',
    });
    (mockPrisma.adPackage.findUnique as jest.Mock).mockResolvedValue({
      id: 'pkg-1',
      name: 'Package Standard',
      price: 50000,
      currency: 'FCFA',
    });
    (mockPrisma.adInvoice.create as jest.Mock).mockResolvedValue({
      id: 'inv-1',
      campaignId: 'camp-1',
      amount: 50000,
      currency: 'FCFA',
      status: 'PENDING',
    });

    const result = await adsService.generateInvoice('camp-1');
    expect(result).toBeDefined();
    expect(mockPrisma.adInvoice.create).toHaveBeenCalled();
  });
});
