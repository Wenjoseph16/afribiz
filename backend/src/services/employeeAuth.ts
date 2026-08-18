import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { comparePasswords } from '../lib/password';
import { createEmployeeToken } from '../lib/jwt';
import { logger } from '../lib/logger';

/**
 * Authentification employé par PIN (Chantier 7 — Brique RBAC)
 *
 * Endpoint : POST /api/business/:businessId/employee-auth
 * Body      : { phone, pinCode }
 *
 * Mécanisme :
 *  1. Valide le business existe et est actif
 *  2. Trouve l'employé par phone + businessId (actif uniquement)
 *  3. Compare le PIN hashé (bcrypt)
 *  4. Charge le EmployeeRole + permissions
 *  5. Émet un JWT dédié (12h) portant :
 *     - authType: 'employee'
 *     - employeeId, businessId
 *     - permissions[] (de EmployeeRole)
 *     - maxDiscountPercentage (optionnel)
 */
export async function authenticateEmployee(params: {
  businessId: string;
  phone: string;
  pinCode: string;
}): Promise<{
  token: string;
  expiresIn: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    photo: string | null;
  };
  permissions: string[];
  maxDiscountPercentage: number | null;
}> {
  const { businessId, phone, pinCode } = params;

  // 1. Vérifier que le business existe et est actif
  const business = await prisma.business.findFirst({
    where: { id: businessId, isActive: true, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) {
    throw new AppError('Business introuvable ou inactif', 404);
  }

  // 2. Trouver l'employé par phone + business (actif uniquement)
  const employee = await prisma.employee.findFirst({
    where: {
      businessId,
      phone,
      isActive: true,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
      photo: true,
      pinCode: true,
      maxDiscountPercentage: true,
      employeeRole: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  if (!employee) {
    // Ne pas révéler si le phone existe mais l'employé est inactif
    throw new AppError('Identifiants invalides', 401);
  }

  // 3. Vérifier le PIN
  if (!employee.pinCode) {
    throw new AppError(
      'Aucun code PIN configuré pour cet employé. Contactez le gérant.',
      400
    );
  }

  const pinValid = await comparePasswords(pinCode, employee.pinCode);
  if (!pinValid) {
    throw new AppError('Identifiants invalides', 401);
  }

  // 4. Charger les permissions (ou liste vide si pas de rôle)
  const permissions: string[] = employee.employeeRole?.permissions ?? [];
  const maxDiscount = employee.maxDiscountPercentage
    ? Number(employee.maxDiscountPercentage)
    : null;

  // 5. Émettre le JWT employé
  const token = createEmployeeToken({
    authType: 'employee',
    employeeId: employee.id,
    businessId,
    permissions,
    ...(maxDiscount !== null ? { maxDiscountPercentage: maxDiscount } : {}),
  });

  logger.info(`Employee auth success: ${employee.firstName} ${employee.lastName} (${business.name})`);

  return {
    token,
    expiresIn: '12h',
    employee: {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      photo: employee.photo,
    },
    permissions,
    maxDiscountPercentage: maxDiscount,
  };
}
