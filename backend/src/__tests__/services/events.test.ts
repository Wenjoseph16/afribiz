import { mockPrisma } from '../setup';
import {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  registerParticipant,
} from '../../services/events';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishUpcomingEvent: jest.fn() }));
jest.mock('qrcode', () => ({ toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,qr') }));

const mockBiz = { id: 'biz-1', name: 'TestBiz' };
const mockEvt = {
  id: 'evt-1',
  businessId: 'biz-1',
  title: 'Concert',
  startDate: new Date(),
  status: 'SCHEDULED',
  isPublished: true,
  isActive: true,
  capacity: 100,
  deletedAt: null,
};

describe('Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findFirst').mockResolvedValue(mockBiz);
  });
  test('listEvents returns paginated', async () => {
    jest.spyOn(mockPrisma.event, 'findMany').mockResolvedValue([mockEvt]);
    jest.spyOn(mockPrisma.event, 'count').mockResolvedValue(1);
    const r = await listEvents('u1', {});
    expect(r.total).toBe(1);
  });
  test('createEvent creates', async () => {
    jest.spyOn(mockPrisma.event, 'create').mockResolvedValue(mockEvt);
    const r = await createEvent('u1', { title: 'Concert', startDate: new Date().toISOString() });
    expect(r.id).toBe('evt-1');
  });
  test('getEvent returns event', async () => {
    jest.spyOn(mockPrisma.event, 'findFirst').mockResolvedValue(mockEvt);
    expect((await getEvent('u1', 'evt-1')).id).toBe('evt-1');
  });
  test('updateEvent updates', async () => {
    jest.spyOn(mockPrisma.event, 'findFirst').mockResolvedValue(mockEvt);
    jest.spyOn(mockPrisma.event, 'update').mockResolvedValue({ ...mockEvt, title: 'Updated' });
    const r = await updateEvent('u1', 'evt-1', { title: 'Updated' });
    expect(r.title).toBe('Updated');
  });
  test('deleteEvent soft deletes', async () => {
    jest.spyOn(mockPrisma.event, 'findFirst').mockResolvedValue(mockEvt);
    jest.spyOn(mockPrisma.event, 'update').mockResolvedValue(mockEvt);
    await deleteEvent('u1', 'evt-1');
    expect(mockPrisma.event.update).toHaveBeenCalled();
  });
  test('getEventStats aggregates', async () => {
    jest.spyOn(mockPrisma.event, 'findFirst').mockResolvedValue(mockEvt);
    jest.spyOn(mockPrisma.eventParticipant, 'count').mockResolvedValue(50);
    jest.spyOn(mockPrisma.eventScan, 'count').mockResolvedValue(30);
    jest
      .spyOn(mockPrisma.eventParticipant, 'aggregate')
      .mockResolvedValue({ _sum: { price: 500000 } });
    const r = await getEventStats('u1', 'evt-1');
    expect(r.totalParticipants).toBe(50);
  });
  test('registerParticipant creates participant', async () => {
    jest.spyOn(mockPrisma.event, 'findFirst').mockResolvedValue(mockEvt);
    jest.spyOn(mockPrisma.eventParticipant, 'count').mockResolvedValue(0);
    jest.spyOn(mockPrisma.eventParticipant, 'create').mockResolvedValue({
      id: 'p-1',
      eventId: 'evt-1',
      firstName: 'Jean',
      lastName: 'Kone',
      ticketRef: 'TKT-001',
      status: 'CONFIRMED',
    });
    const r = await registerParticipant('u1', 'evt-1', { firstName: 'Jean', lastName: 'Kone' });
    expect(r.id).toBe('p-1');
  });
});
