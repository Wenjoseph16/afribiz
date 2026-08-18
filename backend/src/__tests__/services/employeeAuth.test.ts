/**
 * Tests du service employeeAuth (Chantier 7 — Login Employé par PIN)
 *
 * Seam testé : authenticateEmployee(params)
 *  - Succès : phone + PIN valide → token JWT avec permissions
 *  - Échec : business introuvable → 404
 *  - Échec : employé introuvable → 401
 *  - Échec : PIN invalide → 401
 *  - Échec : pas de PIN configuré → 400
 */
import { mockPrisma } from '../setup';
import { hashPassword } from '@/lib/password';
import { verifyAccessToken, isEmployeeToken } from '@/lib/jwt';
import { authenticateEmployee } from '@/services/employeeAuth';

describe('employeeAuth — authenticateEmployee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns token with permissions on valid PIN', async () => {
    const hashedPin = await hashPassword('1234');

    mockPrisma.business.findFirst.mockResolvedValue({
      id: 'biz-1',
      name: 'Ma Boutique',
    });
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      position: 'Caissier',
      photo: null,
      pinCode: hashedPin,
      maxDiscountPercentage: 10,
      employeeRole: {
        id: 'role-1',
        name: 'Vendeur',
        permissions: ['VIEW_ORDERS', 'MODIFY_STOCK'],
      },
    });

    const result = await authenticateEmployee({
      businessId: 'biz-1',
      phone: '+22501020304',
      pinCode: '1234',
    });

    expect(result.token).toBeDefined();
    expect(result.expiresIn).toBe('12h');
    expect(result.permissions).toEqual(['VIEW_ORDERS', 'MODIFY_STOCK']);
    expect(result.maxDiscountPercentage).toBe(10);
    expect(result.employee.firstName).toBe('Jean');

    // Le token est bien un token employé
    const decoded = verifyAccessToken(result.token);
    expect(isEmployeeToken(decoded)).toBe(true);
    if (isEmployeeToken(decoded)) {
      expect(decoded.employeeId).toBe('emp-1');
      expect(decoded.businessId).toBe('biz-1');
    }
  });

  test('throws 404 when business not found', async () => {
    mockPrisma.business.findFirst.mockResolvedValue(null);

    await expect(
      authenticateEmployee({ businessId: 'bad', phone: '+225', pinCode: '1234' })
    ).rejects.toThrow('Business introuvable ou inactif');
  });

  test('throws 401 when employee not found', async () => {
    mockPrisma.business.findFirst.mockResolvedValue({ id: 'biz-1', name: 'Boutique' });
    mockPrisma.employee.findFirst.mockResolvedValue(null);

    await expect(
      authenticateEmployee({ businessId: 'biz-1', phone: '+225', pinCode: '1234' })
    ).rejects.toThrow('Identifiants invalides');
  });

  test('throws 401 on wrong PIN', async () => {
    const hashedPin = await hashPassword('1234');

    mockPrisma.business.findFirst.mockResolvedValue({ id: 'biz-1', name: 'Boutique' });
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1', firstName: 'Jean', lastName: 'Dupont', position: 'Caissier',
      photo: null, pinCode: hashedPin, maxDiscountPercentage: null,
      employeeRole: { id: 'r1', name: 'Vendeur', permissions: ['VIEW_ORDERS'] },
    });

    await expect(
      authenticateEmployee({ businessId: 'biz-1', phone: '+225', pinCode: '9999' })
    ).rejects.toThrow('Identifiants invalides');
  });

  test('throws 400 when no PIN configured', async () => {
    mockPrisma.business.findFirst.mockResolvedValue({ id: 'biz-1', name: 'Boutique' });
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-1', firstName: 'Jean', lastName: 'Dupont', position: 'Caissier',
      photo: null, pinCode: null, maxDiscountPercentage: null, employeeRole: null,
    });

    await expect(
      authenticateEmployee({ businessId: 'biz-1', phone: '+225', pinCode: '1234' })
    ).rejects.toThrow('Aucun code PIN configuré');
  });

  test('handles employee without role (empty permissions)', async () => {
    const hashedPin = await hashPassword('5678');

    mockPrisma.business.findFirst.mockResolvedValue({ id: 'biz-1', name: 'Boutique' });
    mockPrisma.employee.findFirst.mockResolvedValue({
      id: 'emp-2', firstName: 'Marie', lastName: 'Martin', position: 'Aide',
      photo: null, pinCode: hashedPin, maxDiscountPercentage: null, employeeRole: null,
    });

    const result = await authenticateEmployee({
      businessId: 'biz-1', phone: '+22505060708', pinCode: '5678',
    });

    expect(result.permissions).toEqual([]);
    expect(result.maxDiscountPercentage).toBeNull();
  });
});
