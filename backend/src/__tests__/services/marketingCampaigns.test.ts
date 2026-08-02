import { mockPrisma } from '../setup';
import {
  sendBirthdayCampaigns,
  detectInactiveClients,
  getMarketingStats,
} from '../../services/marketingCampaigns';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishCampaignScheduled: jest.fn(),
  publishCampaignSent: jest.fn(),
  publishNewMessage: jest.fn(),
}));

describe('Marketing Campaigns Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendBirthdayCampaigns finds birthday clients', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'j@t.com', firstName: 'Jean', birthDate: new Date('1990-06-17') } as any,
    ]);
    mockPrisma.order.findMany.mockResolvedValue([{ businessId: 'biz-1' }] as any);
    mockPrisma.business.findMany.mockResolvedValue([{ id: 'biz-1', ownerId: 'owner-1' }] as any);
    mockPrisma.notification.create.mockResolvedValue({} as any);
    const r = await sendBirthdayCampaigns();
    expect(r).toBeDefined();
  });

  test('detectInactiveClients flags inactive', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { id: 'u1', firstName: 'Jean', email: 'j@t.com' } as any,
    ]);
    mockPrisma.order.findMany.mockResolvedValue([{ businessId: 'biz-1' }] as any);
    mockPrisma.business.findMany.mockResolvedValue([{ id: 'biz-1', ownerId: 'owner-1' }] as any);
    mockPrisma.notification.create.mockResolvedValue({} as any);
    const r = await detectInactiveClients(30);
    expect(r).toBeDefined();
    // Un événement CAMPAIGN_SENT est publié par business concerné
    const { publishCampaignSent } = require('../../events/publishers');
    expect(publishCampaignSent).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-1', campaignId: 'inactive-reactivation' })
    );
  });

  test('getMarketingStats returns stats', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'biz-1' } as any);
    mockPrisma.promotion.count.mockResolvedValue(5);
    mockPrisma.notification.count.mockResolvedValue(10);
    mockPrisma.user.count.mockResolvedValue(3);
    const r = await getMarketingStats('u1');
    expect(r).toBeDefined();
  });
});
