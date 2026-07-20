jest.mock('../../services/rentals', () => ({
  listRentals: jest.fn(),
  getRental: jest.fn(),
  createRental: jest.fn(),
  updateRental: jest.fn(),
  deleteRental: jest.fn(),
  toggleRentalActive: jest.fn(),
  getRentalStats: jest.fn(),
  createRentalBooking: jest.fn(),
  prolongRentalBooking: jest.fn(),
}));

jest.mock('../../services/pdfGenerator', () => ({
  generateRentalContractPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/rentals';
import * as rsvc from '../../services/rentals';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('rentals controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadRentalContract', () => {
    it('should download PDF', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'book1',
        bookingNumber: 'BK-001',
        rental: {},
        client: {},
        business: {},
      });
      const res = mockRes();
      ctrl.downloadRentalContract(req({ params: { id: 'book1' } }), res, jest.fn());
      await flush();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if booking not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadRentalContract(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadRentalContract({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('CRUD', () => {
    it('listRentals', async () => {
      (rsvc.listRentals as jest.Mock).mockResolvedValue([{ id: 'r1' }]);
      const res = mockRes();
      ctrl.listRentals(req(), res, jest.fn());
      await flush();
      expect(rsvc.listRentals).toHaveBeenCalledWith('u1', {});
    });

    it('createRental', async () => {
      (rsvc.createRental as jest.Mock).mockResolvedValue({ id: 'r1' });
      const res = mockRes();
      ctrl.createRental(req({ body: { name: 'Bike' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateRental', async () => {
      (rsvc.updateRental as jest.Mock).mockResolvedValue({ id: 'r1' });
      const res = mockRes();
      ctrl.updateRental(req({ params: { id: 'r1' }, body: { price: 5000 } }), res, jest.fn());
      await flush();
    });

    it('deleteRental', async () => {
      (rsvc.deleteRental as jest.Mock).mockResolvedValue({ message: 'Deleted' });
      const res = mockRes();
      ctrl.deleteRental(req({ params: { id: 'r1' } }), res, jest.fn());
      await flush();
    });

    it('getRentalStats', async () => {
      (rsvc.getRentalStats as jest.Mock).mockResolvedValue({ total: 10, active: 5 });
      const res = mockRes();
      ctrl.getRentalStats(req(), res, jest.fn());
      await flush();
    });

    it('createRentalBooking', async () => {
      (rsvc.createRentalBooking as jest.Mock).mockResolvedValue({ id: 'book1' });
      const res = mockRes();
      ctrl.createRentalBooking(req({ body: { rentalId: 'r1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('prolongRentalBooking', async () => {
      (rsvc.prolongRentalBooking as jest.Mock).mockResolvedValue({ id: 'book1' });
      const res = mockRes();
      ctrl.prolongRentalBooking(
        req({ params: { id: 'book1' }, body: { days: 3 } }),
        res,
        jest.fn()
      );
      await flush();
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listRentals({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
