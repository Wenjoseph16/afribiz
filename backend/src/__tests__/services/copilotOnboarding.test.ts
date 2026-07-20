import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import {
  scheduleOnboardingSequence,
  sendPendingOnboardingSteps,
} from '../../services/copilotOnboarding';

describe('copilotOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scheduleOnboardingSequence creates steps', async () => {
    jest.spyOn(mockPrisma.copilotOnboardingLog, 'deleteMany').mockResolvedValue({ count: 0 });
    jest.spyOn(mockPrisma.copilotOnboardingLog, 'create').mockResolvedValue({ id: 'step-1' });
    await scheduleOnboardingSequence('biz-1', 'signup');
    expect(mockPrisma.copilotOnboardingLog.deleteMany).toHaveBeenCalledWith({
      where: { businessId: 'biz-1' },
    });
    expect(mockPrisma.copilotOnboardingLog.create).toHaveBeenCalled();
  });

  test('sendPendingOnboardingSteps sends pending steps', async () => {
    jest.spyOn(mockPrisma.copilotOnboardingLog, 'findMany').mockResolvedValue([
      {
        id: 'step-1',
        day: 0,
        title: 'Welcome',
        message: 'Hello',
        action: 'Go',
        actionLink: '/link',
        businessId: 'biz-1',
        status: 'PENDING',
        scheduledFor: new Date(),
        business: { ownerId: 'u1', name: 'Biz 1' },
      },
    ]);
    jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({ id: 'n1' });
    jest.spyOn(mockPrisma.copilotOnboardingLog, 'update').mockResolvedValue({ id: 'step-1' });
    const sent = await sendPendingOnboardingSteps();
    expect(sent).toBe(1);
  });
});
