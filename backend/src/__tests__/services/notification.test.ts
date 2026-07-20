// Helper: flush les microtasks après avoir appelé un controller catchAsyncErrors
async function flushMicrotasks() {
  await new Promise<void>(process.nextTick);
}

import { mockPrisma } from '../setup';

jest.mock('../../lib/mail', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));
import * as notificationController from '../../controllers/notification';

const mockResponse = () => {
  const res: any = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (overrides: any = {}) => ({
  user: { id: 'test-user-id', ...overrides.user },
  query: {},
  params: {},
  body: {},
  ...overrides,
});

describe('Notification - getNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated notifications', async () => {
    const req = mockRequest({ query: { page: '1', limit: '20' } });
    const res = mockResponse();
    jest
      .spyOn(mockPrisma.notification, 'findMany')
      .mockResolvedValue([
        { id: 'n1', type: 'SYSTEM', title: 'Test', read: false, createdAt: new Date() },
      ]);
    jest.spyOn(mockPrisma.notification, 'count').mockResolvedValue(1);
    (notificationController.getNotifications as any)(req, res);
    await flushMicrotasks();
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle empty notifications', async () => {
    const req = mockRequest();
    const res = mockResponse();
    jest.spyOn(mockPrisma.notification, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.notification, 'count').mockResolvedValue(0);
    (notificationController.getNotifications as any)(req, res);
    await flushMicrotasks();
    expect(res.json).toHaveBeenCalled();
  });
});

describe('Notification - getNotificationAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return analytics with all metrics', async () => {
    const req = mockRequest();
    const res = mockResponse();

    const countSpy = jest.spyOn(mockPrisma.notification, 'count');
    countSpy.mockResolvedValueOnce(100).mockResolvedValueOnce(40);
    jest
      .spyOn(mockPrisma.notification, 'findMany')
      .mockResolvedValue([{ id: 'n1', type: 'SYSTEM', read: true, createdAt: new Date() }]);

    const deliveryGroupBySpy = jest.spyOn(mockPrisma.notificationDelivery, 'groupBy');
    deliveryGroupBySpy
      .mockResolvedValueOnce([
        { status: 'sent', _count: 80 },
        { status: 'failed', _count: 10 },
        { status: 'pending', _count: 10 },
      ])
      .mockResolvedValueOnce([
        { channel: 'IN_APP', _count: 60 },
        { channel: 'EMAIL', _count: 40 },
      ]);
    jest
      .spyOn(mockPrisma.notificationDelivery, 'findMany')
      .mockResolvedValue([
        { channel: 'IN_APP', notification: { type: 'SYSTEM' }, createdAt: new Date() },
      ]);

    (notificationController.getNotificationAnalytics as any)(req, res);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          summary: expect.objectContaining({ total: 100, read: 40 }),
          volumeByDay: expect.any(Array),
          typeDistribution: expect.any(Array),
          deliveryStats: expect.objectContaining({ sent: 80, failed: 10 }),
          totalByChannel: expect.any(Array),
          failureRateByDay: expect.any(Array),
        }),
      })
    );
  });
});

describe('Notification - exportNotificationsCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSV with BOM and headers', async () => {
    const req = mockRequest();
    const res = mockResponse();
    jest.spyOn(mockPrisma.notification, 'findMany').mockResolvedValue([
      {
        id: 'n1',
        type: 'SYSTEM',
        title: 'Test',
        description: 'Desc',
        read: true,
        createdAt: new Date('2024-01-15'),
      },
    ]);
    (notificationController.exportNotificationsCSV as any)(req, res);
    await flushMicrotasks();
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="notifications-export.csv"'
    );
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('\uFEFF'));
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('ID;Type;Titre;Description;Lue;Date')
    );
  });
});

describe('Notification - checkNotificationFailureRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create alert when rate exceeds threshold', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const now = new Date();
    const deliveries = Array(100)
      .fill(null)
      .map((_, i) => ({
        status: i < 15 ? 'failed' : 'sent',
        createdAt: new Date(now.getTime() - i * 3600000),
      }));

    jest.spyOn(mockPrisma.notificationDelivery, 'findMany').mockResolvedValue(deliveries);
    jest
      .spyOn(mockPrisma.adminRoleAssignment, 'findMany')
      .mockResolvedValue([{ userId: 'admin-1' }]);
    jest.spyOn(mockPrisma.notification, 'findFirst').mockResolvedValue(null);
    jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({ id: 'alert-1' });

    (notificationController.checkNotificationFailureRate as any)(req, res);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ rate: 15, alertSent: true }),
      })
    );
  });

  it('should NOT create alert when below threshold', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const now = new Date();
    const deliveries = Array(100)
      .fill(null)
      .map((_, i) => ({
        status: i < 3 ? 'failed' : 'sent',
        createdAt: new Date(now.getTime() - i * 3600000),
      }));

    jest.spyOn(mockPrisma.notificationDelivery, 'findMany').mockResolvedValue(deliveries);
    jest.spyOn(mockPrisma.adminRoleAssignment, 'findMany').mockResolvedValue([]);

    (notificationController.checkNotificationFailureRate as any)(req, res);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ rate: 3, alertSent: false }),
      })
    );
  });
});
