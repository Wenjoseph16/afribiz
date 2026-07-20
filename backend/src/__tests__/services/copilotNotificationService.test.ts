import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../repositories/notificationRepository', () => ({
  notificationRepository: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
}));
jest.mock('../../services/businessCopilot', () => ({
  getBusinessHealth: jest.fn(),
  generateDailyTips: jest.fn(),
}));
import {
  generateAllCopilotNotifications,
  generateBusinessNotifications,
} from '../../services/copilotNotificationService';
import * as copilotService from '../../services/businessCopilot';

describe('copilotNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateAllCopilotNotifications processes businesses', async () => {
    jest
      .spyOn(mockPrisma.business, 'findMany')
      .mockResolvedValue([{ id: 'biz-1', name: 'Biz 1', ownerId: 'u1' }]);
    jest
      .spyOn(copilotService, 'getBusinessHealth')
      .mockResolvedValue({ status: 'good', healthScore: 85 });
    jest.spyOn(copilotService, 'generateDailyTips').mockResolvedValue({ tips: [] });
    const result = await generateAllCopilotNotifications(100);
    expect(result.total).toBe(1);
    expect(result.created).toBe(0);
  });

  test('generateBusinessNotifications creates notifications for critical health', async () => {
    jest
      .spyOn(copilotService, 'getBusinessHealth')
      .mockResolvedValue({ status: 'critical', healthScore: 30 });
    jest.spyOn(copilotService, 'generateDailyTips').mockResolvedValue({ tips: [] });
    const count = await generateBusinessNotifications('biz-1', 'u1', 'Biz 1');
    expect(count).toBe(1);
  });

  test('generateBusinessNotifications handles high priority tips', async () => {
    jest
      .spyOn(copilotService, 'getBusinessHealth')
      .mockResolvedValue({ status: 'good', healthScore: 85 });
    jest.spyOn(copilotService, 'generateDailyTips').mockResolvedValue({
      tips: [
        { priority: 'high', type: 'score', message: 'Improve your score', action: '/dashboard' },
      ],
    });
    const count = await generateBusinessNotifications('biz-1', 'u1', 'Biz 1');
    expect(count).toBe(1);
  });
});
