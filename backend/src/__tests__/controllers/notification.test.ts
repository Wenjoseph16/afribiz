import { mockPrisma } from '../setup';
import * as notificationCtrl from '../../controllers/notification';

jest.mock('../../repositories/notificationRepository', () => ({
  notificationRepository: {
    findMany: jest.fn(),
    countUnread: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    markMultipleAsRead: jest.fn(),
    delete: jest.fn(),
    checkFailureRate: jest.fn(),
    exportCSV: jest.fn(),
  },
}));
jest.mock('../../repositories/notificationPreferenceRepository', () => ({
  notificationPreferenceRepository: {
    getPreferences: jest.fn(),
    bulkUpdate: jest.fn(),
    setDefaults: jest.fn(),
    addPushSubscription: jest.fn(),
    getPushSubscriptions: jest.fn(),
    removePushSubscription: jest.fn(),
  },
}));
jest.mock('../../lib/mail', () => ({
  sendEmail: jest.fn(),
  emailTemplates: { welcome: jest.fn(), passwordReset: jest.fn(), otp: jest.fn() },
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { notificationRepository } from '../../repositories/notificationRepository';
import { notificationPreferenceRepository } from '../../repositories/notificationPreferenceRepository';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, cookies: {}, ...overrides } as any;
}

describe('notification controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getNotifications', async () => {
    (notificationRepository.findMany as jest.Mock).mockResolvedValue({
      notifications: [],
      total: 0,
    });
    (notificationRepository.countUnread as jest.Mock).mockResolvedValue(0);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.getNotifications(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('markNotificationRead', async () => {
    (notificationRepository.markAsRead as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.markNotificationRead(req({ params: { id: 'n1' } }), res, next);
    await flush();
    expect(notificationRepository.markAsRead).toHaveBeenCalled();
  });

  it('markAllNotificationsRead', async () => {
    (notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.markAllNotificationsRead(req(), res, next);
    await flush();
    expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('u1');
  });

  it('deleteNotification', async () => {
    (notificationRepository.delete as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.deleteNotification(req({ params: { id: 'n1' } }), res, next);
    await flush();
    expect(notificationRepository.delete).toHaveBeenCalled();
  });

  it('getUnreadCount', async () => {
    (notificationRepository.countUnread as jest.Mock).mockResolvedValue(3);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.getUnreadCount(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getPreferences', async () => {
    (notificationPreferenceRepository.getPreferences as jest.Mock).mockResolvedValue({
      email: true,
    });
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.getPreferences(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('updatePreferences', async () => {
    (notificationPreferenceRepository.bulkUpdate as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.updatePreferences(
      req({ body: { preferences: [{ type: 'EMAIL', enabled: false }] } }),
      res,
      next
    );
    await flush();
    expect(notificationPreferenceRepository.bulkUpdate).toHaveBeenCalled();
  });

  it('should reject invalid preferences format', async () => {
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.updatePreferences(req({ body: { preferences: 'invalid' } }), res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('getNotificationAnalytics', async () => {
    const now = new Date();
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue([
      { id: 'n1', type: 'INFO', read: true, createdAt: now },
    ]);
    (mockPrisma.notification.count as jest.Mock).mockResolvedValue(1);
    (mockPrisma.notificationDelivery.groupBy as jest.Mock).mockResolvedValue([]);
    (mockPrisma.notificationDelivery.findMany as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    notificationCtrl.getNotificationAnalytics({} as any, res, next);
    await flush();
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
