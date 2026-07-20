import { mockPrisma } from '../setup';
import {
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformSettingsByCategory,
  getFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
  getAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getAdminUsers,
  getAutomationRules,
  createAutomationRule,
  toggleAutomationRule,
  getCmsPages,
  createCmsPage,
  deleteCmsPage,
  publishCmsPage,
  getFormTemplates,
  getFormTemplate,
  createFormTemplate,
  getNotificationTemplates,
  createNotificationTemplate,
  getMediaModerationItems,
  reportMedia,
  approveMedia,
  getModerationStats,
  getCommissionConfigs,
  createCommissionConfig,
  deleteCommissionConfig,
  issueWarning,
  revokeWarning,
  getAllWarnings,
  getAllSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  addPlanPrivilege,
  updatePlanPrivilege,
  removePlanPrivilege,
  getAdminPermissions,
  getAdminRoles as getRolesFn,
} from '../../services/adminFeaturesService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockSetting = { id: 's1', key: 'platformName', value: 'AfriBiz', category: 'general' };
const mockFlag = {
  id: 'f1',
  key: 'test-flag',
  label: 'Test',
  enabled: false,
  scope: 'GLOBAL',
  createdAt: new Date(),
};
const mockRole = {
  id: 'r1',
  name: 'Admin',
  description: '',
  isSystem: false,
  createdAt: new Date(),
  permissions: [],
  _count: { admins: 0 },
};
const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: null,
  isActive: true,
  createdAt: new Date(),
};
const mockPage = {
  id: 'p1',
  slug: 'test-page',
  title: 'Test',
  content: 'Hello',
  status: 'DRAFT',
  authorId: 'u1',
  createdAt: new Date(),
  author: { id: 'u1', firstName: 'John', lastName: 'Doe' },
};
const mockTemplate = {
  id: 't1',
  name: 'Test',
  slug: 'test',
  schema: {},
  status: 'DRAFT',
  createdAt: new Date(),
};
const mockNotifTpl = {
  id: 'n1',
  type: 'ORDER_PLACED',
  channel: 'EMAIL',
  content: 'Hi',
  createdAt: new Date(),
};
const mockModerationItem = {
  id: 'm1',
  contentType: 'IMAGE',
  contentId: 'c1',
  status: 'PENDING',
  reportedById: 'u1',
  createdAt: new Date(),
  reportedBy: { id: 'u1', firstName: 'John', lastName: 'Doe' },
  reviewedBy: null,
};
const mockCommission = {
  id: 'c1',
  key: 'test-commission',
  label: 'Test',
  rate: 10,
  isActive: true,
  minFee: null,
  maxFee: null,
  createdAt: new Date(),
};
const mockWarning = {
  id: 'w1',
  userId: 'u1',
  issuedById: 'u2',
  reason: 'Spam',
  createdAt: new Date(),
  issuedBy: { id: 'u2', firstName: 'Jane', lastName: 'Doe' },
};
const mockPlan = {
  id: 'pl1',
  name: 'Basic',
  price: 1000,
  currency: 'FCFA',
  billingCycle: 'MONTHLY',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  privileges: [],
};
const mockPrivilege = {
  id: 'pv1',
  planId: 'pl1',
  code: 'MAX_PRODUCTS',
  label: 'Max Products',
  value: 10,
  sortOrder: 1,
};

describe('adminFeaturesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform Settings', () => {
    test('getPlatformSettings returns mapped settings', async () => {
      jest.spyOn(mockPrisma.platformSetting, 'findMany').mockResolvedValue([mockSetting]);
      const r = await getPlatformSettings();
      expect(r.platformName).toBe('AfriBiz');
    });

    test('updatePlatformSettings upserts and returns', async () => {
      jest.spyOn(mockPrisma.platformSetting, 'upsert').mockResolvedValue(mockSetting);
      jest.spyOn(mockPrisma.platformSetting, 'findMany').mockResolvedValue([mockSetting]);
      const r = await updatePlatformSettings({ platformName: 'NewName' });
      expect(r.platformName).toBe('AfriBiz');
    });

    test('getPlatformSettingsByCategory filters by category', async () => {
      jest.spyOn(mockPrisma.platformSetting, 'findMany').mockResolvedValue([mockSetting]);
      const r = await getPlatformSettingsByCategory('general');
      expect(r.platformName).toBe('AfriBiz');
    });
  });

  describe('Feature Flags', () => {
    test('getFeatureFlags returns all', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findMany').mockResolvedValue([mockFlag]);
      const r = await getFeatureFlags();
      expect(r).toHaveLength(1);
    });

    test('getFeatureFlag returns or throws', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(mockFlag);
      expect((await getFeatureFlag('test-flag')).key).toBe('test-flag');
    });

    test('getFeatureFlag throws if not found', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(null);
      await expect(getFeatureFlag('missing')).rejects.toThrow('Feature flag not found');
    });

    test('createFeatureFlag creates', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.featureFlag, 'create').mockResolvedValue(mockFlag);
      const r = await createFeatureFlag({ key: 'test-flag', label: 'Test' });
      expect(r.key).toBe('test-flag');
    });

    test('createFeatureFlag throws if exists', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(mockFlag);
      await expect(createFeatureFlag({ key: 'test-flag', label: 'Test' })).rejects.toThrow(
        'already exists'
      );
    });

    test('updateFeatureFlag updates', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(mockFlag);
      jest
        .spyOn(mockPrisma.featureFlag, 'update')
        .mockResolvedValue({ ...mockFlag, enabled: true });
      const r = await updateFeatureFlag('f1', { enabled: true });
      expect(r.enabled).toBe(true);
    });

    test('toggleFeatureFlag toggles', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(mockFlag);
      jest
        .spyOn(mockPrisma.featureFlag, 'update')
        .mockResolvedValue({ ...mockFlag, enabled: true });
      const r = await toggleFeatureFlag('f1');
      expect(r.enabled).toBe(true);
    });

    test('deleteFeatureFlag deletes', async () => {
      jest.spyOn(mockPrisma.featureFlag, 'findUnique').mockResolvedValue(mockFlag);
      jest.spyOn(mockPrisma.featureFlag, 'delete').mockResolvedValue(mockFlag);
      const r = await deleteFeatureFlag('f1');
      expect(r.message).toContain('deleted');
    });
  });

  describe('Admin Roles', () => {
    test('getAdminRoles returns', async () => {
      jest.spyOn(mockPrisma.adminRole, 'findMany').mockResolvedValue([mockRole]);
      const r = await getAdminRoles();
      expect(r).toHaveLength(1);
    });

    test('createAdminRole creates', async () => {
      jest.spyOn(mockPrisma.adminRole, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.adminRole, 'create').mockResolvedValue(mockRole);
      const r = await createAdminRole({ name: 'Admin' });
      expect(r.name).toBe('Admin');
    });

    test('updateAdminRole throws for system roles', async () => {
      jest
        .spyOn(mockPrisma.adminRole, 'findUnique')
        .mockResolvedValue({ ...mockRole, isSystem: true });
      await expect(updateAdminRole('r1', { name: 'New' })).rejects.toThrow('cannot be modified');
    });

    test('deleteAdminRole throws for system roles', async () => {
      jest
        .spyOn(mockPrisma.adminRole, 'findUnique')
        .mockResolvedValue({ ...mockRole, isSystem: true });
      await expect(deleteAdminRole('r1')).rejects.toThrow('cannot be deleted');
    });

    test('assignRoleToUser assigns', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.adminRole, 'findUnique').mockResolvedValue(mockRole);
      jest.spyOn(mockPrisma.adminRoleAssignment, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(mockPrisma.adminRoleAssignment, 'create')
        .mockResolvedValue({ userId: 'u1', roleId: 'r1', role: mockRole });
      const r = await assignRoleToUser('u1', 'r1');
      expect(r.userId).toBe('u1');
    });

    test('removeRoleFromUser removes', async () => {
      jest
        .spyOn(mockPrisma.adminRoleAssignment, 'findUnique')
        .mockResolvedValue({ id: 'a1', userId: 'u1', roleId: 'r1' });
      jest.spyOn(mockPrisma.adminRoleAssignment, 'delete').mockResolvedValue({} as any);
      const r = await removeRoleFromUser('u1', 'r1');
      expect(r.message).toContain('removed');
    });

    test('getAdminPermissions returns', async () => {
      jest
        .spyOn(mockPrisma.adminPermission, 'findMany')
        .mockResolvedValue([{ id: 'p1', resource: 'users', action: 'read', description: '' }]);
      const r = await getAdminPermissions();
      expect(r).toHaveLength(1);
    });
  });

  describe('Automation Rules', () => {
    test('getAutomationRules returns', async () => {
      jest.spyOn(mockPrisma.automationRule, 'findMany').mockResolvedValue([
        {
          id: 'ar1',
          name: 'Rule',
          trigger: 'ORDER_PLACED',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ]);
      const r = await getAutomationRules();
      expect(r).toHaveLength(1);
    });

    test('createAutomationRule creates', async () => {
      jest
        .spyOn(mockPrisma.automationRule, 'create')
        .mockResolvedValue({ id: 'ar1', name: 'Rule' } as any);
      const r = await createAutomationRule({
        name: 'Rule',
        trigger: 'ORDER_PLACED',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {},
      });
      expect(r.id).toBe('ar1');
    });

    test('toggleAutomationRule toggles status', async () => {
      jest
        .spyOn(mockPrisma.automationRule, 'findUnique')
        .mockResolvedValue({ id: 'ar1', status: 'ACTIVE' });
      jest
        .spyOn(mockPrisma.automationRule, 'update')
        .mockResolvedValue({ id: 'ar1', status: 'PAUSED' });
      const r = await toggleAutomationRule('ar1');
      expect(r.status).toBe('PAUSED');
    });
  });

  describe('CMS Pages', () => {
    test('getCmsPages returns', async () => {
      jest.spyOn(mockPrisma.cmsPage, 'findMany').mockResolvedValue([mockPage]);
      const r = await getCmsPages();
      expect(r).toHaveLength(1);
    });

    test('createCmsPage creates', async () => {
      jest.spyOn(mockPrisma.cmsPage, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.cmsPage, 'create').mockResolvedValue(mockPage);
      const r = await createCmsPage({ slug: 'test-page', title: 'Test', content: 'Hello' }, 'u1');
      expect(r.slug).toBe('test-page');
    });

    test('deleteCmsPage deletes', async () => {
      jest.spyOn(mockPrisma.cmsPage, 'findUnique').mockResolvedValue(mockPage);
      jest.spyOn(mockPrisma.cmsPage, 'delete').mockResolvedValue(mockPage);
      const r = await deleteCmsPage('p1');
      expect(r.message).toContain('deleted');
    });

    test('publishCmsPage publishes', async () => {
      jest.spyOn(mockPrisma.cmsPage, 'findUnique').mockResolvedValue(mockPage);
      jest
        .spyOn(mockPrisma.cmsPage, 'update')
        .mockResolvedValue({ ...mockPage, status: 'PUBLISHED' });
      const r = await publishCmsPage('p1');
      expect(r.status).toBe('PUBLISHED');
    });
  });

  describe('Form Templates', () => {
    test('getFormTemplates returns', async () => {
      jest.spyOn(mockPrisma.formTemplate, 'findMany').mockResolvedValue([mockTemplate]);
      const r = await getFormTemplates();
      expect(r).toHaveLength(1);
    });

    test('getFormTemplate returns or throws', async () => {
      jest.spyOn(mockPrisma.formTemplate, 'findUnique').mockResolvedValue(mockTemplate);
      expect((await getFormTemplate('test')).slug).toBe('test');
    });

    test('createFormTemplate creates', async () => {
      jest.spyOn(mockPrisma.formTemplate, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.formTemplate, 'create').mockResolvedValue(mockTemplate);
      const r = await createFormTemplate({ name: 'Test', slug: 'test', schema: {} });
      expect(r.name).toBe('Test');
    });
  });

  describe('Notification Templates', () => {
    test('getNotificationTemplates returns', async () => {
      jest.spyOn(mockPrisma.notificationTemplate, 'findMany').mockResolvedValue([mockNotifTpl]);
      const r = await getNotificationTemplates();
      expect(r).toHaveLength(1);
    });

    test('createNotificationTemplate creates', async () => {
      jest.spyOn(mockPrisma.notificationTemplate, 'create').mockResolvedValue(mockNotifTpl);
      const r = await createNotificationTemplate({
        type: 'ORDER_PLACED',
        channel: 'EMAIL',
        content: 'Hi',
      });
      expect(r.channel).toBe('EMAIL');
    });
  });

  describe('Media Moderation', () => {
    test('getMediaModerationItems returns', async () => {
      jest
        .spyOn(mockPrisma.mediaModerationItem, 'findMany')
        .mockResolvedValue([mockModerationItem]);
      const r = await getMediaModerationItems();
      expect(r).toHaveLength(1);
    });

    test('reportMedia creates report', async () => {
      jest.spyOn(mockPrisma.mediaModerationItem, 'create').mockResolvedValue(mockModerationItem);
      const r = await reportMedia('IMAGE', 'c1', 'u1', 'Spam');
      expect(r.contentType).toBe('IMAGE');
    });

    test('approveMedia approves', async () => {
      jest
        .spyOn(mockPrisma.mediaModerationItem, 'findUnique')
        .mockResolvedValue(mockModerationItem);
      jest
        .spyOn(mockPrisma.mediaModerationItem, 'update')
        .mockResolvedValue({ ...mockModerationItem, status: 'APPROVED' });
      const r = await approveMedia('m1', 'u2');
      expect(r.status).toBe('APPROVED');
    });

    test('getModerationStats returns counts', async () => {
      jest.spyOn(mockPrisma.mediaModerationItem, 'count').mockResolvedValue(5);
      const r = await getModerationStats();
      expect(r.pending).toBe(5);
    });
  });

  describe('Commissions', () => {
    test('getCommissionConfigs returns', async () => {
      jest.spyOn(mockPrisma.commissionConfig, 'findMany').mockResolvedValue([mockCommission]);
      const r = await getCommissionConfigs();
      expect(r).toHaveLength(1);
    });

    test('createCommissionConfig creates', async () => {
      jest.spyOn(mockPrisma.commissionConfig, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.commissionConfig, 'create').mockResolvedValue(mockCommission);
      const r = await createCommissionConfig({ key: 'test-commission', label: 'Test' });
      expect(r.key).toBe('test-commission');
    });

    test('deleteCommissionConfig deletes', async () => {
      jest.spyOn(mockPrisma.commissionConfig, 'findUnique').mockResolvedValue(mockCommission);
      jest.spyOn(mockPrisma.commissionConfig, 'delete').mockResolvedValue(mockCommission);
      const r = await deleteCommissionConfig('c1');
      expect(r.message).toContain('deleted');
    });
  });

  describe('User Warnings', () => {
    test('issueWarning issues warning', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.userWarning, 'create').mockResolvedValue(mockWarning);
      const r = await issueWarning('u1', 'u2', 'Spam');
      expect(r.reason).toBe('Spam');
    });

    test('revokeWarning revokes', async () => {
      jest.spyOn(mockPrisma.userWarning, 'findUnique').mockResolvedValue(mockWarning);
      jest.spyOn(mockPrisma.userWarning, 'delete').mockResolvedValue(mockWarning);
      const r = await revokeWarning('w1');
      expect(r.message).toContain('revoked');
    });

    test('getAllWarnings returns', async () => {
      jest.spyOn(mockPrisma.userWarning, 'findMany').mockResolvedValue([mockWarning]);
      const r = await getAllWarnings();
      expect(r).toHaveLength(1);
    });
  });

  describe('Subscription Plans', () => {
    test('getAllSubscriptionPlans returns', async () => {
      jest.spyOn(mockPrisma.subscriptionPlan, 'findMany').mockResolvedValue([mockPlan]);
      const r = await getAllSubscriptionPlans();
      expect(r).toHaveLength(1);
    });

    test('getSubscriptionPlan returns or throws', async () => {
      jest.spyOn(mockPrisma.subscriptionPlan, 'findUnique').mockResolvedValue(mockPlan);
      const r = await getSubscriptionPlan('pl1');
      expect(r.name).toBe('Basic');
    });

    test('createSubscriptionPlan creates', async () => {
      jest.spyOn(mockPrisma.subscriptionPlan, 'create').mockResolvedValue(mockPlan);
      const r = await createSubscriptionPlan({ name: 'Basic', price: 1000 });
      expect(r.name).toBe('Basic');
    });

    test('addPlanPrivilege adds', async () => {
      jest.spyOn(mockPrisma.subscriptionPlan, 'findUnique').mockResolvedValue(mockPlan);
      jest.spyOn(mockPrisma.subscriptionPrivilege, 'create').mockResolvedValue(mockPrivilege);
      const r = await addPlanPrivilege('pl1', { code: 'MAX_PRODUCTS', label: 'Max Products' });
      expect(r.code).toBe('MAX_PRODUCTS');
    });

    test('updatePlanPrivilege updates', async () => {
      jest.spyOn(mockPrisma.subscriptionPrivilege, 'findUnique').mockResolvedValue(mockPrivilege);
      jest
        .spyOn(mockPrisma.subscriptionPrivilege, 'update')
        .mockResolvedValue({ ...mockPrivilege, label: 'Updated' });
      const r = await updatePlanPrivilege('pv1', { label: 'Updated' });
      expect(r.label).toBe('Updated');
    });

    test('removePlanPrivilege removes', async () => {
      jest.spyOn(mockPrisma.subscriptionPrivilege, 'findUnique').mockResolvedValue(mockPrivilege);
      jest.spyOn(mockPrisma.subscriptionPrivilege, 'delete').mockResolvedValue(mockPrivilege);
      const r = await removePlanPrivilege('pv1');
      expect(r.message).toContain('removed');
    });
  });
});
