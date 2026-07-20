import { mockPrisma } from '../setup';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listSessions,
  getSessionMessages,
  sendMessage,
  sendWhatsAppMessage,
  getWhatsAppStats,
} from '../../services/whatsappService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('WhatsApp Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listTemplates returns templates', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
    mockPrisma.whatsAppTemplate.findMany.mockResolvedValue([
      {
        id: 'tpl-1',
        name: 'Bienvenue',
        businessId: 'b1',
        category: 'MARKETING',
        language: 'fr',
        body: 'Bonjour',
        createdAt: new Date(),
      } as any,
    ]);
    const r = await listTemplates('u1');
    expect(r).toHaveLength(1);
  });

  test('createTemplate creates', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
    mockPrisma.whatsAppTemplate.create.mockResolvedValue({ id: 'tpl-1' } as any);
    const r = await createTemplate('u1', {
      name: 'Bienvenue',
      category: 'MARKETING',
      language: 'fr',
      body: 'Bonjour',
    });
    expect(r).toBeDefined();
  });

  test('sendWhatsAppMessage sends', async () => {
    const r = await sendWhatsAppMessage('+2250100000001', 'bienvenue', { name: 'Jean' });
    expect(r.success).toBe(true);
    expect(r.simulated).toBe(true);
  });

  test('getWhatsAppStats returns stats', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
    mockPrisma.whatsAppSession.count.mockResolvedValue(5);
    mockPrisma.whatsAppMessage.count.mockResolvedValue(20);
    mockPrisma.whatsAppTemplate.count.mockResolvedValue(3);
    const r = await getWhatsAppStats('u1');
    expect(r.totalSessions).toBe(5);
    expect(r.totalMessages).toBe(20);
  });
});
