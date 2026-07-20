import { mockPrisma } from '../setup';
import { listRooms, createRoom, getRoomStats } from '../../services/room';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'HotelT', modules: ['ROOMS'], settings: {}, ownerId: 'u1' };
const mockRoom = {
  id: 'room-1',
  businessId: 'biz-1',
  name: 'Suite',
  price: 25000,
  capacity: 2,
  isActive: true,
};

describe('Room Service', () => {
  beforeEach(() => {
    const m = mockPrisma.business;
    m.findUnique = jest.fn().mockResolvedValue(mockBiz as any);
  });

  test('listRooms returns paginated', async () => {
    mockPrisma.room.findMany.mockResolvedValue([mockRoom as any]);
    mockPrisma.room.count.mockResolvedValue(1);
    const r = await listRooms('u1', { page: 1, limit: 20 } as any);
    expect((r as any).pagination.total).toBe(1);
  });

  test('createRoom creates room', async () => {
    mockPrisma.room.create.mockResolvedValue(mockRoom as any);
    const r = await createRoom('u1', { name: 'Suite', price: 25000, capacity: 2 } as any);
    expect(r.id).toBe('room-1');
  });

  test('getRoomStats aggregates', async () => {
    mockPrisma.room.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4);
    mockPrisma.booking.count.mockResolvedValue(8);
    const r = await getRoomStats('u1');
    expect(r.totalRooms).toBe(10);
  });
});
