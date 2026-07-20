import { mockPrisma } from '../setup';
import {
  getSimulationEnvironments,
  testEndpoint,
  getSimulationLogs,
  getMockData,
  getAvailableEndpoints,
} from '../../services/simulation';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockProfile = { id: 'dev-1', userId: 'u1' };
const mockModules = [
  { id: 'mod-1', name: 'Payment', slug: 'payment', version: '1.0', category: 'FINANCE' },
];

describe('simulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSimulationEnvironments', () => {
    it('should return modules when profile exists', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      jest.spyOn(mockPrisma.developerModule, 'findMany').mockResolvedValue(mockModules as any);
      const r = await getSimulationEnvironments('u1');
      expect(r).toHaveLength(1);
      expect(r[0].slug).toBe('payment');
      expect(r[0].status).toBe('ready');
    });

    it('should return empty array when no profile', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
      const r = await getSimulationEnvironments('u1');
      expect(r).toEqual([]);
    });
  });

  describe('testEndpoint', () => {
    beforeEach(() => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      jest.spyOn(mockPrisma.developerModule, 'findFirst').mockResolvedValue(mockModules[0] as any);
    });

    it('should throw if profile not found', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
      await expect(testEndpoint('u1', 'payment', '/install', 'POST')).rejects.toThrow(AppError);
    });

    it('should throw if module not found', async () => {
      jest.spyOn(mockPrisma.developerModule, 'findFirst').mockResolvedValue(null);
      await expect(testEndpoint('u1', 'unknown', '/install', 'POST')).rejects.toThrow(AppError);
    });

    it('should return mock response for known endpoint', async () => {
      const r = await testEndpoint('u1', 'payment', '/install', 'POST');
      expect(r.statusCode).toBe(200);
      expect(r.response.success).toBe(true);
      expect(r.response.data.status).toBe('installed');
    });

    it('should return generic response for unknown endpoint', async () => {
      const r = await testEndpoint('u1', 'payment', '/custom', 'GET');
      expect(r.statusCode).toBe(200);
      expect(r.response.data.message).toContain('simulé');
    });
  });

  describe('getSimulationLogs', () => {
    it('should return empty array', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      const r = await getSimulationLogs('u1');
      expect(r).toEqual([]);
    });

    it('should return empty when no profile', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
      const r = await getSimulationLogs('u1');
      expect(r).toEqual([]);
    });
  });

  describe('getMockData', () => {
    it('should return mock businesses', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      const r = await getMockData('u1', 'payment', 'businesses');
      expect(r).toHaveLength(5);
      expect(r[0].name).toBe('Entreprise 1');
    });

    it('should return mock users', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      const r = await getMockData('u1', 'payment', 'users');
      expect(r).toHaveLength(10);
    });

    it('should return empty array for unknown type', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(mockProfile);
      const r = await getMockData('u1', 'payment', 'unknown');
      expect(r).toEqual([]);
    });

    it('should throw if no profile', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
      await expect(getMockData('u1', 'payment', 'businesses')).rejects.toThrow(AppError);
    });
  });

  describe('getAvailableEndpoints', () => {
    it('should return list of endpoints', async () => {
      const r = await getAvailableEndpoints();
      expect(r).toHaveLength(6);
      expect(r[0].path).toBe('/install');
    });
  });
});
