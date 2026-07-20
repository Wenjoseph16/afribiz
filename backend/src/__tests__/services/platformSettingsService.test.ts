import { mockPrisma } from '../setup';
import {
  getVerificationSettings,
  updateVerificationSettings,
} from '../../services/platformSettingsService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockSetting = {
  id: 'ps-1',
  key: 'verification_mode',
  value: { mode: 'badge_only', description: 'Description test' },
  category: 'security',
  label: 'Mode de vérification',
  description: 'Description',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Platform Settings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getVerificationSettings returns settings', async () => {
    (mockPrisma as any).platformSetting.findUnique.mockResolvedValue(mockSetting);
    const r = await getVerificationSettings();
    expect(r.mode).toBe('badge_only');
  });

  test('getVerificationSettings creates defaults if missing', async () => {
    (mockPrisma as any).platformSetting.findUnique.mockResolvedValue(null);
    const r = await getVerificationSettings();
    expect(r.mode).toBe('badge_only');
  });

  test('updateVerificationSettings updates', async () => {
    (mockPrisma as any).platformSetting.findUnique.mockResolvedValue(mockSetting);
    (mockPrisma as any).platformSetting.upsert.mockResolvedValue(mockSetting);
    const r = await updateVerificationSettings({
      mode: 'required',
      description: 'Vérification requise',
    });
    expect(r.mode).toBe('required');
  });
});
