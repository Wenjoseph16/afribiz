import { mockPrisma } from '../setup';
import * as devPerms from '../../services/developerPermissions';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: { findByUserId: jest.fn() },
}));

const { DeveloperRepository } = require('../../repositories/developerRepository');

const mockProfile = { id: 'dp-1', userId: 'u1' };
const mockModule = { id: 'mod-1', developerId: 'dp-1' };
const mockPermission = {
  id: 'perm-1',
  moduleId: 'mod-1',
  resource: 'orders',
  accessLevel: 'READ',
  description: 'Read orders',
  isRequired: true,
};
const mockConfig = { id: 'cfg-1', moduleId: 'mod-1', businessId: 'biz-1', isActive: true };

describe('developerPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getModulePermissions', () => {
    test('returns permissions for a module', async () => {
      (mockPrisma.modulePermission.findMany as jest.Mock).mockResolvedValue([mockPermission]);
      const r = await devPerms.getModulePermissions('mod-1');
      expect(r).toHaveLength(1);
    });

    test('returns empty array when none exist', async () => {
      (mockPrisma.modulePermission.findMany as jest.Mock).mockResolvedValue([]);
      const r = await devPerms.getModulePermissions('mod-1');
      expect(r).toEqual([]);
    });
  });

  describe('addModulePermission', () => {
    test('creates permission successfully', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue(mockModule);
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.modulePermission.create as jest.Mock).mockResolvedValue(mockPermission);
      const r = await devPerms.addModulePermission('u1', 'mod-1', {
        resource: 'orders',
        accessLevel: 'READ',
        description: 'Read orders',
      });
      expect(r.id).toBe('perm-1');
    });

    test('throws if developer profile not found', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(null);
      await expect(
        devPerms.addModulePermission('u-x', 'mod-1', { resource: 'orders', accessLevel: 'READ' })
      ).rejects.toThrow('Profil développeur non trouvé');
    });

    test('throws if module not owned by developer', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        devPerms.addModulePermission('u1', 'bad-mod', { resource: 'orders', accessLevel: 'READ' })
      ).rejects.toThrow('Module non trouvé ou non autorisé');
    });

    test('throws if permission already exists', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue(mockModule);
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue(mockPermission);
      await expect(
        devPerms.addModulePermission('u1', 'mod-1', { resource: 'orders', accessLevel: 'READ' })
      ).rejects.toThrow('Cette permission existe déjà');
    });
  });

  describe('removeModulePermission', () => {
    test('removes permission', async () => {
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue({
        ...mockPermission,
        module: { developerId: 'dp-1' },
      });
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.modulePermission.delete as jest.Mock).mockResolvedValue(mockPermission);
      const r = await devPerms.removeModulePermission('u1', 'perm-1');
      expect(r.success).toBe(true);
    });

    test('throws if permission not found', async () => {
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(devPerms.removeModulePermission('u1', 'bad-id')).rejects.toThrow(
        'Permission non trouvée'
      );
    });

    test('throws if not authorized', async () => {
      (mockPrisma.modulePermission.findUnique as jest.Mock).mockResolvedValue({
        ...mockPermission,
        module: { developerId: 'dp-2' },
      });
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      await expect(devPerms.removeModulePermission('u1', 'perm-1')).rejects.toThrow('Non autorisé');
    });
  });

  describe('checkModulePermissions', () => {
    test('returns permission check result', async () => {
      (mockPrisma.modulePermission.findMany as jest.Mock).mockResolvedValue([mockPermission]);
      (mockPrisma.moduleConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);
      const r = await devPerms.checkModulePermissions('mod-1', 'biz-1');
      expect(r.permissions).toHaveLength(1);
      expect(r.granted).toBe(true);
    });
  });

  describe('getPermissionSummary', () => {
    test('groups permissions by access level', async () => {
      (mockPrisma.modulePermission.findMany as jest.Mock).mockResolvedValue([
        { resource: 'orders', accessLevel: 'READ', isRequired: true, description: '' },
        { resource: 'orders', accessLevel: 'WRITE', isRequired: true, description: '' },
        { resource: 'users', accessLevel: 'ADMIN', isRequired: false, description: '' },
      ]);
      const r = await devPerms.getPermissionSummary('mod-1');
      expect(r.readPermissions).toHaveLength(1);
      expect(r.writePermissions).toHaveLength(1);
      expect(r.adminPermissions).toHaveLength(1);
      expect(r.total).toBe(3);
      expect(r.required).toBe(2);
    });
  });
});
