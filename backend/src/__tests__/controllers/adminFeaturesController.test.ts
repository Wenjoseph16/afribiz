import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/adminFeaturesController';

// ── Mock all service modules ──────────────────────────────────────────────────

jest.mock('../../services/adminFeaturesService', () => ({
  getPlatformSettings: jest.fn(),
  updatePlatformSettings: jest.fn(),
  getPlatformSettingsByCategory: jest.fn(),
  getFeatureFlags: jest.fn(),
  getFeatureFlag: jest.fn(),
  createFeatureFlag: jest.fn(),
  updateFeatureFlag: jest.fn(),
  deleteFeatureFlag: jest.fn(),
  toggleFeatureFlag: jest.fn(),
  getAdminRoles: jest.fn(),
  createAdminRole: jest.fn(),
  updateAdminRole: jest.fn(),
  deleteAdminRole: jest.fn(),
  getAdminPermissions: jest.fn(),
  assignRoleToUser: jest.fn(),
  removeRoleFromUser: jest.fn(),
  getUserRoles: jest.fn(),
  getAdminUsers: jest.fn(),
  getAutomationRules: jest.fn(),
  getAutomationRule: jest.fn(),
  createAutomationRule: jest.fn(),
  updateAutomationRule: jest.fn(),
  deleteAutomationRule: jest.fn(),
  toggleAutomationRule: jest.fn(),
  getAutomationExecutionLogs: jest.fn(),
  getAutomationTriggers: jest.fn(),
  getAutomationActionTypes: jest.fn(),
  getCmsPages: jest.fn(),
  getCmsPage: jest.fn(),
  createCmsPage: jest.fn(),
  updateCmsPage: jest.fn(),
  deleteCmsPage: jest.fn(),
  publishCmsPage: jest.fn(),
  getCmsCategories: jest.fn(),
  createCmsCategory: jest.fn(),
  updateCmsCategory: jest.fn(),
  deleteCmsCategory: jest.fn(),
  getFormTemplates: jest.fn(),
  getFormTemplate: jest.fn(),
  createFormTemplate: jest.fn(),
  updateFormTemplate: jest.fn(),
  deleteFormTemplate: jest.fn(),
  activateFormTemplate: jest.fn(),
  getFormSubmissions: jest.fn(),
  getFormSubmission: jest.fn(),
  getNotificationTemplates: jest.fn(),
  getNotificationTemplate: jest.fn(),
  createNotificationTemplate: jest.fn(),
  updateNotificationTemplate: jest.fn(),
  deleteNotificationTemplate: jest.fn(),
  getNotificationTypes: jest.fn(),
  getNotificationChannels: jest.fn(),
  getPlatformCopilotConfig: jest.fn(),
  updatePlatformCopilotConfig: jest.fn(),
  getBusinessCopilotConfig: jest.fn(),
  updateBusinessCopilotConfig: jest.fn(),
  getMediaModerationItems: jest.fn(),
  getMediaModerationItem: jest.fn(),
  reportMedia: jest.fn(),
  approveMedia: jest.fn(),
  rejectMedia: jest.fn(),
  flagMedia: jest.fn(),
  getModerationStats: jest.fn(),
  getCommissionConfigs: jest.fn(),
  getCommissionConfig: jest.fn(),
  createCommissionConfig: jest.fn(),
  updateCommissionConfig: jest.fn(),
  deleteCommissionConfig: jest.fn(),
  getUserWarnings: jest.fn(),
  issueWarning: jest.fn(),
  revokeWarning: jest.fn(),
  getAllWarnings: jest.fn(),
  getAllSubscriptionPlans: jest.fn(),
  getSubscriptionPlan: jest.fn(),
  createSubscriptionPlan: jest.fn(),
  updateSubscriptionPlan: jest.fn(),
  deleteSubscriptionPlan: jest.fn(),
  addPlanPrivilege: jest.fn(),
  updatePlanPrivilege: jest.fn(),
  removePlanPrivilege: jest.fn(),
  getBackups: jest.fn(),
  createBackup: jest.fn(),
  restoreBackup: jest.fn(),
  getBackupDownloadUrl: jest.fn(),
  toggleAutoBackup: jest.fn(),
  recomputeAllAfriScores: jest.fn(),
  updateAfriScoreRules: jest.fn(),
}));

jest.mock('../../services/platformSettingsService', () => ({
  getVerificationSettings: jest.fn(),
  updateVerificationSettings: jest.fn(),
}));

jest.mock('../../services/contentReportService', () => ({
  createReport: jest.fn(),
}));

jest.mock('../../services/platformRevenueStats', () => ({
  getPlatformRevenueStats: jest.fn(),
}));

jest.mock('../../services/monetizationAudit', () => ({
  logMonetizationChanges: jest.fn(),
  getMonetizationAuditLogs: jest.fn(),
}));

jest.mock('../../services/copilotPlatformHealth', () => ({
  getPlatformHealth: jest.fn(),
}));

// ── Import mock references ────────────────────────────────────────────────────

const adminFeaturesService = jest.requireMock('../../services/adminFeaturesService');
const platformSettingsService = jest.requireMock('../../services/platformSettingsService');
const contentReportService = jest.requireMock('../../services/contentReportService');
const { getPlatformRevenueStats } = jest.requireMock('../../services/platformRevenueStats');
const { logMonetizationChanges, getMonetizationAuditLogs } = jest.requireMock(
  '../../services/monetizationAudit'
);
const { getPlatformHealth } = jest.requireMock('../../services/copilotPlatformHealth');

// ── Helpers ───────────────────────────────────────────────────────────────────

function flush() {
  return new Promise((r) => setImmediate(r));
}

function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

describe('getPlatformSettings', () => {
  it('should return platform settings', async () => {
    const data = { siteName: 'Afribiz' };
    adminFeaturesService.getPlatformSettings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getPlatformSettings(req(), res, next);
    await flush();
    expect(adminFeaturesService.getPlatformSettings).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updatePlatformSettings', () => {
  it('should update settings and log monetization changes', async () => {
    const oldSettings = { transactionCommissionRate: '0.1', currency: 'XOF' };
    const newSettings = { transactionCommissionRate: '0.15', currency: 'XOF' };
    adminFeaturesService.getPlatformSettings.mockResolvedValue(oldSettings);
    adminFeaturesService.updatePlatformSettings.mockResolvedValue(newSettings);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updatePlatformSettings(
      req({
        body: { transactionCommissionRate: '0.15', currency: 'XOF' },
      }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.updatePlatformSettings).toHaveBeenCalledWith(
      {
        transactionCommissionRate: '0.15',
        currency: 'XOF',
      },
      'u1'
    );
    expect(logMonetizationChanges).toHaveBeenCalledWith(
      [
        { key: 'transactionCommissionRate', oldValue: '0.1', newValue: '0.15' },
        { key: 'currency', oldValue: 'XOF', newValue: 'XOF' },
      ],
      'u1',
      'admin_settings_page'
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: newSettings,
      message: 'Paramètres mis à jour',
    });
  });

  it('should not log changes if none are monetization keys', async () => {
    adminFeaturesService.getPlatformSettings.mockResolvedValue({});
    adminFeaturesService.updatePlatformSettings.mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.updatePlatformSettings(req({ body: { siteName: 'Afribiz' } }), res, next);
    await flush();
    expect(logMonetizationChanges).not.toHaveBeenCalled();
  });
});

describe('getPlatformSettingsByCategory', () => {
  it('should return settings by category', async () => {
    const data = { key: 'val' };
    adminFeaturesService.getPlatformSettingsByCategory.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getPlatformSettingsByCategory(req({ params: { category: 'general' } }), res, next);
    await flush();
    expect(adminFeaturesService.getPlatformSettingsByCategory).toHaveBeenCalledWith('general');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// VERIFICATION SETTINGS
// ============================================================================

describe('getVerificationSettings', () => {
  it('should return verification settings', async () => {
    const data = { requiredLevel: 'OR' };
    platformSettingsService.getVerificationSettings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getVerificationSettings(req(), res, next);
    await flush();
    expect(platformSettingsService.getVerificationSettings).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateVerificationSettings', () => {
  it('should update and return verification settings', async () => {
    const data = { requiredLevel: 'PLATINE' };
    platformSettingsService.updateVerificationSettings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateVerificationSettings(req({ body: { requiredLevel: 'PLATINE' } }), res, next);
    await flush();
    expect(platformSettingsService.updateVerificationSettings).toHaveBeenCalledWith({
      requiredLevel: 'PLATINE',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Paramètres de vérification mis à jour',
    });
  });
});

// ============================================================================
// FEATURE FLAGS
// ============================================================================

describe('getFeatureFlags', () => {
  it('should return feature flags with query filters', async () => {
    const data = [{ key: 'new_checkout', enabled: true }];
    adminFeaturesService.getFeatureFlags.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFeatureFlags(req({ query: { scope: 'admin', enabled: 'true' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFeatureFlags).toHaveBeenCalledWith({
      scope: 'admin',
      enabled: 'true',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getFeatureFlag', () => {
  it('should return a single flag by id', async () => {
    const data = { id: 'f1', key: 'test' };
    adminFeaturesService.getFeatureFlag.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFeatureFlag(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFeatureFlag).toHaveBeenCalledWith('f1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createFeatureFlag', () => {
  it('should create a feature flag', async () => {
    const data = { id: 'f1', key: 'new_flag' };
    adminFeaturesService.createFeatureFlag.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createFeatureFlag(req({ body: { key: 'new_flag' } }), res, next);
    await flush();
    expect(adminFeaturesService.createFeatureFlag).toHaveBeenCalledWith({ key: 'new_flag' }, 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Feature flag créé' });
  });
});

describe('updateFeatureFlag', () => {
  it('should update a feature flag', async () => {
    const data = { id: 'f1', enabled: true };
    adminFeaturesService.updateFeatureFlag.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateFeatureFlag(req({ params: { id: 'f1' }, body: { enabled: true } }), res, next);
    await flush();
    expect(adminFeaturesService.updateFeatureFlag).toHaveBeenCalledWith(
      'f1',
      { enabled: true },
      'u1'
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Feature flag mis à jour',
    });
  });
});

describe('deleteFeatureFlag', () => {
  it('should delete a feature flag', async () => {
    adminFeaturesService.deleteFeatureFlag.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteFeatureFlag(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteFeatureFlag).toHaveBeenCalledWith('f1', 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Feature flag supprimé',
    });
  });
});

describe('toggleFeatureFlag', () => {
  it('should toggle a feature flag', async () => {
    const data = { id: 'f1', enabled: false };
    adminFeaturesService.toggleFeatureFlag.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.toggleFeatureFlag(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.toggleFeatureFlag).toHaveBeenCalledWith('f1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Feature flag basculé' });
  });
});

// ============================================================================
// ADMIN ROLES & PERMISSIONS
// ============================================================================

describe('getAdminRoles', () => {
  it('should return admin roles', async () => {
    const data = [{ id: 'r1', name: 'SuperAdmin' }];
    adminFeaturesService.getAdminRoles.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminRoles(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAdminRoles).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createAdminRole', () => {
  it('should create a role', async () => {
    const data = { id: 'r1', name: 'Moderator' };
    adminFeaturesService.createAdminRole.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createAdminRole(req({ body: { name: 'Moderator' } }), res, next);
    await flush();
    expect(adminFeaturesService.createAdminRole).toHaveBeenCalledWith({ name: 'Moderator' }, 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Rôle créé' });
  });
});

describe('updateAdminRole', () => {
  it('should update a role', async () => {
    const data = { id: 'r1', name: 'Admin' };
    adminFeaturesService.updateAdminRole.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminRole(req({ params: { id: 'r1' }, body: { name: 'Admin' } }), res, next);
    await flush();
    expect(adminFeaturesService.updateAdminRole).toHaveBeenCalledWith(
      'r1',
      { name: 'Admin' },
      'u1'
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Rôle mis à jour' });
  });
});

describe('deleteAdminRole', () => {
  it('should delete a role', async () => {
    adminFeaturesService.deleteAdminRole.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteAdminRole(req({ params: { id: 'r1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteAdminRole).toHaveBeenCalledWith('r1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null, message: 'Rôle supprimé' });
  });
});

describe('getAdminPermissions', () => {
  it('should return permissions', async () => {
    const data = [{ action: 'manage_users' }];
    adminFeaturesService.getAdminPermissions.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminPermissions(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAdminPermissions).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('assignRoleToUser', () => {
  it('should assign role to user', async () => {
    const data = { userId: 'u1', roleId: 'r1' };
    adminFeaturesService.assignRoleToUser.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.assignRoleToUser(req({ body: { userId: 'u1', roleId: 'r1' } }), res, next);
    await flush();
    expect(adminFeaturesService.assignRoleToUser).toHaveBeenCalledWith('u1', 'r1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Rôle assigné' });
  });
});

describe('removeRoleFromUser', () => {
  it('should remove role from user', async () => {
    adminFeaturesService.removeRoleFromUser.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.removeRoleFromUser(req({ body: { userId: 'u1', roleId: 'r1' } }), res, next);
    await flush();
    expect(adminFeaturesService.removeRoleFromUser).toHaveBeenCalledWith('u1', 'r1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null, message: 'Rôle retiré' });
  });
});

describe('getUserRoles', () => {
  it('should return roles for user', async () => {
    const data = [{ id: 'r1', name: 'Admin' }];
    adminFeaturesService.getUserRoles.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getUserRoles(req({ params: { userId: 'u1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getUserRoles).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAdminUsers', () => {
  it('should return admin users', async () => {
    const data = [{ id: 'u1', email: 'admin@test.com' }];
    adminFeaturesService.getAdminUsers.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminUsers(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAdminUsers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// AUTOMATION RULES
// ============================================================================

describe('getAutomationRules', () => {
  it('should return rules with filters', async () => {
    const data = [{ id: 'a1', trigger: 'new_order' }];
    adminFeaturesService.getAutomationRules.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAutomationRules(req({ query: { trigger: 'new_order', status: 'ACTIVE' } }), res, next);
    await flush();
    expect(adminFeaturesService.getAutomationRules).toHaveBeenCalledWith({
      trigger: 'new_order',
      status: 'ACTIVE',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAutomationRule', () => {
  it('should return a single rule', async () => {
    const data = { id: 'a1' };
    adminFeaturesService.getAutomationRule.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAutomationRule(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getAutomationRule).toHaveBeenCalledWith('a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createAutomationRule', () => {
  it('should create a rule', async () => {
    const data = { id: 'a1', name: 'Rule1' };
    adminFeaturesService.createAutomationRule.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createAutomationRule(req({ body: { name: 'Rule1' } }), res, next);
    await flush();
    expect(adminFeaturesService.createAutomationRule).toHaveBeenCalledWith({ name: 'Rule1' }, 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: "Règle d'automatisation créée",
    });
  });
});

describe('updateAutomationRule', () => {
  it('should update a rule', async () => {
    const data = { id: 'a1', name: 'Updated' };
    adminFeaturesService.updateAutomationRule.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAutomationRule(req({ params: { id: 'a1' }, body: { name: 'Updated' } }), res, next);
    await flush();
    expect(adminFeaturesService.updateAutomationRule).toHaveBeenCalledWith(
      'a1',
      {
        name: 'Updated',
      },
      'u1'
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: "Règle d'automatisation mise à jour",
    });
  });
});

describe('deleteAutomationRule', () => {
  it('should delete a rule', async () => {
    adminFeaturesService.deleteAutomationRule.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteAutomationRule(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteAutomationRule).toHaveBeenCalledWith('a1', 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: "Règle d'automatisation supprimée",
    });
  });
});

describe('toggleAutomationRule', () => {
  it('should toggle rule status', async () => {
    const data = { id: 'a1', isActive: false };
    adminFeaturesService.toggleAutomationRule.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.toggleAutomationRule(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(adminFeaturesService.toggleAutomationRule).toHaveBeenCalledWith('a1', 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Statut de la règle basculé',
    });
  });
});

describe('getAutomationExecutionLogs', () => {
  it('should return execution logs for a rule', async () => {
    const data = [{ id: 'l1', ruleId: 'a1' }];
    adminFeaturesService.getAutomationExecutionLogs.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAutomationExecutionLogs(req({ params: { ruleId: 'a1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getAutomationExecutionLogs).toHaveBeenCalledWith('a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAutomationTriggers', () => {
  it('should return trigger types', async () => {
    const data = [{ key: 'new_order', label: 'New Order' }];
    adminFeaturesService.getAutomationTriggers.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAutomationTriggers(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAutomationTriggers).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAutomationActionTypes', () => {
  it('should return action types', async () => {
    const data = [{ key: 'send_email', label: 'Send Email' }];
    adminFeaturesService.getAutomationActionTypes.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAutomationActionTypes(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAutomationActionTypes).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// CMS PAGES
// ============================================================================

describe('getCmsPages', () => {
  it('should return CMS pages with filters', async () => {
    const data = [{ id: 'p1', title: 'About' }];
    adminFeaturesService.getCmsPages.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCmsPages(
      req({ query: { category: 'info', status: 'PUBLISHED', search: 'about' } }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.getCmsPages).toHaveBeenCalledWith({
      category: 'info',
      status: 'PUBLISHED',
      search: 'about',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getCmsPage', () => {
  it('should return a single page by slug', async () => {
    const data = { id: 'p1', slug: 'about' };
    adminFeaturesService.getCmsPage.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCmsPage(req({ params: { slug: 'about' } }), res, next);
    await flush();
    expect(adminFeaturesService.getCmsPage).toHaveBeenCalledWith('about');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createCmsPage', () => {
  it('should create a CMS page with user id', async () => {
    const data = { id: 'p1', title: 'New Page' };
    adminFeaturesService.createCmsPage.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createCmsPage(req({ body: { title: 'New Page' } }), res, next);
    await flush();
    expect(adminFeaturesService.createCmsPage).toHaveBeenCalledWith({ title: 'New Page' }, 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Page CMS créée' });
  });
});

describe('updateCmsPage', () => {
  it('should update a CMS page', async () => {
    const data = { id: 'p1', title: 'Updated' };
    adminFeaturesService.updateCmsPage.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateCmsPage(req({ params: { id: 'p1' }, body: { title: 'Updated' } }), res, next);
    await flush();
    expect(adminFeaturesService.updateCmsPage).toHaveBeenCalledWith(
      'p1',
      { title: 'Updated' },
      'u1'
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Page CMS mise à jour' });
  });
});

describe('deleteCmsPage', () => {
  it('should delete a CMS page', async () => {
    adminFeaturesService.deleteCmsPage.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteCmsPage(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteCmsPage).toHaveBeenCalledWith('p1', 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Page CMS supprimée',
    });
  });
});

describe('publishCmsPage', () => {
  it('should publish a CMS page', async () => {
    const data = { id: 'p1', status: 'PUBLISHED' };
    adminFeaturesService.publishCmsPage.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.publishCmsPage(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(adminFeaturesService.publishCmsPage).toHaveBeenCalledWith('p1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Page CMS publiée' });
  });
});

describe('getCmsCategories', () => {
  it('should return CMS categories', async () => {
    const data = [{ id: 'c1', name: 'Info' }];
    adminFeaturesService.getCmsCategories.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCmsCategories(req(), res, next);
    await flush();
    expect(adminFeaturesService.getCmsCategories).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createCmsCategory', () => {
  it('should create a category', async () => {
    const data = { id: 'c1', name: 'Info' };
    adminFeaturesService.createCmsCategory.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createCmsCategory(req({ body: { name: 'Info' } }), res, next);
    await flush();
    expect(adminFeaturesService.createCmsCategory).toHaveBeenCalledWith({ name: 'Info' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Catégorie CMS créée' });
  });
});

describe('updateCmsCategory', () => {
  it('should update a category', async () => {
    const data = { id: 'c1', name: 'Updated' };
    adminFeaturesService.updateCmsCategory.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateCmsCategory(req({ params: { id: 'c1' }, body: { name: 'Updated' } }), res, next);
    await flush();
    expect(adminFeaturesService.updateCmsCategory).toHaveBeenCalledWith('c1', { name: 'Updated' });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Catégorie CMS mise à jour',
    });
  });
});

describe('deleteCmsCategory', () => {
  it('should delete a category', async () => {
    adminFeaturesService.deleteCmsCategory.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteCmsCategory(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteCmsCategory).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Catégorie CMS supprimée',
    });
  });
});

// ============================================================================
// FORM TEMPLATES
// ============================================================================

describe('getFormTemplates', () => {
  it('should return form templates with filters', async () => {
    const data = [{ id: 'f1', name: 'Contact' }];
    adminFeaturesService.getFormTemplates.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFormTemplates(req({ query: { category: 'contact', status: 'ACTIVE' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFormTemplates).toHaveBeenCalledWith({
      category: 'contact',
      status: 'ACTIVE',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getFormTemplate', () => {
  it('should return a template by slug', async () => {
    const data = { id: 'f1', slug: 'contact-form' };
    adminFeaturesService.getFormTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFormTemplate(req({ params: { slug: 'contact-form' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFormTemplate).toHaveBeenCalledWith('contact-form');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createFormTemplate', () => {
  it('should create a form template', async () => {
    const data = { id: 'f1', name: 'Contact' };
    adminFeaturesService.createFormTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createFormTemplate(req({ body: { name: 'Contact' } }), res, next);
    await flush();
    expect(adminFeaturesService.createFormTemplate).toHaveBeenCalledWith({ name: 'Contact' });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Template de formulaire créé',
    });
  });
});

describe('updateFormTemplate', () => {
  it('should update a form template', async () => {
    const data = { id: 'f1', name: 'Updated' };
    adminFeaturesService.updateFormTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateFormTemplate(req({ params: { id: 'f1' }, body: { name: 'Updated' } }), res, next);
    await flush();
    expect(adminFeaturesService.updateFormTemplate).toHaveBeenCalledWith('f1', { name: 'Updated' });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Template de formulaire mis à jour',
    });
  });
});

describe('deleteFormTemplate', () => {
  it('should delete a form template', async () => {
    adminFeaturesService.deleteFormTemplate.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteFormTemplate(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteFormTemplate).toHaveBeenCalledWith('f1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Template de formulaire supprimé',
    });
  });
});

describe('activateFormTemplate', () => {
  it('should activate a form template', async () => {
    const data = { id: 'f1', isActive: true };
    adminFeaturesService.activateFormTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.activateFormTemplate(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.activateFormTemplate).toHaveBeenCalledWith('f1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Template de formulaire activé',
    });
  });
});

describe('getFormSubmissions', () => {
  it('should return submissions by template id', async () => {
    const data = [{ id: 's1', templateId: 'f1' }];
    adminFeaturesService.getFormSubmissions.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFormSubmissions(req({ params: { templateId: 'f1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFormSubmissions).toHaveBeenCalledWith('f1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getFormSubmission', () => {
  it('should return a single submission', async () => {
    const data = { id: 's1', data: {} };
    adminFeaturesService.getFormSubmission.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getFormSubmission(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getFormSubmission).toHaveBeenCalledWith('s1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

describe('getNotificationTemplates', () => {
  it('should return templates with filters', async () => {
    const data = [{ id: 'n1', type: 'WELCOME' }];
    adminFeaturesService.getNotificationTemplates.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getNotificationTemplates(req({ query: { type: 'WELCOME', channel: 'EMAIL' } }), res, next);
    await flush();
    expect(adminFeaturesService.getNotificationTemplates).toHaveBeenCalledWith({
      type: 'WELCOME',
      channel: 'EMAIL',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getNotificationTemplate', () => {
  it('should return a template by id', async () => {
    const data = { id: 'n1', subject: 'Welcome' };
    adminFeaturesService.getNotificationTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getNotificationTemplate(req({ params: { id: 'n1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getNotificationTemplate).toHaveBeenCalledWith('n1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createNotificationTemplate', () => {
  it('should create a notification template', async () => {
    const data = { id: 'n1', subject: 'Welcome' };
    adminFeaturesService.createNotificationTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createNotificationTemplate(req({ body: { subject: 'Welcome' } }), res, next);
    await flush();
    expect(adminFeaturesService.createNotificationTemplate).toHaveBeenCalledWith({
      subject: 'Welcome',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Template de notification créé',
    });
  });
});

describe('updateNotificationTemplate', () => {
  it('should update a notification template', async () => {
    const data = { id: 'n1', subject: 'Updated' };
    adminFeaturesService.updateNotificationTemplate.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateNotificationTemplate(
      req({ params: { id: 'n1' }, body: { subject: 'Updated' } }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.updateNotificationTemplate).toHaveBeenCalledWith('n1', {
      subject: 'Updated',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Template de notification mis à jour',
    });
  });
});

describe('deleteNotificationTemplate', () => {
  it('should delete a notification template', async () => {
    adminFeaturesService.deleteNotificationTemplate.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteNotificationTemplate(req({ params: { id: 'n1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteNotificationTemplate).toHaveBeenCalledWith('n1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Template de notification supprimé',
    });
  });
});

describe('getNotificationTypes', () => {
  it('should return notification types', async () => {
    const data = ['WELCOME', 'ALERT'];
    adminFeaturesService.getNotificationTypes.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getNotificationTypes(req(), res, next);
    await flush();
    expect(adminFeaturesService.getNotificationTypes).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getNotificationChannels', () => {
  it('should return notification channels', async () => {
    const data = ['EMAIL', 'SMS'];
    adminFeaturesService.getNotificationChannels.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getNotificationChannels(req(), res, next);
    await flush();
    expect(adminFeaturesService.getNotificationChannels).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// COPILOT CONFIGURATION
// ============================================================================

describe('getPlatformCopilotConfig', () => {
  it('should return platform copilot config', async () => {
    const data = { model: 'gpt-4' };
    adminFeaturesService.getPlatformCopilotConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getPlatformCopilotConfig(req(), res, next);
    await flush();
    expect(adminFeaturesService.getPlatformCopilotConfig).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updatePlatformCopilotConfig', () => {
  it('should update platform copilot config', async () => {
    const data = { model: 'gpt-4o' };
    adminFeaturesService.updatePlatformCopilotConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updatePlatformCopilotConfig(req({ body: { model: 'gpt-4o' } }), res, next);
    await flush();
    expect(adminFeaturesService.updatePlatformCopilotConfig).toHaveBeenCalledWith({
      model: 'gpt-4o',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Configuration copilot mise à jour',
    });
  });
});

describe('getBusinessCopilotConfig', () => {
  it('should return business copilot config', async () => {
    const data = { businessId: 'b1', model: 'gpt-4' };
    adminFeaturesService.getBusinessCopilotConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getBusinessCopilotConfig(req({ params: { businessId: 'b1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getBusinessCopilotConfig).toHaveBeenCalledWith('b1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateBusinessCopilotConfig', () => {
  it('should update business copilot config', async () => {
    const data = { businessId: 'b1', model: 'gpt-4o' };
    adminFeaturesService.updateBusinessCopilotConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateBusinessCopilotConfig(
      req({ params: { businessId: 'b1' }, body: { model: 'gpt-4o' } }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.updateBusinessCopilotConfig).toHaveBeenCalledWith('b1', {
      model: 'gpt-4o',
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Configuration copilot business mise à jour',
    });
  });
});

describe('getPlatformHealthCtrl', () => {
  it('should return platform health', async () => {
    const data = { status: 'healthy' };
    getPlatformHealth.mockResolvedValue(data);
    const res = mockRes();
    ctrl.getPlatformHealthCtrl(req(), res, jest.fn());
    await flush();
    expect(getPlatformHealth).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// MEDIA MODERATION
// ============================================================================

describe('getMediaModerationItems', () => {
  it('should return moderation items with filters', async () => {
    const data = [{ id: 'm1', contentType: 'IMAGE' }];
    adminFeaturesService.getMediaModerationItems.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getMediaModerationItems(
      req({ query: { contentType: 'IMAGE', status: 'PENDING' } }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.getMediaModerationItems).toHaveBeenCalledWith({
      contentType: 'IMAGE',
      status: 'PENDING',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getMediaModerationItem', () => {
  it('should return a single moderation item', async () => {
    const data = { id: 'm1' };
    adminFeaturesService.getMediaModerationItem.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getMediaModerationItem(req({ params: { id: 'm1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getMediaModerationItem).toHaveBeenCalledWith('m1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('reportMedia', () => {
  it('should report media', async () => {
    const data = { id: 'r1' };
    adminFeaturesService.reportMedia.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.reportMedia(
      req({
        body: {
          contentType: 'IMAGE',
          contentId: 'c1',
          reason: 'spam',
          description: 'Spam content',
        },
      }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.reportMedia).toHaveBeenCalledWith(
      'IMAGE',
      'c1',
      'u1',
      'spam',
      'Spam content'
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Contenu signalé' });
  });
});

describe('reportMediaViaContentReport', () => {
  it('should create a content report', async () => {
    const report = { id: 'cr1' };
    contentReportService.createReport.mockResolvedValue(report);
    const res = mockRes();
    const next = jest.fn();
    ctrl.reportMediaViaContentReport(
      req({
        body: {
          type: 'BUSINESS',
          referenceId: 'b1',
          reason: 'inappropriate',
          description: 'Bad content',
        },
      }),
      res,
      next
    );
    await flush();
    expect(contentReportService.createReport).toHaveBeenCalledWith({
      reporterId: 'u1',
      type: 'BUSINESS',
      referenceId: 'b1',
      reason: 'inappropriate',
      description: 'Bad content',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: report,
      message: 'Contenu signalé (via contentReport)',
    });
  });

  it('should default type to BUSINESS and use contentId as referenceId', async () => {
    contentReportService.createReport.mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.reportMediaViaContentReport(
      req({
        body: { contentId: 'c1' },
      }),
      res,
      next
    );
    await flush();
    expect(contentReportService.createReport).toHaveBeenCalledWith({
      reporterId: 'u1',
      type: 'BUSINESS',
      referenceId: 'c1',
      reason: 'Signalement admin',
      description: undefined,
    });
  });
});

describe('approveMedia', () => {
  it('should approve media', async () => {
    const data = { id: 'm1', status: 'APPROVED' };
    adminFeaturesService.approveMedia.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.approveMedia(req({ params: { id: 'm1' } }), res, next);
    await flush();
    expect(adminFeaturesService.approveMedia).toHaveBeenCalledWith('m1', 'u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Contenu approuvé' });
  });
});

describe('rejectMedia', () => {
  it('should reject media with reason', async () => {
    const data = { id: 'm1', status: 'REJECTED' };
    adminFeaturesService.rejectMedia.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.rejectMedia(req({ params: { id: 'm1' }, body: { reason: 'against policy' } }), res, next);
    await flush();
    expect(adminFeaturesService.rejectMedia).toHaveBeenCalledWith('m1', 'u1', 'against policy');
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Contenu rejeté' });
  });
});

describe('flagMedia', () => {
  it('should flag media for review', async () => {
    const data = { id: 'm1', status: 'FLAGGED' };
    adminFeaturesService.flagMedia.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.flagMedia(req({ params: { id: 'm1' }, body: { reason: 'review needed' } }), res, next);
    await flush();
    expect(adminFeaturesService.flagMedia).toHaveBeenCalledWith('m1', 'u1', 'review needed');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Contenu signalé pour examen',
    });
  });
});

describe('getModerationStats', () => {
  it('should return moderation stats', async () => {
    const data = { pending: 5, approved: 20 };
    adminFeaturesService.getModerationStats.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getModerationStats(req(), res, next);
    await flush();
    expect(adminFeaturesService.getModerationStats).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// COMMISSION CONFIGURATION
// ============================================================================

describe('getCommissionConfigs', () => {
  it('should return commission configs', async () => {
    const data = [{ key: 'default', rate: 0.1 }];
    adminFeaturesService.getCommissionConfigs.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCommissionConfigs(req(), res, next);
    await flush();
    expect(adminFeaturesService.getCommissionConfigs).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getCommissionConfig', () => {
  it('should return a single config by key', async () => {
    const data = { key: 'default', rate: 0.1 };
    adminFeaturesService.getCommissionConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCommissionConfig(req({ params: { key: 'default' } }), res, next);
    await flush();
    expect(adminFeaturesService.getCommissionConfig).toHaveBeenCalledWith('default');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createCommissionConfig', () => {
  it('should create a commission config', async () => {
    const data = { id: 'c1', key: 'new', rate: 0.15 };
    adminFeaturesService.createCommissionConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createCommissionConfig(req({ body: { key: 'new', rate: 0.15 } }), res, next);
    await flush();
    expect(adminFeaturesService.createCommissionConfig).toHaveBeenCalledWith({
      key: 'new',
      rate: 0.15,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Commission config créée',
    });
  });
});

describe('updateCommissionConfig', () => {
  it('should update a commission config', async () => {
    const data = { id: 'c1', rate: 0.2 };
    adminFeaturesService.updateCommissionConfig.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateCommissionConfig(req({ params: { id: 'c1' }, body: { rate: 0.2 } }), res, next);
    await flush();
    expect(adminFeaturesService.updateCommissionConfig).toHaveBeenCalledWith('c1', { rate: 0.2 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Commission config mise à jour',
    });
  });
});

describe('deleteCommissionConfig', () => {
  it('should delete a commission config', async () => {
    adminFeaturesService.deleteCommissionConfig.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteCommissionConfig(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteCommissionConfig).toHaveBeenCalledWith('c1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Commission config supprimée',
    });
  });
});

// ============================================================================
// USER WARNINGS
// ============================================================================

describe('getUserWarnings', () => {
  it('should return warnings for a user', async () => {
    const data = [{ id: 'w1', userId: 'u1' }];
    adminFeaturesService.getUserWarnings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getUserWarnings(req({ params: { userId: 'u1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getUserWarnings).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('issueWarning', () => {
  it('should issue a warning', async () => {
    const data = { id: 'w1' };
    adminFeaturesService.issueWarning.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.issueWarning(
      req({
        params: { userId: 'u2' },
        body: { reason: 'spam', description: 'Sending spam', action: 'SUSPEND' },
      }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.issueWarning).toHaveBeenCalledWith(
      'u2',
      'u1',
      'spam',
      'Sending spam',
      'SUSPEND'
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Avertissement émis' });
  });
});

describe('revokeWarning', () => {
  it('should revoke a warning', async () => {
    adminFeaturesService.revokeWarning.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.revokeWarning(req({ params: { id: 'w1' } }), res, next);
    await flush();
    expect(adminFeaturesService.revokeWarning).toHaveBeenCalledWith('w1', 'u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Avertissement révoqué',
    });
  });
});

describe('getAllWarnings', () => {
  it('should return all warnings filtered by userId', async () => {
    const data = [{ id: 'w1' }];
    adminFeaturesService.getAllWarnings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAllWarnings(req({ query: { userId: 'u1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getAllWarnings).toHaveBeenCalledWith({ userId: 'u1' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('should return all warnings without filter', async () => {
    const data = [{ id: 'w1' }, { id: 'w2' }];
    adminFeaturesService.getAllWarnings.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAllWarnings(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAllWarnings).toHaveBeenCalledWith({ userId: undefined });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

describe('getAllSubscriptionPlans', () => {
  it('should return all plans', async () => {
    const data = [{ id: 'p1', name: 'Basic' }];
    adminFeaturesService.getAllSubscriptionPlans.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAllSubscriptionPlans(req(), res, next);
    await flush();
    expect(adminFeaturesService.getAllSubscriptionPlans).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getSubscriptionPlan', () => {
  it('should return a plan by id', async () => {
    const data = { id: 'p1', name: 'Premium' };
    adminFeaturesService.getSubscriptionPlan.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getSubscriptionPlan(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getSubscriptionPlan).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createSubscriptionPlan', () => {
  it('should create a plan', async () => {
    const data = { id: 'p1', name: 'Pro', price: 29.99 };
    adminFeaturesService.createSubscriptionPlan.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createSubscriptionPlan(req({ body: { name: 'Pro', price: 29.99 } }), res, next);
    await flush();
    expect(adminFeaturesService.createSubscriptionPlan).toHaveBeenCalledWith({
      name: 'Pro',
      price: 29.99,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: "Plan d'abonnement créé",
    });
  });
});

describe('updateSubscriptionPlan', () => {
  it('should update a plan', async () => {
    const data = { id: 'p1', price: 49.99 };
    adminFeaturesService.updateSubscriptionPlan.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateSubscriptionPlan(req({ params: { id: 'p1' }, body: { price: 49.99 } }), res, next);
    await flush();
    expect(adminFeaturesService.updateSubscriptionPlan).toHaveBeenCalledWith('p1', {
      price: 49.99,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: "Plan d'abonnement mis à jour",
    });
  });
});

describe('deleteSubscriptionPlan', () => {
  it('should delete a plan', async () => {
    adminFeaturesService.deleteSubscriptionPlan.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteSubscriptionPlan(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(adminFeaturesService.deleteSubscriptionPlan).toHaveBeenCalledWith('p1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: "Plan d'abonnement supprimé",
    });
  });
});

describe('addPlanPrivilege', () => {
  it('should add a privilege to a plan', async () => {
    const data = { id: 'pr1', planId: 'p1', key: 'analytics' };
    adminFeaturesService.addPlanPrivilege.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.addPlanPrivilege(req({ params: { id: 'p1' }, body: { key: 'analytics' } }), res, next);
    await flush();
    expect(adminFeaturesService.addPlanPrivilege).toHaveBeenCalledWith('p1', { key: 'analytics' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Privilège ajouté' });
  });
});

describe('updatePlanPrivilege', () => {
  it('should update a plan privilege', async () => {
    const data = { id: 'pr1', key: 'premium-analytics' };
    adminFeaturesService.updatePlanPrivilege.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updatePlanPrivilege(
      req({ params: { id: 'pr1' }, body: { key: 'premium-analytics' } }),
      res,
      next
    );
    await flush();
    expect(adminFeaturesService.updatePlanPrivilege).toHaveBeenCalledWith('pr1', {
      key: 'premium-analytics',
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Privilège mis à jour' });
  });
});

describe('removePlanPrivilege', () => {
  it('should remove a plan privilege', async () => {
    adminFeaturesService.removePlanPrivilege.mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    ctrl.removePlanPrivilege(req({ params: { id: 'pr1' } }), res, next);
    await flush();
    expect(adminFeaturesService.removePlanPrivilege).toHaveBeenCalledWith('pr1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: null,
      message: 'Privilège supprimé',
    });
  });
});

// ============================================================================
// BACKUPS
// ============================================================================

describe('getBackups', () => {
  it('should return backups', async () => {
    const data = [{ id: 'b1', filename: 'backup.sql' }];
    adminFeaturesService.getBackups.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getBackups(req(), res, next);
    await flush();
    expect(adminFeaturesService.getBackups).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('createBackup', () => {
  it('should create a backup', async () => {
    const data = { id: 'b1', filename: 'backup.sql' };
    adminFeaturesService.createBackup.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createBackup(req(), res, next);
    await flush();
    expect(adminFeaturesService.createBackup).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Sauvegarde créée' });
  });
});

describe('restoreBackup', () => {
  it('should restore a backup', async () => {
    const data = { id: 'b1', status: 'restored' };
    adminFeaturesService.restoreBackup.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.restoreBackup(req({ params: { id: 'b1' } }), res, next);
    await flush();
    expect(adminFeaturesService.restoreBackup).toHaveBeenCalledWith('b1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Restauration effectuée',
    });
  });
});

describe('getBackupDownloadUrl', () => {
  it('should return a download URL', async () => {
    const data = { url: 'https://storage.example.com/backup.sql' };
    adminFeaturesService.getBackupDownloadUrl.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getBackupDownloadUrl(req({ params: { id: 'b1' } }), res, next);
    await flush();
    expect(adminFeaturesService.getBackupDownloadUrl).toHaveBeenCalledWith('b1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('toggleAutoBackup', () => {
  it('should enable auto backup', async () => {
    const data = { enabled: true };
    adminFeaturesService.toggleAutoBackup.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.toggleAutoBackup(req({ body: { enabled: true } }), res, next);
    await flush();
    expect(adminFeaturesService.toggleAutoBackup).toHaveBeenCalledWith(true);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Sauvegarde automatique activée',
    });
  });

  it('should disable auto backup', async () => {
    const data = { enabled: false };
    adminFeaturesService.toggleAutoBackup.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.toggleAutoBackup(req({ body: { enabled: false } }), res, next);
    await flush();
    expect(adminFeaturesService.toggleAutoBackup).toHaveBeenCalledWith(false);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Sauvegarde automatique désactivée',
    });
  });
});

// ============================================================================
// AFRI SCORE
// ============================================================================

describe('recomputeAllAfriScores', () => {
  it('should trigger score recomputation', async () => {
    const data = { processed: 100 };
    adminFeaturesService.recomputeAllAfriScores.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.recomputeAllAfriScores(req(), res, next);
    await flush();
    expect(adminFeaturesService.recomputeAllAfriScores).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Recalcul des scores lancé',
    });
  });
});

describe('getAfriScoreRules', () => {
  it('should return AfriScore rules via category settings', async () => {
    const data = { minScore: 50 };
    adminFeaturesService.getPlatformSettingsByCategory.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAfriScoreRules(req(), res, next);
    await flush();
    expect(adminFeaturesService.getPlatformSettingsByCategory).toHaveBeenCalledWith('afriscore');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateAfriScoreRules', () => {
  it('should update AfriScore rules', async () => {
    const data = { minScore: 60 };
    adminFeaturesService.updateAfriScoreRules.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAfriScoreRules(req({ body: { minScore: 60 } }), res, next);
    await flush();
    expect(adminFeaturesService.updateAfriScoreRules).toHaveBeenCalledWith({ minScore: 60 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data,
      message: 'Règles AfriScore mises à jour',
    });
  });
});

// ============================================================================
// MEDIA MANAGEMENT (Stories / Shorts / Lives)
// ============================================================================

describe('getAdminStories', () => {
  it('should return stories from prisma', async () => {
    const data = [{ id: 's1', business: { id: 'b1', name: 'Biz' } }];
    (mockPrisma.story.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminStories(req(), res, next);
    await flush();
    expect(mockPrisma.story.findMany).toHaveBeenCalledWith({
      include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateAdminStoryStatus', () => {
  it('should update story status when ACTIVE', async () => {
    const updated = { id: 's1', isActive: true };
    (mockPrisma.story.update as jest.Mock).mockResolvedValue(updated);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminStoryStatus(
      req({ params: { id: 's1' }, body: { status: 'ACTIVE' } }),
      res,
      next
    );
    await flush();
    expect(mockPrisma.story.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: true },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updated,
      message: 'Statut mis à jour',
    });
  });

  it('should handle ACTIF status as true', async () => {
    (mockPrisma.story.update as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminStoryStatus(
      req({ params: { id: 's1' }, body: { status: 'ACTIF' } }),
      res,
      next
    );
    await flush();
    expect(mockPrisma.story.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: true },
    });
  });

  it('should set isActive to false for other statuses', async () => {
    (mockPrisma.story.update as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminStoryStatus(
      req({ params: { id: 's1' }, body: { status: 'INACTIVE' } }),
      res,
      next
    );
    await flush();
    expect(mockPrisma.story.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: false },
    });
  });
});

describe('deleteAdminStory', () => {
  it('should delete a story and its feed items', async () => {
    (mockPrisma.story.delete as jest.Mock).mockResolvedValue({});
    (mockPrisma.feedItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteAdminStory(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(mockPrisma.story.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(mockPrisma.feedItem.deleteMany).toHaveBeenCalledWith({
      where: { referenceId: 's1', type: 'STORY' },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Story supprimée' });
  });
});

describe('getAdminShorts', () => {
  it('should return shorts from prisma', async () => {
    const data = [{ id: 's1', business: { id: 'b1', name: 'Biz' } }];
    (mockPrisma.short.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminShorts(req(), res, next);
    await flush();
    expect(mockPrisma.short.findMany).toHaveBeenCalledWith({
      include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateAdminShortStatus', () => {
  it('should update short status', async () => {
    (mockPrisma.short.update as jest.Mock).mockResolvedValue({ id: 's1', isActive: true });
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminShortStatus(
      req({ params: { id: 's1' }, body: { status: 'ACTIVE' } }),
      res,
      next
    );
    await flush();
    expect(mockPrisma.short.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { isActive: true },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 's1', isActive: true },
      message: 'Statut mis à jour',
    });
  });
});

describe('deleteAdminShort', () => {
  it('should delete a short', async () => {
    (mockPrisma.short.delete as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteAdminShort(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(mockPrisma.short.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Short supprimé' });
  });
});

describe('getAdminLives', () => {
  it('should return lives from prisma', async () => {
    const data = [{ id: 'l1', business: { id: 'b1', name: 'Biz' } }];
    (mockPrisma.live.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminLives(req(), res, next);
    await flush();
    expect(mockPrisma.live.findMany).toHaveBeenCalledWith({
      include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('updateAdminLiveStatus', () => {
  it('should update live status', async () => {
    (mockPrisma.live.update as jest.Mock).mockResolvedValue({ id: 'l1', status: 'LIVE' });
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateAdminLiveStatus(req({ params: { id: 'l1' }, body: { status: 'LIVE' } }), res, next);
    await flush();
    expect(mockPrisma.live.update).toHaveBeenCalledWith({
      where: { id: 'l1' },
      data: { status: 'LIVE' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'l1', status: 'LIVE' },
      message: 'Statut mis à jour',
    });
  });
});

// ============================================================================
// MONETIZATION AUDIT LOGS
// ============================================================================

describe('getMonetizationAudit', () => {
  it('should return monetization audit logs', async () => {
    const data = [{ id: 'l1', action: 'update_rate' }];
    getMonetizationAuditLogs.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getMonetizationAudit(req(), res, next);
    await flush();
    expect(getMonetizationAuditLogs).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// DEVELOPER COMMISSIONS
// ============================================================================

describe('getDeveloperCommissions', () => {
  const mockProfile = {
    id: 'dev1',
    companyName: 'DevCo',
    user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
    modules: [{ id: 'm1', name: 'Module1', price: 100 }],
  };

  it('should return paginated developer commissions', async () => {
    (mockPrisma.developerProfile.findMany as jest.Mock).mockResolvedValue([mockProfile]);
    (mockPrisma.developerProfile.count as jest.Mock).mockResolvedValue(1);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getDeveloperCommissions(req({ query: { page: '1', limit: '20' } }), res, next);
    await flush();
    expect(mockPrisma.developerProfile.findMany).toHaveBeenCalled();
    expect(mockPrisma.developerProfile.count).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        developers: [
          {
            id: 'dev1',
            name: 'DevCo',
            email: 'john@test.com',
            moduleCount: 1,
            totalSales: 1,
            grossRevenue: 100,
            commission: 20,
            netRevenue: 80,
          },
        ],
        totalPages: 1,
        stats: {
          totalDeveloperRevenue: 100,
          totalPlatformCommission: 20,
          totalSales: 1,
        },
      },
    });
  });

  it('should build search query for developer commissions', async () => {
    (mockPrisma.developerProfile.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.developerProfile.count as jest.Mock).mockResolvedValue(0);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getDeveloperCommissions(req({ query: { search: 'DevCo' } }), res, next);
    await flush();
    expect(mockPrisma.developerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ companyName: expect.anything() })]),
        }),
      })
    );
  });
});

// ============================================================================
// COUPONS & PROMOTIONS
// ============================================================================

describe('getAdminCoupons', () => {
  it('should return coupons from prisma', async () => {
    const data = [{ id: 'c1', code: 'SAVE10' }];
    (mockPrisma.coupon.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminCoupons(req(), res, next);
    await flush();
    expect(mockPrisma.coupon.findMany).toHaveBeenCalledWith({
      include: {
        business: { select: { id: true, name: true, slug: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAdminPromotions', () => {
  it('should return promotions from prisma', async () => {
    const data = [{ id: 'p1', title: 'Summer Sale' }];
    (mockPrisma.promotion.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminPromotions(req(), res, next);
    await flush();
    expect(mockPrisma.promotion.findMany).toHaveBeenCalledWith({
      include: { business: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getAdminCouponStats', () => {
  it('should return coupon and promotion stats', async () => {
    (mockPrisma.coupon.count as jest.Mock).mockResolvedValueOnce(100);
    (mockPrisma.coupon.count as jest.Mock).mockResolvedValueOnce(50);
    (mockPrisma.coupon.count as jest.Mock).mockResolvedValueOnce(30);
    (mockPrisma.coupon.count as jest.Mock).mockResolvedValueOnce(20);
    (mockPrisma.promotion.count as jest.Mock).mockResolvedValueOnce(10);
    (mockPrisma.promotion.count as jest.Mock).mockResolvedValueOnce(5);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getAdminCouponStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        totalCoupons: 100,
        activeCoupons: 50,
        usedCoupons: 30,
        expiredCoupons: 20,
        totalPromotions: 10,
        activePromotions: 5,
      },
    });
  });
});

describe('disableAdminCoupon', () => {
  it('should disable a coupon', async () => {
    const updated = { id: 'c1', status: 'DISABLED' };
    (mockPrisma.coupon.update as jest.Mock).mockResolvedValue(updated);
    const res = mockRes();
    const next = jest.fn();
    ctrl.disableAdminCoupon(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(mockPrisma.coupon.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'DISABLED' },
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: updated,
      message: 'Code promo désactivé',
    });
  });
});

// ============================================================================
// PLATFORM REVENUE
// ============================================================================

describe('getPlatformRevenue', () => {
  it('should return revenue stats for default period', async () => {
    const data = { total: 10000 };
    getPlatformRevenueStats.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getPlatformRevenue(req(), res, next);
    await flush();
    expect(getPlatformRevenueStats).toHaveBeenCalledWith('30d');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('should use period from params or query', async () => {
    const data = { total: 5000 };
    getPlatformRevenueStats.mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getPlatformRevenue(req({ params: { period: '7d' } }), res, next);
    await flush();
    expect(getPlatformRevenueStats).toHaveBeenCalledWith('7d');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

// ============================================================================
// CAMPAIGNS
// ============================================================================

describe('getCampaigns', () => {
  it('should return campaigns with optional status filter', async () => {
    const data = [{ id: 'c1', name: 'Campaign1' }];
    (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaigns(req({ query: { status: 'ACTIVE' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { steps: true, executionLogs: true } } },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('should return all campaigns when no status filter', async () => {
    (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaigns(req(), res, next);
    await flush();
    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { steps: true, executionLogs: true } } },
    });
  });
});

describe('getCampaign', () => {
  it('should return a campaign with steps and logs', async () => {
    const data = { id: 'c1', steps: [], executionLogs: [] };
    (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
      where: { id: 'c1' },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        executionLogs: { orderBy: { executedAt: 'desc' }, take: 50 },
      },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('should throw 404 if campaign not found', async () => {
    (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaign(req({ params: { id: 'nonexistent' } }), res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});

describe('createCampaign', () => {
  it('should create a campaign', async () => {
    const data = { id: 'c1', name: 'New Campaign' };
    (mockPrisma.campaign.create as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.createCampaign(req({ body: { name: 'New Campaign' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.create).toHaveBeenCalledWith({ data: { name: 'New Campaign' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Campagne creee' });
  });
});

describe('updateCampaign', () => {
  it('should update a campaign', async () => {
    const data = { id: 'c1', name: 'Updated' };
    (mockPrisma.campaign.update as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.updateCampaign(req({ params: { id: 'c1' }, body: { name: 'Updated' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { name: 'Updated' },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Campagne mise a jour' });
  });
});

describe('deleteCampaign', () => {
  it('should delete a campaign', async () => {
    (mockPrisma.campaign.delete as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    ctrl.deleteCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Campagne supprimee' });
  });
});

describe('startCampaign', () => {
  it('should start a campaign and set startedAt', async () => {
    const data = { id: 'c1', status: 'ACTIVE', startedAt: new Date() };
    (mockPrisma.campaign.update as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.startCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'ACTIVE', startedAt: expect.any(Date) },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Campagne demarree' });
  });
});

describe('getCampaignTemplates', () => {
  it('should return active campaign templates', async () => {
    const data = [{ id: 'c1', isTemplate: true, steps: [] }];
    (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaignTemplates(req(), res, next);
    await flush();
    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
      where: { isTemplate: true, status: 'ACTIVE' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});

describe('getCampaignExecutionLogs', () => {
  it('should return execution logs for a campaign', async () => {
    const data = [{ id: 'l1', campaignId: 'c1' }];
    (mockPrisma.campaignExecutionLog.findMany as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    ctrl.getCampaignExecutionLogs(req({ params: { campaignId: 'c1' } }), res, next);
    await flush();
    expect(mockPrisma.campaignExecutionLog.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'c1' },
      orderBy: { executedAt: 'desc' },
      take: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});
