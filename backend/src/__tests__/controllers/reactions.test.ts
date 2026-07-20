jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/reactions';

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

describe('reactions controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessageReactions', () => {
    it('should return grouped reactions', async () => {
      mockPrisma.messageReaction.findMany.mockResolvedValue([
        { id: 'r1', messageId: 'm1', userId: 'u1', emoji: '👍' },
        { id: 'r2', messageId: 'm1', userId: 'u2', emoji: '👍' },
        { id: 'r3', messageId: 'm1', userId: 'u1', emoji: '❤️' },
      ]);
      const res = mockRes();
      ctrl.getMessageReactions(req({ params: { messageId: 'm1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.messageReaction.findMany).toHaveBeenCalledWith({
        where: { messageId: 'm1' },
      });
      expect(res.json).toHaveBeenCalled();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.reactions['👍'].count).toBe(2);
      expect(data.myReactions).toEqual(['👍', '❤️']);
    });
  });

  describe('addReaction', () => {
    it('should create reaction and return 201', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'm1',
        conversation: { participants: ['u1', 'u2'] },
      });
      mockPrisma.messageReaction.findUnique.mockResolvedValue(null);
      mockPrisma.messageReaction.create.mockResolvedValue({ id: 'r1', emoji: '👍' });
      const res = mockRes();
      ctrl.addReaction(req({ params: { messageId: 'm1' }, body: { emoji: '👍' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 200 if reaction already exists', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'm1',
        conversation: { participants: ['u1'] },
      });
      mockPrisma.messageReaction.findUnique.mockResolvedValue({ id: 'r1', emoji: '👍' });
      const res = mockRes();
      ctrl.addReaction(req({ params: { messageId: 'm1' }, body: { emoji: '👍' } }), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if emoji missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.addReaction(req({ params: { messageId: 'm1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 404 if message not found', async () => {
      mockPrisma.message.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.addReaction(req({ params: { messageId: 'none' }, body: { emoji: '👍' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('should return 403 if not a participant', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'm1',
        conversation: { participants: ['other'] },
      });
      const res = mockRes();
      const next = jest.fn();
      ctrl.addReaction(req({ params: { messageId: 'm1' }, body: { emoji: '👍' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction', async () => {
      mockPrisma.messageReaction.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrisma.messageReaction.delete.mockResolvedValue({ id: 'r1' });
      const res = mockRes();
      ctrl.removeReaction(req({ params: { messageId: 'm1', emoji: '👍' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.messageReaction.delete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 if reaction not found', async () => {
      mockPrisma.messageReaction.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.removeReaction(req({ params: { messageId: 'm1', emoji: '👍' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
