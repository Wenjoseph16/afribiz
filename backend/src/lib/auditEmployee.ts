import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { logger } from './logger';

/**
 * Trace une action d'employé sur une opération critique (Chantier 7)
 *
 * Appelé dans les contrôleurs/services quand une action est effectuée :
 *  - createOrder, deleteProduct, closeCashSession, applyDiscount, etc.
 *
 * @param params.businessId - ID du business
 * @param params.employeeId - ID de l'employé (undefined si boss)
 * @param params.action - Description de l'action (ex: 'ORDER_CREATED', 'PRODUCT_DELETED')
 * @param params.module - Module concerné (ex: 'ORDERS', 'PRODUCTS', 'CASH')
 * @param params.description - Description lisible
 * @param params.metadata - Données supplémentaires (orderId, productId, etc.)
 * @param params.ipAddress - IP de l'employé
 */
export async function auditEmployeeAction(params: {
  businessId: string;
  employeeId?: string;
  action: string;
  module?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  const { businessId, employeeId, action, module: mod, description, metadata, ipAddress } = params;

  // Si pas d'employeeId, c'est le boss → pas besoin de tracer dans EmployeeActivity
  // (le boss a déjà le SecurityLog pour les actions auth)
  if (!employeeId) return;

  try {
    await prisma.employeeActivity.create({
      data: {
        businessId,
        employeeId,
        action,
        module: mod || undefined,
        description: description || undefined,
        metadata: (metadata || undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: ipAddress || undefined,
      },
    });
  } catch (e) {
    // L'audit logging ne doit JAMAIS faire échouer l'opération
    logger.error('Audit trail failed', { error: e, action, employeeId });
  }
}
