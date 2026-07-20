import { mockPrisma } from '../setup';
import {
  listDeliveryZones,
  createDeliveryZone,
  listDrivers,
  createDriver,
  listDeliveries,
  createDelivery,
  assignDriver,
  updateDeliveryStatus,
  getDeliveryStats,
} from '../../services/delivery';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishDeliveryAssigned: jest.fn(),
  publishDeliveryStarted: jest.fn(),
  publishDeliveryCompleted: jest.fn(),
  publishDeliveryFailed: jest.fn(),
}));
jest.mock('../../lib/businessAccess', () => ({
  getBusinessByOwner: jest.fn().mockResolvedValue({ id: 'biz-1' }),
}));
jest.mock('../../services/socket', () => ({ getIO: jest.fn().mockReturnValue(null) }));

describe('Delivery Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('listDeliveryZones returns zones', async () => {
    jest
      .spyOn(mockPrisma.deliveryZone, 'findMany')
      .mockResolvedValue([{ id: 'z-1', name: 'Zone A', fee: 1000 }]);
    const r = await listDeliveryZones('u1');
    expect(r).toHaveLength(1);
  });
  test('createDeliveryZone creates', async () => {
    jest
      .spyOn(mockPrisma.deliveryZone, 'create')
      .mockResolvedValue({ id: 'z-1', name: 'Zone A', fee: 1000 });
    const r = await createDeliveryZone('u1', { name: 'Zone A' });
    expect(r.name).toBe('Zone A');
  });
  test('listDrivers returns drivers', async () => {
    jest
      .spyOn(mockPrisma.driver, 'findMany')
      .mockResolvedValue([{ id: 'd-1', name: 'Paul', phone: '+22501', status: 'AVAILABLE' }]);
    const r = await listDrivers('u1');
    expect(r).toHaveLength(1);
  });
  test('listDeliveries returns paginated', async () => {
    jest
      .spyOn(mockPrisma.delivery, 'findMany')
      .mockResolvedValue([
        { id: 'del-1', deliveryNumber: 'LIV-001', status: 'PENDING', address: 'Yopougon' },
      ]);
    jest.spyOn(mockPrisma.delivery, 'count').mockResolvedValue(1);
    const r = await listDeliveries('u1', {});
    expect(r.total).toBe(1);
  });
  test('assignDriver assigns driver', async () => {
    jest
      .spyOn(mockPrisma.delivery, 'findFirst')
      .mockResolvedValue({ id: 'del-1', businessId: 'biz-1' });
    jest
      .spyOn(mockPrisma.driver, 'findFirst')
      .mockResolvedValue({ id: 'd-1', name: 'Paul', businessId: 'biz-1' });
    jest
      .spyOn(mockPrisma.delivery, 'update')
      .mockResolvedValue({ id: 'del-1', status: 'ASSIGNED' });
    const r = await assignDriver('u1', 'del-1', 'd-1');
    expect(r.status).toBe('ASSIGNED');
  });
  test('getDeliveryStats aggregates', async () => {
    jest.spyOn(mockPrisma.delivery, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.driver, 'count').mockResolvedValue(3);
    jest.spyOn(mockPrisma.deliveryZone, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.delivery, 'aggregate').mockResolvedValue({ _avg: { actualMinutes: 30 } });
    const r = await getDeliveryStats('u1');
    expect(r.total).toBe(10);
    expect(r.availableDrivers).toBe(3);
  });
});
