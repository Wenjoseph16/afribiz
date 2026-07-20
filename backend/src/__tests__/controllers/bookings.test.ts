import * as bookingCtrl from '../../controllers/bookings';

jest.mock('../../services/bookings', () => ({
  listBusinessBookings: jest.fn(),
  getBusinessBooking: jest.fn(),
  createBooking: jest.fn(),
  updateBooking: jest.fn(),
  updateBookingStatus: jest.fn(),
  deleteBooking: jest.fn(),
  getBookingStats: jest.fn(),
  listTimeSlots: jest.fn(),
  createTimeSlot: jest.fn(),
  updateTimeSlot: jest.fn(),
  deleteTimeSlot: jest.fn(),
  listResources: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deleteResource: jest.fn(),
  getCalendarBookings: jest.fn(),
  sendReminder: jest.fn(),
}));

import * as bookingService from '../../services/bookings';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('bookings controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listBusinessBookings', async () => {
    (bookingService.listBusinessBookings as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.listBusinessBookings(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessBooking', async () => {
    (bookingService.getBusinessBooking as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.getBusinessBooking(req({ params: { id: 'b1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createBooking returns 201', async () => {
    (bookingService.createBooking as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.createBooking(req({ body: { resourceId: 'r1', date: '2025-06-01' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateBooking', async () => {
    (bookingService.updateBooking as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.updateBooking(
      req({ params: { id: 'b1' }, body: { date: '2025-06-02' } }),
      res,
      next
    );
    await flush();
    expect(bookingService.updateBooking).toHaveBeenCalled();
  });

  it('updateBookingStatus', async () => {
    (bookingService.updateBookingStatus as jest.Mock).mockResolvedValue({
      id: 'b1',
      status: 'CONFIRMED',
    });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.updateBookingStatus(
      req({ params: { id: 'b1' }, body: { status: 'CONFIRMED' } }),
      res,
      next
    );
    await flush();
    expect(bookingService.updateBookingStatus).toHaveBeenCalled();
  });

  it('deleteBooking', async () => {
    (bookingService.deleteBooking as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.deleteBooking(req({ params: { id: 'b1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBookingStats', async () => {
    (bookingService.getBookingStats as jest.Mock).mockResolvedValue({ total: 20 });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.getBookingStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listTimeSlots', async () => {
    (bookingService.listTimeSlots as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.listTimeSlots(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createTimeSlot returns 201', async () => {
    (bookingService.createTimeSlot as jest.Mock).mockResolvedValue({ id: 'ts1' });
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.createTimeSlot(req({ body: { startTime: '09:00', endTime: '10:00' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listResources', async () => {
    (bookingService.listResources as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.listResources(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getCalendarBookings', async () => {
    (bookingService.getCalendarBookings as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.getCalendarBookings(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    bookingCtrl.listBusinessBookings({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
