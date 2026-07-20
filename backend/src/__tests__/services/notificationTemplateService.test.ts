import { mockPrisma } from '../setup';
import { notificationTemplateService } from '../../services/notificationTemplateService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../repositories/notificationTemplateRepository', () => ({
  notificationTemplateRepository: {
    findByBusiness: jest.fn(),
    upsert: jest.fn(),
    deleteByBusinessAndType: jest.fn(),
    updateByBusinessAndType: jest.fn(),
  },
}));

describe('NotificationTemplate Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getTemplates returns templates', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'u1' });
    const {
      notificationTemplateRepository,
    } = require('../../repositories/notificationTemplateRepository');
    notificationTemplateRepository.findByBusiness.mockResolvedValue([]);
    const r = await notificationTemplateService.getTemplates('b1');
    expect(r).toEqual([]);
  });

  test('upsertTemplate upserts', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'u1' });
    const {
      notificationTemplateRepository,
    } = require('../../repositories/notificationTemplateRepository');
    notificationTemplateRepository.upsert.mockResolvedValue({ id: 'tpl-1' });
    const r = await notificationTemplateService.upsertTemplate(
      'b1',
      'u1',
      'ORDER_CONFIRMATION' as any,
      { customTitle: 'Test' }
    );
    expect(r).toBeDefined();
  });

  test('deleteTemplate deletes', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'u1' });
    const {
      notificationTemplateRepository,
    } = require('../../repositories/notificationTemplateRepository');
    await expect(
      notificationTemplateService.deleteTemplate('b1', 'u1', 'ORDER_CONFIRMATION' as any)
    ).resolves.not.toThrow();
  });

  test('getAvailableTypes returns types', async () => {
    const r = await notificationTemplateService.getAvailableTypes();
    expect(Array.isArray(r)).toBe(true);
  });
});
