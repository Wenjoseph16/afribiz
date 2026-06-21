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
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'n1', type: 'SYSTEM', title: 'Test', read: false, createdAt: new Date() },
    ]);
    mockPrisma.notification.count.mockResolvedValue(1);
    await (notificationController.getNotifications as any)(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          notifications: expect.arrayContaining([expect.objectContaining({ id: 'n1' })]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      })
    );
  });

  it('should handle empty notifications', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);
    await (notificationController.getNotifications as any)(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          notifications: [],
          pagination: expect.objectContaining({ total: 0 }),
        }),
      })
    );
  });
});

describe('Notification - getNotificationAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return analytics with all metrics', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'n1', type: 'SYSTEM', read: true, createdAt: new Date() },
    ]);
    mockPrisma.notification.count.mockResolvedValueOnce(100).mockResolvedValueOnce(40);
    mockPrisma.notificationDelivery.groupBy
      .mockResolvedValueOnce([
        { status: 'sent', _count: 80 },
        { status: 'failed', _count: 10 },
        { status: 'pending', _count: 10 },
      ])
      .mockResolvedValueOnce([
        { channel: 'IN_APP', _count: 60 },
        { channel: 'EMAIL', _count: 40 },
      ]);
    mockPrisma.notificationDelivery.findMany.mockResolvedValue([
      { channel: 'IN_APP', notification: { type: 'SYSTEM' } },
    ]);
    await (notificationController.getNotificationAnalytics as any)(req, res);
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
    mockPrisma.notification.findMany.mockResolvedValue([
      {
        id: 'n1',
        type: 'SYSTEM',
        title: 'Test',
        description: 'Desc',
        read: true,
        createdAt: new Date('2024-01-15'),
      },
    ]);
    await (notificationController.exportNotificationsCSV as any)(req, res);
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
    const deliveries = Array(100)
      .fill(null)
      .map((_, i) => ({ status: i < 15 ? 'failed' : 'sent' }));
    mockPrisma.notificationDelivery.findMany.mockResolvedValue(deliveries);
    mockPrisma.adminRoleAssignment.findMany.mockResolvedValue([{ userId: 'admin-1' }]);
    mockPrisma.notification.findFirst.mockResolvedValue(null);
    mockPrisma.notification.create.mockResolvedValue({ id: 'alert-1' });
    await (notificationController.checkNotificationFailureRate as any)(req, res);
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
    const deliveries = Array(100)
      .fill(null)
      .map((_, i) => ({ status: i < 3 ? 'failed' : 'sent' }));
    mockPrisma.notificationDelivery.findMany.mockResolvedValue(deliveries);
    await (notificationController.checkNotificationFailureRate as any)(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ rate: 3, alertSent: false }),
      })
    );
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });
});
