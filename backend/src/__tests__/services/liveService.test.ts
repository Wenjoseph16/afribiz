import { mockPrisma } from '../setup';
import {
  getActiveLives,
  getLiveById,
  createLive,
  startLive,
  endLive,
  joinLive,
  getLiveChats,
  getLiveStats,
} from '../../services/liveService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockLive = {
  id: 'live-1',
  businessId: 'b1',
  title: 'Live Test',
  status: 'SCHEDULED',
  scheduledAt: new Date(),
  createdAt: new Date(),
};

describe('Live Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getActiveLives returns active lives', async () => {
    mockPrisma.live.findMany.mockResolvedValue([mockLive as any]);
    mockPrisma.live.count.mockResolvedValue(1);
    const r = await getActiveLives();
    expect(r.items).toHaveLength(1);
  });

  test('getLiveById returns live', async () => {
    mockPrisma.live.findUnique.mockResolvedValue(mockLive as any);
    const r = await getLiveById('live-1');
    expect(r?.id).toBe('live-1');
  });

  test('createLive creates', async () => {
    mockPrisma.live.create.mockResolvedValue(mockLive as any);
    mockPrisma.liveProduct.createMany.mockResolvedValue({ count: 0 } as any);
    mockPrisma.feedItem.create.mockResolvedValue({} as any);
    mockPrisma.live.findUnique.mockResolvedValue(mockLive as any);
    const r = await createLive({
      businessId: 'b1',
      title: 'Live Test',
      scheduledAt: new Date().toISOString(),
    });
    expect(r?.id).toBe('live-1');
  });

  test('startLive starts a live', async () => {
    mockPrisma.live.findFirst.mockResolvedValue(mockLive as any);
    mockPrisma.live.update.mockResolvedValue({ ...mockLive, status: 'LIVE' } as any);
    const r = await startLive('live-1', 'b1');
    expect(r).toBeDefined();
  });

  test('endLive ends a live', async () => {
    mockPrisma.live.findFirst.mockResolvedValue({ ...mockLive, status: 'LIVE' } as any);
    mockPrisma.live.update.mockResolvedValue({ ...mockLive, status: 'ENDED' } as any);
    await expect(endLive('live-1', 'b1')).resolves.not.toThrow();
  });

  test('joinLive adds participant', async () => {
    mockPrisma.liveParticipant.findFirst.mockResolvedValue(null);
    mockPrisma.liveParticipant.create.mockResolvedValue({} as any);
    mockPrisma.live.update.mockResolvedValue({} as any);
    await expect(joinLive('live-1', 'u1')).resolves.not.toThrow();
  });

  test('getLiveChats returns chats', async () => {
    mockPrisma.liveChat.findMany.mockResolvedValue([
      {
        id: 'chat-1',
        liveId: 'live-1',
        message: 'Hello',
        userId: 'u1',
        createdAt: new Date(),
      } as any,
    ]);
    const r = await getLiveChats('live-1');
    expect(r).toHaveLength(1);
  });

  test('getLiveStats returns stats', async () => {
    mockPrisma.live.count.mockResolvedValue(5);
    mockPrisma.live.aggregate.mockResolvedValue({ _sum: { viewerCountPeak: 100 } } as any);
    mockPrisma.liveChat.count.mockResolvedValue(20);
    const r = await getLiveStats('b1');
    expect(r.totalLives).toBe(5);
  });
});
