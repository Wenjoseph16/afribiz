/**
 * Developer Validation Service — unit tests
 */

import { mockPrisma } from '../setup';
import * as validationService from '../../services/developerValidation';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: 'dev-1', userId: 'user-1' }),
  },
}));

describe('DeveloperValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitForValidation', () => {
    it('should create validation with PENDING status and 6 checks', async () => {
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue({
        id: 'module-1',
        developerId: 'dev-1',
        status: 'DRAFT',
      });
      (mockPrisma.developerModuleVersion.findFirst as jest.Mock).mockResolvedValue({
        id: 'ver-1',
        version: '1.0.0',
      });
      (mockPrisma.moduleValidation.create as jest.Mock).mockResolvedValue({
        id: 'val-1',
        status: 'PENDING',
        checks: [
          { type: 'CODE_QUALITY', status: 'PENDING' },
          { type: 'SECURITY', status: 'PENDING' },
          { type: 'PERFORMANCE', status: 'PENDING' },
          { type: 'DOCUMENTATION', status: 'PENDING' },
          { type: 'COMPATIBILITY', status: 'PENDING' },
          { type: 'MARKETPLACE', status: 'PENDING' },
        ],
      });
      (mockPrisma.developerModule.update as jest.Mock).mockResolvedValue({});

      const result = await validationService.submitForValidation('user-1', 'module-1');
      expect(result.status).toBe('PENDING');
      expect(result.checks).toHaveLength(6);
    });

    it('should throw if module not found', async () => {
      (mockPrisma.developerModule.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        validationService.submitForValidation('user-1', 'invalid-module')
      ).rejects.toThrow(AppError);
    });
  });

  describe('approveValidationCheck', () => {
    it('should mark check as completed with score', async () => {
      (mockPrisma.validationCheck.update as jest.Mock).mockResolvedValue({
        id: 'check-1',
        status: 'COMPLETED',
        score: 85,
        passed: true,
        completedAt: new Date(),
      });

      const result = await validationService.approveValidationCheck('check-1', 85, 'Good quality');
      expect(result.passed).toBe(true);
      expect(mockPrisma.validationCheck.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'check-1' },
          data: expect.objectContaining({ score: 85 }),
        })
      );
    });

    it('should set passed=false if score below 70', async () => {
      (mockPrisma.validationCheck.update as jest.Mock).mockResolvedValue({
        id: 'check-1',
        status: 'COMPLETED',
        score: 50,
        passed: false,
        completedAt: new Date(),
      });

      const result = await validationService.approveValidationCheck(
        'check-1',
        50,
        'Needs improvement'
      );
      expect(result.passed).toBe(false);
    });
  });

  describe('rejectValidationCheck', () => {
    it('should mark check as failed with 0 score', async () => {
      (mockPrisma.validationCheck.update as jest.Mock).mockResolvedValue({
        id: 'check-1',
        status: 'COMPLETED',
        score: 0,
        passed: false,
        completedAt: new Date(),
      });

      const result = await validationService.rejectValidationCheck(
        'check-1',
        'Security vulnerability'
      );
      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('completeValidation', () => {
    it('should APPROVE and publish module', async () => {
      (mockPrisma.moduleValidation.findUnique as jest.Mock).mockResolvedValue({
        id: 'val-1',
        moduleId: 'module-1',
        checks: [
          { id: 'c1', status: 'COMPLETED', score: 85 },
          { id: 'c2', status: 'COMPLETED', score: 90 },
        ],
      });
      (mockPrisma.moduleValidation.update as jest.Mock).mockResolvedValue({
        id: 'val-1',
        status: 'APPROVED',
        score: 88,
      });
      (mockPrisma.developerModule.update as jest.Mock).mockResolvedValue({});

      const result = await validationService.completeValidation('val-1', 'admin-1', 'APPROVED');
      expect(result.status).toBe('APPROVED');
      expect(result.score).toBe(88);
    });

    it('should REJECT when checks not all completed', async () => {
      (mockPrisma.moduleValidation.findUnique as jest.Mock).mockResolvedValue({
        id: 'val-1',
        moduleId: 'module-1',
        checks: [
          { id: 'c1', status: 'PENDING', score: null }, // not completed
          { id: 'c2', status: 'COMPLETED', score: 90 },
        ],
      });

      await expect(
        validationService.completeValidation('val-1', 'admin-1', 'APPROVED')
      ).rejects.toThrow(AppError);
    });

    it('should apply CHANGES_REQUESTED and set module to DRAFT', async () => {
      (mockPrisma.moduleValidation.findUnique as jest.Mock).mockResolvedValue({
        id: 'val-1',
        moduleId: 'module-1',
        checks: [],
      });
      (mockPrisma.moduleValidation.update as jest.Mock).mockResolvedValue({
        id: 'val-1',
        status: 'CHANGES_REQUESTED',
      });
      (mockPrisma.developerModule.update as jest.Mock).mockResolvedValue({});

      const result = await validationService.completeValidation(
        'val-1',
        'admin-1',
        'CHANGES_REQUESTED',
        'Please add documentation'
      );
      expect(result.status).toBe('CHANGES_REQUESTED');
    });
  });

  describe('getModuleValidation / getValidationHistory / getPendingValidations', () => {
    it('should return latest validation with checks and version', async () => {
      (mockPrisma.moduleValidation.findFirst as jest.Mock).mockResolvedValue({
        id: 'val-1',
        status: 'APPROVED',
        checks: [],
        version: { id: 'ver-1', version: '1.0.0', changelog: null },
      });

      const result = await validationService.getModuleValidation('module-1');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('APPROVED');
      expect(result!.version?.version).toBe('1.0.0');
    });

    it('should return history', async () => {
      (mockPrisma.moduleValidation.findMany as jest.Mock).mockResolvedValue([
        { id: 'val-1', status: 'APPROVED', checks: [] },
      ]);

      const result = await validationService.getValidationHistory('module-1');
      expect(result).toHaveLength(1);
    });

    it('should return pending validations for admin', async () => {
      (mockPrisma.moduleValidation.findMany as jest.Mock).mockResolvedValue([
        { id: 'val-1', status: 'PENDING', module: { name: 'Module 1' }, checks: [] },
      ]);

      const result = await validationService.getPendingValidations();
      expect(result).toHaveLength(1);
      expect(mockPrisma.moduleValidation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
        })
      );
    });
  });
});
