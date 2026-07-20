import { mockPrisma } from '../setup';
import {
  listUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  convertValue,
  getCategories,
} from '../../services/africanUnitService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockUnit = {
  id: 'u1',
  name: 'Calebasse',
  category: 'VOLUME',
  standardUnit: 'L',
  conversionRate: 0.5,
  description: null,
  region: 'West Africa',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('africanUnitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listUnits returns active units', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findMany').mockResolvedValue([mockUnit]);
    const r = await listUnits();
    expect(r).toHaveLength(1);
  });

  test('listUnits filters by category and region', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findMany').mockResolvedValue([mockUnit]);
    const r = await listUnits('VOLUME', 'West Africa');
    expect(r).toHaveLength(1);
  });

  test('getUnit returns or throws', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(mockUnit);
    expect((await getUnit('u1')).name).toBe('Calebasse');
  });

  test('getUnit throws if not found', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(null);
    await expect(getUnit('x')).rejects.toThrow('non trouvée');
  });

  test('createUnit creates', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'create').mockResolvedValue(mockUnit);
    const r = await createUnit({
      name: 'Calebasse',
      category: 'VOLUME',
      standardUnit: 'L',
      conversionRate: 0.5,
    });
    expect(r.name).toBe('Calebasse');
  });

  test('updateUnit updates', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(mockUnit);
    jest
      .spyOn(mockPrisma.africanUnit, 'update')
      .mockResolvedValue({ ...mockUnit, name: 'Updated' });
    const r = await updateUnit('u1', { name: 'Updated' });
    expect(r.name).toBe('Updated');
  });

  test('updateUnit throws if not found', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(null);
    await expect(updateUnit('x', { name: 'X' })).rejects.toThrow('non trouvée');
  });

  test('deleteUnit deletes', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(mockUnit);
    jest.spyOn(mockPrisma.africanUnit, 'delete').mockResolvedValue(mockUnit);
    await deleteUnit('u1');
    expect(mockPrisma.africanUnit.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  test('convertValue converts to standard', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(mockUnit);
    const r = await convertValue('u1', 10, true);
    expect(r.value).toBe(5);
    expect(r.unit).toBe('L');
  });

  test('convertValue converts from standard', async () => {
    jest.spyOn(mockPrisma.africanUnit, 'findUnique').mockResolvedValue(mockUnit);
    const r = await convertValue('u1', 5, false);
    expect(r.value).toBe(10);
    expect(r.unit).toBe('Calebasse');
  });

  test('getCategories returns grouped', async () => {
    jest
      .spyOn(mockPrisma.africanUnit, 'groupBy')
      .mockResolvedValue([{ category: 'VOLUME', _count: 5 }]);
    const r = await getCategories();
    expect(r).toHaveLength(1);
    expect(r[0].category).toBe('VOLUME');
  });
});
