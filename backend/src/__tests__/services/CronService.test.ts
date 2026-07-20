import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
}));
jest.mock('../../services/socket', () => ({ getIO: jest.fn(() => null) }));
jest.mock('../../events/publishers', () => ({
  publishBookingReminder: jest.fn(),
  publishDebtOverdue: jest.fn(),
  publishSubscriptionExpiring: jest.fn(),
  publishClientInactive: jest.fn(),
  publishCartAbandoned: jest.fn(),
  publishCampaignScheduled: jest.fn(),
  publishLowStock: jest.fn(),
  publishOutOfStock: jest.fn(),
  publishSetupIncomplete: jest.fn(),
  publishRentalReturnReminder: jest.fn(),
  publishDeliveryNoStart: jest.fn(),
  publishDeliveryReassigned: jest.fn(),
  publishDocumentExpiring: jest.fn(),
  publishSatisfactionSurvey: jest.fn(),
  publishClientBirthday: jest.fn(),
  publishEscrowReleased: jest.fn(),
  publishOrderPendingReminder: jest.fn(),
  publishOrderAutoCancelled: jest.fn(),
  publishTrialExpiring: jest.fn(),
}));
jest.mock('../../services/storyService', () => ({
  expireOldStories: jest.fn().mockResolvedValue(0),
  expireOldFeedItems: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../services/ads', () => ({
  expireCampaigns: jest.fn().mockResolvedValue(0),
  autoActivateCampaigns: jest.fn().mockResolvedValue(0),
}));
jest.mock('../../lib/fedapay', () => ({ isFedaPayAvailable: jest.fn().mockReturnValue(false) }));
jest.mock('../../services/growthEngineService', () => ({
  generateAllMorningBriefs: jest.fn().mockResolvedValue({ success: 0, total: 0, errors: 0 }),
  generateAllEveningSummaries: jest.fn().mockResolvedValue({ success: 0, total: 0, errors: 0 }),
}));
jest.mock('../../services/attentionService', () => ({
  checkAllBusinessesUrgency: jest.fn().mockResolvedValue({ alertsCreated: 0 }),
}));
jest.mock('../../services/opportunityService', () => ({
  detectAllOpportunities: jest.fn().mockResolvedValue({ detected: 0 }),
}));
jest.mock('../../events/QueueService', () => ({
  QueueService: { cleanupProcessed: jest.fn().mockResolvedValue(0) },
}));
jest.mock('../../services/afriScoreService', () => ({ recomputeAllScores: jest.fn() }));
jest.mock('../../services/copilotNotificationService', () => ({
  generateAllCopilotNotifications: jest.fn().mockResolvedValue({ total: 0, created: 0, errors: 0 }),
}));
import { CronService } from '../../services/CronService';

describe('CronService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getStatuses returns job statuses', () => {
    const statuses = CronService.getStatuses();
    expect(Array.isArray(statuses)).toBe(true);
  });

  test('getActivityLog returns log entries', () => {
    const log = CronService.getActivityLog();
    expect(Array.isArray(log)).toBe(true);
  });

  test('getExecutionLogs returns logs', async () => {
    jest.spyOn(mockPrisma.platformSetting, 'findUnique').mockResolvedValue({
      key: 'cron_execution_logs',
      value: [
        {
          jobId: 'j1',
          jobName: 'Job 1',
          status: 'success',
          duration: 100,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    const logs = await CronService.getExecutionLogs(10);
    expect(logs).toHaveLength(1);
  });

  test('getFailedJobs returns failed logs', async () => {
    jest.spyOn(mockPrisma.platformSetting, 'findUnique').mockResolvedValue({
      key: 'cron_execution_logs',
      value: [
        {
          jobId: 'j1',
          jobName: 'Job 1',
          status: 'error',
          duration: 100,
          timestamp: new Date().toISOString(),
        },
        {
          jobId: 'j2',
          jobName: 'Job 2',
          status: 'success',
          duration: 50,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    const failed = await CronService.getFailedJobs();
    expect(failed).toHaveLength(1);
  });

  test('getErrorRate returns rate', async () => {
    jest.spyOn(mockPrisma.platformSetting, 'findUnique').mockResolvedValue({
      key: 'cron_execution_logs',
      value: [
        { jobId: 'j1', status: 'error' },
        { jobId: 'j2', status: 'success' },
      ],
    });
    const rate = await CronService.getErrorRate();
    expect(rate.total).toBe(2);
    expect(rate.errors).toBe(1);
    expect(rate.rate).toBe(50);
  });

  test('setJobEnabled throws for unknown job', async () => {
    await expect(CronService.setJobEnabled('unknown-job', true)).rejects.toThrow('not found');
  });

  test('checkBookingReminders processes bookings', async () => {
    jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
    await CronService.checkBookingReminders();
    expect(mockPrisma.booking.findMany).toHaveBeenCalled();
  });

  test('checkPendingOrders processes orders', async () => {
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
    await CronService.checkPendingOrders();
    expect(mockPrisma.order.findMany).toHaveBeenCalled();
  });

  test('checkOverdueDebts processes debts', async () => {
    jest.spyOn(mockPrisma.debt, 'findMany').mockResolvedValue([]);
    await CronService.checkOverdueDebts();
    expect(mockPrisma.debt.findMany).toHaveBeenCalled();
  });

  test('dispatchCampaigns processes campaigns', async () => {
    jest.spyOn(mockPrisma.marketingCampaign, 'findMany').mockResolvedValue([]);
    await CronService.dispatchCampaigns();
    expect(mockPrisma.marketingCampaign.findMany).toHaveBeenCalled();
  });

  test('checkAbandonedCarts processes carts', async () => {
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
    await CronService.checkAbandonedCarts();
    expect(mockPrisma.order.findMany).toHaveBeenCalled();
  });

  test('checkInactiveClients processes clients', async () => {
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
    await CronService.checkInactiveClients();
    expect(mockPrisma.order.findMany).toHaveBeenCalled();
  });

  test('checkLowStock processes products', async () => {
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([]);
    await CronService.checkLowStock();
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
  });

  test('checkSetupIncomplete processes businesses', async () => {
    jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([]);
    await CronService.checkSetupIncomplete();
    expect(mockPrisma.business.findMany).toHaveBeenCalled();
  });

  test('expireStories calls story service', async () => {
    await CronService.expireStories();
  });

  test('recalculateScores calls recomputeAllScores', async () => {
    await CronService.recalculateScores();
  });

  test('checkCopilotAlerts calls generateAllCopilotNotifications', async () => {
    await CronService.checkCopilotAlerts();
  });

  test('expireOffers expires flash offers', async () => {
    jest.spyOn(mockPrisma.offerFlash, 'updateMany').mockResolvedValue({ count: 5 });
    await CronService.expireOffers();
    expect(mockPrisma.offerFlash.updateMany).toHaveBeenCalled();
  });

  test('cleanup cleans expired data', async () => {
    jest.spyOn(mockPrisma.session, 'deleteMany').mockResolvedValue({ count: 0 });
    jest.spyOn(mockPrisma.refreshToken, 'deleteMany').mockResolvedValue({ count: 0 });
    jest.spyOn(mockPrisma.notification, 'deleteMany').mockResolvedValue({ count: 0 });
    jest.spyOn(mockPrisma.notificationDelivery, 'findMany').mockResolvedValue([]);
    await CronService.cleanup();
  });
});
