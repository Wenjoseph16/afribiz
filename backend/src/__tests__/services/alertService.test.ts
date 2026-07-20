import { mockPrisma } from '../setup';
import {
  createAlert,
  updateAlert,
  deleteAlert,
  listAlerts,
  getAlert,
  triggerAlertsForBackInStock,
  triggerAlertsForPriceDrop,
} from '../../services/alertService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockAlert = {
  id: 'alert-1',
  userId: 'u1',
  type: 'BACK_IN_STOCK',
  referenceId: 'p1',
  businessId: 'b1',
  label: 'Produit',
  isActive: true,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Alert Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createAlert creates', async () => {
    mockPrisma.alert.findUnique.mockResolvedValue(null);
    mockPrisma.alert.create.mockResolvedValue(mockAlert as any);
    const r = await createAlert('u1', { type: 'BACK_IN_STOCK', referenceId: 'p1' });
    expect(r.id).toBe('alert-1');
  });

  test('createAlert updates existing (not throw)', async () => {
    mockPrisma.alert.findUnique.mockResolvedValue(mockAlert as any);
    mockPrisma.alert.update.mockResolvedValue({ ...mockAlert, label: 'Updated' } as any);
    const r = await createAlert('u1', {
      type: 'BACK_IN_STOCK',
      referenceId: 'p1',
      label: 'Updated',
    });
    expect(r.label).toBe('Updated');
  });

  test('updateAlert updates', async () => {
    mockPrisma.alert.findFirst.mockResolvedValue(mockAlert as any);
    mockPrisma.alert.update.mockResolvedValue({ ...mockAlert, label: 'Updated' } as any);
    const r = await updateAlert('u1', 'alert-1', { label: 'Updated' });
    expect(r?.label).toBe('Updated');
  });

  test('deleteAlert deletes', async () => {
    mockPrisma.alert.findFirst.mockResolvedValue(mockAlert as any);
    mockPrisma.alert.delete.mockResolvedValue(mockAlert as any);
    await expect(deleteAlert('u1', 'alert-1')).resolves.not.toThrow();
  });

  test('listAlerts returns paginated', async () => {
    mockPrisma.alert.findMany.mockResolvedValue([mockAlert as any]);
    mockPrisma.alert.count.mockResolvedValue(1);
    const r = await listAlerts('u1', {});
    expect(r.alerts).toHaveLength(1);
    expect(r.total).toBe(1);
  });

  test('getAlert returns by id', async () => {
    mockPrisma.alert.findFirst.mockResolvedValue(mockAlert as any);
    const r = await getAlert('u1', 'alert-1');
    expect(r?.id).toBe('alert-1');
  });

  test('triggerAlertsForBackInStock returns alerts array', async () => {
    mockPrisma.alert.findMany.mockResolvedValue([mockAlert as any]);
    mockPrisma.alert.update.mockResolvedValue(mockAlert as any);
    const alerts = await triggerAlertsForBackInStock('p1', 'Produit test', 'b1');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('alert-1');
  });

  test('triggerAlertsForPriceDrop returns alerts array', async () => {
    mockPrisma.alert.findMany.mockResolvedValue([mockAlert as any]);
    mockPrisma.alert.update.mockResolvedValue(mockAlert as any);
    const alerts = await triggerAlertsForPriceDrop('p1', 'Produit test', 'b1', 5000, 10000);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('alert-1');
  });
});
