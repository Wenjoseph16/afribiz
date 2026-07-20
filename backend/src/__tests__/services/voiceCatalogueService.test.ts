import { mockPrisma } from '../setup';
import * as svc from '../../services/voiceCatalogueService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

function mockBusinessFound() {
  mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
}

describe('voiceCatalogueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listVoiceCommands', () => {
    it('should list active voice commands', async () => {
      const cmds = [{ id: 'c1', command: 'order', isActive: true }];
      mockPrisma.voiceCommand.findMany.mockResolvedValue(cmds);
      const result = await svc.listVoiceCommands();
      expect(mockPrisma.voiceCommand.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(cmds);
    });
  });

  describe('createVoiceCommand', () => {
    it('should create a voice command', async () => {
      const cmd = { id: 'c1', command: 'order', action: 'ORDER' };
      mockPrisma.voiceCommand.create.mockResolvedValue(cmd);
      const result = await svc.createVoiceCommand({ command: 'order', action: 'ORDER' });
      expect(mockPrisma.voiceCommand.create).toHaveBeenCalledWith({
        data: { command: 'order', action: 'ORDER', isActive: true },
      });
      expect(result).toEqual(cmd);
    });
  });

  describe('updateVoiceCommand', () => {
    it('should update existing command', async () => {
      mockPrisma.voiceCommand.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.voiceCommand.update.mockResolvedValue({ id: 'c1', command: 'new' });
      const result = await svc.updateVoiceCommand('c1', { command: 'new' });
      expect(mockPrisma.voiceCommand.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { command: 'new' },
      });
      expect(result).toEqual({ id: 'c1', command: 'new' });
    });

    it('should throw 404 if not found', async () => {
      mockPrisma.voiceCommand.findUnique.mockResolvedValue(null);
      await expect(svc.updateVoiceCommand('none', {})).rejects.toThrow(
        'Commande vocale non trouvée'
      );
    });
  });

  describe('deleteVoiceCommand', () => {
    it('should delete existing command', async () => {
      mockPrisma.voiceCommand.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.voiceCommand.delete.mockResolvedValue({} as any);
      await svc.deleteVoiceCommand('c1');
      expect(mockPrisma.voiceCommand.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should throw 404 if not found', async () => {
      mockPrisma.voiceCommand.findUnique.mockResolvedValue(null);
      await expect(svc.deleteVoiceCommand('none')).rejects.toThrow('Commande vocale non trouvée');
    });
  });

  describe('listVoiceQueries', () => {
    it('should list queries for business', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.findMany.mockResolvedValue([{ id: 'q1', query: 'test' }]);
      const result = await svc.listVoiceQueries('u1');
      expect(mockPrisma.business.findUnique).toHaveBeenCalledWith({
        where: { ownerId: 'u1' },
        select: { id: true },
      });
      expect(mockPrisma.voiceQuery.findMany).toHaveBeenCalledWith({
        where: { businessId: 'b1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'q1', query: 'test' }]);
    });

    it('should throw 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      await expect(svc.listVoiceQueries('u1')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('createVoiceQuery', () => {
    it('should create query with SEARCH action by default', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.create.mockResolvedValue({
        id: 'q1',
        query: 'hello',
        action: 'SEARCH',
      });
      const result = await svc.createVoiceQuery('u1', { query: 'hello' });
      expect(mockPrisma.voiceQuery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ businessId: 'b1', query: 'hello', action: 'SEARCH' }),
        })
      );
      expect(result).toEqual({ id: 'q1', query: 'hello', action: 'SEARCH' });
    });

    it('should detect ORDER action', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.create.mockResolvedValue({} as any);
      await svc.createVoiceQuery('u1', { query: 'commander du riz' });
      expect(mockPrisma.voiceQuery.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'ORDER' }) })
      );
    });

    it('should detect CALL action', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.create.mockResolvedValue({} as any);
      await svc.createVoiceQuery('u1', { query: 'appeler le service' });
      expect(mockPrisma.voiceQuery.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'CALL' }) })
      );
    });

    it('should detect BOOK action', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.create.mockResolvedValue({} as any);
      await svc.createVoiceQuery('u1', { query: 'reserver une table' });
      expect(mockPrisma.voiceQuery.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'BOOK' }) })
      );
    });
  });

  describe('getVoiceStats', () => {
    it('should return stats grouped by action', async () => {
      mockBusinessFound();
      mockPrisma.voiceQuery.count.mockResolvedValue(10);
      mockPrisma.voiceQuery.groupBy.mockResolvedValue([
        { action: 'SEARCH', _count: 6 },
        { action: 'ORDER', _count: 4 },
      ]);
      const result = await svc.getVoiceStats('u1');
      expect(result).toEqual({
        totalQueries: 10,
        byAction: [
          { action: 'SEARCH', count: 6 },
          { action: 'ORDER', count: 4 },
        ],
      });
    });
  });
});
