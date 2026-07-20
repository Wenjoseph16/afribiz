jest.mock('../../services/developerPermissions', () => ({
  getModulePermissions: jest.fn(),
  addModulePermission: jest.fn(),
  removeModulePermission: jest.fn(),
  checkModulePermissions: jest.fn(),
  getPermissionSummary: jest.fn(),
}));

jest.mock('../../services/developerLicenses', () => ({
  createLicense: jest.fn(),
  activateLicense: jest.fn(),
  revokeLicense: jest.fn(),
  renewLicense: jest.fn(),
  checkLicense: jest.fn(),
  getModuleLicenses: jest.fn(),
  getBusinessLicenses: jest.fn(),
  getLicenseStats: jest.fn(),
}));

jest.mock('../../services/developerApi', () => ({
  createApiKey: jest.fn(),
  getApiKeys: jest.fn(),
  revokeApiKey: jest.fn(),
  createWebhook: jest.fn(),
  getWebhooks: jest.fn(),
  deleteWebhook: jest.fn(),
  getWebhookDeliveries: jest.fn(),
}));

jest.mock('../../services/developerConfiguration', () => ({
  saveModuleConfiguration: jest.fn(),
  getModuleConfiguration: jest.fn(),
  toggleModuleActive: jest.fn(),
  getModuleConfigurations: jest.fn(),
  getBusinessModules: jest.fn(),
}));

jest.mock('../../services/developerAnalytics', () => ({
  trackAnalytics: jest.fn(),
  getModuleAnalytics: jest.fn(),
  logModuleError: jest.fn(),
  getModuleErrors: jest.fn(),
  resolveError: jest.fn(),
  getDeveloperAnalyticsOverview: jest.fn(),
}));

jest.mock('../../services/developerValidation', () => ({
  submitForValidation: jest.fn(),
  approveValidationCheck: jest.fn(),
  rejectValidationCheck: jest.fn(),
  completeValidation: jest.fn(),
  getModuleValidation: jest.fn(),
  getPendingValidations: jest.fn(),
  getValidationHistory: jest.fn(),
}));

jest.mock('../../services/developerActivityLog', () => ({
  logActivity: jest.fn(),
  getModuleActivity: jest.fn(),
  getDeveloperActivity: jest.fn(),
  getBusinessActivity: jest.fn(),
  getActivityStats: jest.fn(),
}));

jest.mock('../../services/copilotDevAnalytics', () => ({
  getDeveloperAnalytics: jest.fn(),
}));

jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: { findByUserId: jest.fn() },
}));

import * as ctrl from '../../controllers/developerModulesExtended';
import * as perms from '../../services/developerPermissions';
import * as licenses from '../../services/developerLicenses';
import * as api from '../../services/developerApi';
import * as config from '../../services/developerConfiguration';
import * as analytics from '../../services/developerAnalytics';
import * as validation from '../../services/developerValidation';
import * as activity from '../../services/developerActivityLog';
import { DeveloperRepository } from '../../repositories/developerRepository';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('developerModulesExtended controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('permissions', () => {
    it('getModulePermissions', async () => {
      (perms.getModulePermissions as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getModulePermissions(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
    });

    it('addModulePermission', async () => {
      (perms.addModulePermission as jest.Mock).mockResolvedValue({ id: 'p1' });
      const res = mockRes();
      ctrl.addModulePermission(
        req({ params: { id: 'm1' }, body: { permission: 'read' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('checkModulePermissions should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.checkModulePermissions(req({ params: { id: 'm1' }, query: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('licenses', () => {
    it('createLicense', async () => {
      (licenses.createLicense as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.createLicense(req({ body: { moduleId: 'm1', businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('activateLicense should return 400 if licenseKey missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.activateLicense(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('checkLicense should return 400 if params missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.checkLicense(req({ query: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('getLicenseStats', async () => {
      (DeveloperRepository.findByUserId as jest.Mock).mockResolvedValue({ id: 'dev1' });
      (licenses.getLicenseStats as jest.Mock).mockResolvedValue({ total: 5 });
      const res = mockRes();
      ctrl.getLicenseStats(req(), res, jest.fn());
      await flush();
      expect(licenses.getLicenseStats).toHaveBeenCalledWith('dev1');
    });
  });

  describe('API keys & webhooks', () => {
    it('createApiKey', async () => {
      (api.createApiKey as jest.Mock).mockResolvedValue({ key: 'xxx' });
      const res = mockRes();
      ctrl.createApiKey(req({ body: { name: 'My Key' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('getApiKeys', async () => {
      (api.getApiKeys as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getApiKeys(req(), res, jest.fn());
      await flush();
    });

    it('createWebhook', async () => {
      (api.createWebhook as jest.Mock).mockResolvedValue({ id: 'wh1' });
      const res = mockRes();
      ctrl.createWebhook(req({ body: { url: 'https://example.com' } }), res, jest.fn());
      await flush();
    });
  });

  describe('configuration', () => {
    it('saveModuleConfiguration should return 400 if missing fields', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.saveModuleConfiguration(req({ params: { id: 'm1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('saveModuleConfiguration should succeed', async () => {
      (config.saveModuleConfiguration as jest.Mock).mockResolvedValue({ id: 'c1' });
      const res = mockRes();
      ctrl.saveModuleConfiguration(
        req({
          params: { id: 'm1' },
          body: { businessId: 'b1', installationId: 'i1', settings: {} },
        }),
        res,
        jest.fn()
      );
      await flush();
    });

    it('getModuleConfiguration should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getModuleConfiguration(req({ params: { id: 'm1' }, query: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('validation', () => {
    it('submitForValidation', async () => {
      (validation.submitForValidation as jest.Mock).mockResolvedValue({ id: 'v1' });
      const res = mockRes();
      ctrl.submitForValidation(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('analytics', () => {
    it('trackAnalytics', async () => {
      (analytics.trackAnalytics as jest.Mock).mockResolvedValue({ id: 'a1' });
      const res = mockRes();
      ctrl.trackAnalytics(
        req({ params: { id: 'm1' }, body: { event: 'install' } }),
        res,
        jest.fn()
      );
      await flush();
    });

    it('getDeveloperCopilotCtrl', async () => {
      const { getDeveloperAnalytics } = require('../../services/copilotDevAnalytics');
      (getDeveloperAnalytics as jest.Mock).mockResolvedValue({ score: 85 });
      const res = mockRes();
      ctrl.getDeveloperCopilotCtrl(req(), res, jest.fn());
      await flush();
    });
  });

  describe('activity log', () => {
    it('logActivity', async () => {
      (activity.logActivity as jest.Mock).mockResolvedValue({ id: 'act1' });
      const res = mockRes();
      ctrl.logActivity(
        req({ params: { id: 'm1' }, body: { activityType: 'INSTALL' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('getDeveloperActivityFeed', async () => {
      (DeveloperRepository.findByUserId as jest.Mock).mockResolvedValue({ id: 'dev1' });
      (activity.getDeveloperActivity as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getDeveloperActivityFeed(req(), res, jest.fn());
      await flush();
      expect(activity.getDeveloperActivity).toHaveBeenCalledWith('dev1', 50);
    });

    it('getDeveloperActivityFeed should return 404 if no profile', async () => {
      (DeveloperRepository.findByUserId as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getDeveloperActivityFeed(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.addModulePermission({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
