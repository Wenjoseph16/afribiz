import { prisma } from '../lib/db';

/**
 * Audit service for monetization settings changes.
 * Logs every modification of PlatformSetting rates so admins
 * can track who changed what and when.
 */

export interface MonetizationAuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  key: string;
  oldValue?: any;
  newValue?: any;
  changedByUserId: string;
  source: 'admin_settings_page' | 'commissions_page' | 'seed' | 'api';
}

/**
 * Log a monetization setting change to the security log.
 */
export async function logMonetizationChange(
  entry: MonetizationAuditEntry
): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId: entry.changedByUserId,
        action: 'ADMIN_SETTINGS_CHANGE',
        metadata: {
          resource: 'monetization',
          resourceId: entry.key,
          changeAction: entry.action,
          key: entry.key,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          source: entry.source,
        },
        ipAddress: '',
      },
    });
  } catch (err) {
    // Non-critical: silently fail audit logging so it never blocks a settings save
    console.error('Failed to audit monetization change:', err);
  }
}

/**
 * Log multiple monetization setting changes at once (e.g. batch save from admin settings page).
 */
export async function logMonetizationChanges(
  changes: { key: string; oldValue?: any; newValue?: any }[],
  changedByUserId: string,
  source: MonetizationAuditEntry['source'] = 'admin_settings_page'
): Promise<void> {
  for (const change of changes) {
    await logMonetizationChange({
      action: change.oldValue === undefined ? 'CREATE' : 'UPDATE',
      key: change.key,
      oldValue: change.oldValue,
      newValue: change.newValue,
      changedByUserId,
      source,
    });
  }
}

/**
 * Retrieve recent monetization audit logs.
 */
export async function getMonetizationAuditLogs(limit = 50): Promise<any[]> {
  const logs = await prisma.securityLog.findMany({
    where: {
      action: 'ADMIN_SETTINGS_CHANGE',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return (logs as any[]).map((log: any) => ({
    id: log.id,
    action: log.action,
    details: log.metadata || null,
    createdBy: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système',
    createdAt: log.createdAt,
  }));
}
