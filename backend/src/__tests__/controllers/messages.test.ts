import { mockPrisma } from '../setup';
import { sendMessage, getConversations } from '../../controllers/messages';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

async function flush() {
  await new Promise(process.nextTick);
}

describe('Messages Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('sendMessage sends message', async () => {
    const req = {
      user: { id: 'u1' },
      params: { conversationId: 'conv-1' },
      body: { content: 'Bonjour' },
    } as any;
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() } as any;
    const next = jest.fn();
    jest
      .spyOn(mockPrisma.conversation, 'findFirst')
      .mockResolvedValue({ id: 'conv-1', participants: ['u1', 'biz-1'] });
    jest.spyOn(mockPrisma.message, 'create').mockResolvedValue({ id: 'msg-1', content: 'Bonjour' });
    jest.spyOn(mockPrisma.conversation, 'update').mockResolvedValue({});
    (sendMessage as any)(req, res, next);
    await flush();
    expect(res.json).toHaveBeenCalled();
  });
  test('getConversations returns list', async () => {
    const req = { user: { id: 'u1' }, query: {} } as any;
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() } as any;
    const next = jest.fn();
    jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([
      {
        id: 'conv-1',
        participants: ['u1', 'biz-1'],
        messages: [],
        _count: { messages: 0 },
        lastMessageAt: new Date(),
      },
    ]);
    jest
      .spyOn(mockPrisma.business, 'findMany')
      .mockResolvedValue([{ ownerId: 'biz-1', name: 'Biz', logo: null, slug: 'biz' }]);
    jest.spyOn(mockPrisma.user, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.conversation, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.message, 'count').mockResolvedValue(0);
    (getConversations as any)(req, res, next);
    await flush();
    expect(res.json).toHaveBeenCalled();
  });
});
