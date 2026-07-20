import { mockPrisma } from '../setup';
import {
  listBusinessBookings,
  getBusinessBooking,
  createBooking,
  updateBookingStatus,
  getBookingStats,
} from '../../services/bookings';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishBookingCreated: jest.fn(),
  publishBookingStatusChanged: jest.fn(),
}));

const mockBiz = {
  id: 'biz-1',
  name: 'TestBiz',
  modules: ['BOOKINGS'],
  settings: { currency: 'FCFA' },
};
const mockBk = {
  id: 'bk-1',
  businessId: 'biz-1',
  bookingNumber: 'RES-001',
  title: 'Test',
  status: 'CONFIRMED',
  startDate: new Date(),
  endDate: new Date(),
  price: 15000,
  createdAt: new Date(),
};

describe('Bookings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
  });
  test('listBusinessBookings returns paginated', async () => {
    jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([mockBk]);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(1);
    const r = await listBusinessBookings('u1', {});
    expect(r.total).toBe(1);
  });
  test('getBusinessBooking returns booking', async () => {
    jest.spyOn(mockPrisma.booking, 'findFirst').mockResolvedValue(mockBk);
    const r = await getBusinessBooking('u1', 'bk-1');
    expect(r.id).toBe('bk-1');
  });
  test('createBooking creates via transaction', async () => {
    const mockTx = {
      booking: {
        create: jest.fn().mockResolvedValue(mockBk),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    (mockPrisma as any).$transaction = jest.fn().mockImplementation(async (fn) => fn(mockTx));
    const r = await createBooking('u1', {
      title: 'Test',
      startDate: new Date().toISOString(),
      type: 'SERVICE',
    });
    expect(r.id).toBe('bk-1');
  });
  test('updateBookingStatus changes status', async () => {
    jest.spyOn(mockPrisma.booking, 'findFirst').mockResolvedValue(mockBk);
    jest.spyOn(mockPrisma.booking, 'update').mockResolvedValue({ ...mockBk, status: 'COMPLETED' });
    const r = await updateBookingStatus('u1', 'bk-1', 'COMPLETED');
    expect(r.status).toBe('COMPLETED');
  });
  test('getBookingStats aggregates', async () => {
    for (const s of ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValueOnce(1);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    jest.spyOn(mockPrisma.booking, 'aggregate').mockResolvedValue({ _sum: { price: 100000 } });
    jest.spyOn(mockPrisma.booking, 'groupBy').mockResolvedValue([{ type: 'SERVICE', _count: 5 }]);
    const r = await getBookingStats('u1');
    expect(r.totalRevenue).toBe(100000);
  });
});
