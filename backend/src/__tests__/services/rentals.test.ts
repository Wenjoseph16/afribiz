import { mockPrisma } from '../setup';
import {
  listRentals,
  createRental,
  createRentalBooking,
  getRentalStats,
} from '../../services/rentals';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'LocT', modules: ['RENTALS'], settings: {} };
const mockRental = {
  id: 'rent-1',
  businessId: 'biz-1',
  name: 'Voiture',
  price: 15000,
  type: 'VEHICLE',
  isActive: true,
};

describe('Rentals Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue(mockBiz as any);
  });

  test('listRentals returns paginated', async () => {
    mockPrisma.rental.findMany.mockResolvedValue([mockRental as any]);
    mockPrisma.rental.count.mockResolvedValue(1);
    const r = await listRentals('u1', {} as any);
    expect(r.total).toBe(1);
  });

  test('createRental creates', async () => {
    mockPrisma.rental.create.mockResolvedValue(mockRental as any);
    const r = await createRental('u1', { name: 'Voiture', price: 15000, type: 'VEHICLE' });
    expect(r.id).toBe('rent-1');
  });

  test('createRentalBooking creates booking', async () => {
    mockPrisma.rental.findUnique.mockResolvedValue(mockRental as any);
    mockPrisma.booking.create.mockResolvedValue({
      id: 'bk-1',
      title: 'Location: Voiture',
      status: 'PENDING',
      rental: mockRental,
    } as any);
    const r = await createRentalBooking('u1', {
      rentalId: 'rent-1',
      startDate: '2024-06-01',
      endDate: '2024-06-05',
    } as any);
    expect(r).toBeDefined();
  });

  test('getRentalStats aggregates', async () => {
    mockPrisma.rental.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    const r = await getRentalStats('u1');
    expect(r.total).toBe(5);
  });
});
