import * as eventCtrl from '../../controllers/events';

jest.mock('../../services/events', () => ({
  listEvents: jest.fn(),
  getEvent: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  listTickets: jest.fn(),
  createTicket: jest.fn(),
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
  listParticipants: jest.fn(),
  registerParticipant: jest.fn(),
  clientRegisterForEvent: jest.fn(),
  updateParticipantStatus: jest.fn(),
  scanTicket: jest.fn(),
  listScans: jest.fn(),
  listPromotions: jest.fn(),
  createPromotion: jest.fn(),
  deletePromotion: jest.fn(),
  listGallery: jest.fn(),
  addGalleryItem: jest.fn(),
  deleteGalleryItem: jest.fn(),
  listPartners: jest.fn(),
  addPartner: jest.fn(),
  removePartner: jest.fn(),
  getEventStats: jest.fn(),
  getDashboardStats: jest.fn(),
  getPublicEvent: jest.fn(),
  registerPublicParticipant: jest.fn(),
  getMyTicket: jest.fn(),
}));

import * as eventService from '../../services/events';

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

describe('events controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listEvents', async () => {
    (eventService.listEvents as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.listEvents(req({ query: { page: '1', limit: '20' } }), res, next);
    await flush();
    expect(eventService.listEvents).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getEvent', async () => {
    (eventService.getEvent as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.getEvent(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createEvent returns 201', async () => {
    (eventService.createEvent as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.createEvent(req({ body: { title: 'Workshop', date: '2025-01-01' } }), res, next);
    await flush();
    expect(eventService.createEvent).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateEvent', async () => {
    (eventService.updateEvent as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.updateEvent(req({ params: { id: 'e1' }, body: { title: 'Updated' } }), res, next);
    await flush();
    expect(eventService.updateEvent).toHaveBeenCalled();
  });

  it('deleteEvent', async () => {
    (eventService.deleteEvent as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.deleteEvent(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listTickets', async () => {
    (eventService.listTickets as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.listTickets(req({ params: { eventId: 'e1' } }), res, next);
    await flush();
    expect(eventService.listTickets).toHaveBeenCalled();
  });

  it('createTicket returns 201', async () => {
    (eventService.createTicket as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.createTicket(
      req({ params: { eventId: 'e1' }, body: { name: 'VIP', price: 5000 } }),
      res,
      next
    );
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('registerParticipant', async () => {
    (eventService.registerParticipant as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.registerParticipant(
      req({ params: { eventId: 'e1' }, body: { ticketId: 't1' } }),
      res,
      next
    );
    await flush();
    expect(eventService.registerParticipant).toHaveBeenCalled();
  });

  it('clientRegisterForEvent', async () => {
    (eventService.clientRegisterForEvent as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.clientRegisterForEvent(
      req({ params: { id: 'e1' }, body: { ticketId: 't1' } }),
      res,
      next
    );
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('scanTicket', async () => {
    (eventService.scanTicket as jest.Mock).mockResolvedValue({ valid: true });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.scanTicket(req({ body: { eventId: 'e1', ticketCode: 'TCK001' } }), res, next);
    await flush();
    expect(eventService.scanTicket).toHaveBeenCalled();
  });

  it('getEventStats', async () => {
    (eventService.getEventStats as jest.Mock).mockResolvedValue({ totalParticipants: 50 });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.getEventStats(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getPublicEvent', async () => {
    (eventService.getPublicEvent as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.getPublicEvent({ params: { slug: 'my-event' } } as any, res, next);
    await flush();
    expect(eventService.getPublicEvent).toHaveBeenCalled();
  });

  it('registerPublicParticipant', async () => {
    (eventService.registerPublicParticipant as jest.Mock).mockResolvedValue({
      ticketCode: 'TCK001',
    });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.registerPublicParticipant(
      { params: { slug: 'my-event' }, body: { name: 'John' } } as any,
      res,
      next
    );
    await flush();
    expect(eventService.registerPublicParticipant).toHaveBeenCalled();
  });

  it('getMyTicket', async () => {
    (eventService.getMyTicket as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.getMyTicket(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(eventService.getMyTicket).toHaveBeenCalled();
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    eventCtrl.listEvents({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
