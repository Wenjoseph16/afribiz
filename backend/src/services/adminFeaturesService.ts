import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { recomputeAllScores } from './afriScoreService';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  logAdminAction,
  trackAdminAction,
  notifyUserWarned,
  notifyMediaModerated,
} from './adminEvents';
import { resetMaintenanceCache } from '../middlewares/maintenanceMode';
import { invalidatePlanCache } from './planAccessService';

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const BACKUP_MANIFEST = path.join(BACKUP_DIR, 'manifest.json');

function ensureBackupDir(): void {
  if (process.env.VERCEL) return;
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupManifest(): any[] {
  ensureBackupDir();
  if (!fs.existsSync(BACKUP_MANIFEST)) {
    fs.writeFileSync(BACKUP_MANIFEST, '[]', 'utf-8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(BACKUP_MANIFEST, 'utf-8'));
  } catch {
    return [];
  }
}

function saveBackupManifest(manifest: any[]): void {
  ensureBackupDir();
  fs.writeFileSync(BACKUP_MANIFEST, JSON.stringify(manifest, null, 2), 'utf-8');
}

// ============================================
// PLATFORM SETTINGS
// ============================================

export async function getPlatformSettings(): Promise<Record<string, any>> {
  const settings = await (prisma as any).platformSetting.findMany();
  const map: Record<string, any> = {};
  for (const s of settings) {
    // Type-safe conversion: string → number for numeric settings
    if (
      s.key.includes('Rate') ||
      s.key.includes('Fee') ||
      s.key === 'maxFileUploadSize' ||
      s.key === 'retentionDays'
    ) {
      map[s.key] = s.value !== null && s.value !== '' ? Number(s.value) : null;
    } else if (
      s.key.includes('Enabled') ||
      s.key === 'maintenanceMode' ||
      s.key === 'registrationOpen' ||
      s.key === 'emailVerificationRequired' ||
      s.key === 'phoneVerificationRequired' ||
      s.key === 'twoFactorEnabled'
    ) {
      map[s.key] = s.value === 'true' || s.value === true;
    } else {
      map[s.key] = s.value;
    }
  }
  return map;
}

export async function updatePlatformSettings(
  data: Record<string, any>,
  adminUserId?: string
): Promise<Record<string, any>> {
  for (const [key, value] of Object.entries(data)) {
    await (prisma as any).platformSetting.upsert({
      where: { key },
      create: { key, value, category: 'general' },
      update: { value },
    });
  }
  // Invalidation du cache du middleware de maintenance si le réglage a changé
  if ('maintenanceMode' in data) {
    resetMaintenanceCache();
  }
  // Piste d'audit : toute modification de réglages plateforme est tracée
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_SETTINGS_CHANGE',
      reason: `Paramètres plateforme modifiés: ${Object.keys(data).join(', ')}`,
      metadata: { keys: Object.keys(data) },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_SETTINGS_UPDATED',
      properties: { keys: Object.keys(data) },
    });
  }
  return getPlatformSettings();
}

export async function getPlatformSettingsByCategory(
  category: string
): Promise<Record<string, any>> {
  const settings = await (prisma as any).platformSetting.findMany({ where: { category } });
  const map: Record<string, any> = {};
  for (const s of settings) {
    // Same type-safe conversion as getPlatformSettings()
    if (
      s.key.includes('Rate') ||
      s.key.includes('Fee') ||
      s.key === 'maxFileUploadSize' ||
      s.key === 'retentionDays'
    ) {
      map[s.key] = s.value !== null && s.value !== '' ? Number(s.value) : null;
    } else if (
      s.key.includes('Enabled') ||
      s.key === 'maintenanceMode' ||
      s.key === 'registrationOpen' ||
      s.key === 'emailVerificationRequired' ||
      s.key === 'phoneVerificationRequired' ||
      s.key === 'twoFactorEnabled'
    ) {
      map[s.key] = s.value === 'true' || s.value === true;
    } else {
      map[s.key] = s.value;
    }
  }
  return map;
}

// ============================================
// FEATURE FLAGS
// ============================================

export async function getFeatureFlags(filters?: { scope?: string; enabled?: string }) {
  const where: any = {};
  if (filters?.scope) where.scope = filters.scope;
  if (filters?.enabled === 'true') where.enabled = true;
  else if (filters?.enabled === 'false') where.enabled = false;
  return prisma.featureFlag.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getFeatureFlag(key: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) throw new AppError('Feature flag not found', 404);
  return flag;
}

export async function createFeatureFlag(
  data: {
    key: string;
    label: string;
    description?: string;
    enabled?: boolean;
    scope?: string;
    scopeValue?: string;
  },
  adminUserId?: string
) {
  const existing = await prisma.featureFlag.findUnique({ where: { key: data.key } });
  if (existing) throw new AppError('Feature flag with this key already exists', 400);
  const flag = await prisma.featureFlag.create({
    data: { ...data, scope: (data.scope as any) || 'GLOBAL' },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_FEATURE_FLAG_CHANGE',
      reason: `Feature flag créé: ${flag.key}`,
      metadata: { action: 'create', flagKey: flag.key },
    });
  }
  return flag;
}

export async function updateFeatureFlag(
  id: string,
  data: {
    label?: string;
    description?: string;
    enabled?: boolean;
    scope?: string;
    scopeValue?: string;
  },
  adminUserId?: string
) {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) throw new AppError('Feature flag not found', 404);
  const updated = await prisma.featureFlag.update({ where: { id }, data: data as any });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_FEATURE_FLAG_CHANGE',
      reason: `Feature flag modifié: ${flag.key}`,
      metadata: { action: 'update', flagKey: flag.key },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_FEATURE_FLAG_UPDATED',
      properties: { flagKey: flag.key },
    });
  }
  return updated;
}

export async function toggleFeatureFlag(id: string, adminUserId?: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) throw new AppError('Feature flag not found', 404);
  const updated = await prisma.featureFlag.update({
    where: { id },
    data: { enabled: !flag.enabled },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_FEATURE_FLAG_CHANGE',
      reason: `Feature flag ${updated.enabled ? 'activé' : 'désactivé'}: ${flag.key}`,
      metadata: { action: 'toggle', flagKey: flag.key, enabled: updated.enabled },
    });
    await trackAdminAction({
      adminUserId,
      eventName: updated.enabled ? 'ADMIN_FEATURE_FLAG_ENABLED' : 'ADMIN_FEATURE_FLAG_DISABLED',
      properties: { flagKey: flag.key },
    });
  }
  return updated;
}

export async function deleteFeatureFlag(id: string, adminUserId?: string) {
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) throw new AppError('Feature flag not found', 404);
  await prisma.featureFlag.delete({ where: { id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_FEATURE_FLAG_CHANGE',
      reason: `Feature flag supprimé: ${flag.key}`,
      metadata: { action: 'delete', flagKey: flag.key },
    });
  }
  return { message: 'Feature flag deleted' };
}

// ============================================
// ADMIN ROLES & PERMISSIONS
// ============================================

export async function getAdminRoles() {
  return prisma.adminRole.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      permissions: {
        include: {
          permission: { select: { id: true, resource: true, action: true, description: true } },
        },
      },
      _count: { select: { admins: true } },
    },
  });
}

export async function createAdminRole(
  data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  },
  adminUserId?: string
) {
  const existing = await prisma.adminRole.findUnique({ where: { name: data.name } });
  if (existing) throw new AppError('Role already exists', 400);
  const role = await prisma.adminRole.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: data.permissionIds
        ? { create: data.permissionIds.map((pid) => ({ permissionId: pid })) }
        : undefined,
    },
    include: {
      permissions: {
        include: {
          permission: { select: { id: true, resource: true, action: true, description: true } },
        },
      },
    },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      reason: `Rôle admin créé: ${role.name}`,
      metadata: { action: 'create', roleId: role.id },
    });
  }
  return role;
}

export async function updateAdminRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] },
  adminUserId?: string
) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) throw new AppError('Role not found', 404);
  if (role.isSystem) throw new AppError('System roles cannot be modified', 403);

  if (data.permissionIds) {
    await prisma.adminRolePermission.deleteMany({ where: { roleId: id } });
    await prisma.adminRolePermission.createMany({
      data: data.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
    });
  }
  const updated = await prisma.adminRole.update({
    where: { id },
    data: { name: data.name, description: data.description },
    include: {
      permissions: {
        include: {
          permission: { select: { id: true, resource: true, action: true, description: true } },
        },
      },
    },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      reason: `Rôle admin modifié: ${role.name}`,
      metadata: { action: 'update', roleId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_ROLE_UPDATED',
      properties: { roleId: id, roleName: role.name },
    });
  }
  return updated;
}

export async function deleteAdminRole(id: string, adminUserId?: string) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) throw new AppError('Role not found', 404);
  if (role.isSystem) throw new AppError('System roles cannot be deleted', 403);
  await prisma.adminRole.delete({ where: { id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      reason: `Rôle admin supprimé: ${role.name}`,
      metadata: { action: 'delete', roleId: id },
    });
  }
  return { message: 'Role deleted' };
}

export async function getAdminPermissions() {
  return prisma.adminPermission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
}

export async function assignRoleToUser(userId: string, roleId: string, adminUserId?: string) {
  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.adminRole.findUnique({ where: { id: roleId } }),
  ]);
  if (!user) throw new AppError('User not found', 404);
  if (!role) throw new AppError('Role not found', 404);
  const existing = await prisma.adminRoleAssignment.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (existing) throw new AppError('User already has this role', 400);
  const assignment = await prisma.adminRoleAssignment.create({
    data: { userId, roleId },
    include: { role: true },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      targetUserId: userId,
      reason: `Rôle ${role.name} assigné à l'utilisateur`,
      metadata: { action: 'assign', roleId, userId },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_ROLE_ASSIGNED',
      properties: { roleId, userId, roleName: role.name },
    });
  }
  return assignment;
}

export async function removeRoleFromUser(userId: string, roleId: string, adminUserId?: string) {
  const assignment = await prisma.adminRoleAssignment.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (!assignment) throw new AppError('Role assignment not found', 404);
  await prisma.adminRoleAssignment.delete({ where: { id: assignment.id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ROLE_CHANGE',
      targetUserId: userId,
      reason: `Rôle retiré de l'utilisateur (${roleId})`,
      metadata: { action: 'unassign', roleId, userId },
    });
  }
  return { message: 'Role removed from user' };
}

export async function getUserRoles(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.adminRoleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: { select: { id: true, resource: true, action: true, description: true } },
            },
          },
        },
      },
    },
  });
}

export async function getAdminUsers() {
  const assignments = await prisma.adminRoleAssignment.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
        },
      },
      role: {
        include: {
          permissions: {
            include: {
              permission: { select: { id: true, resource: true, action: true, description: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const grouped: Record<string, any> = {};
  for (const a of assignments) {
    if (!grouped[a.userId]) {
      grouped[a.userId] = { ...a.user, roles: [] };
    }
    grouped[a.userId].roles.push(a.role);
  }
  return Object.values(grouped);
}

// ============================================
// AUTOMATION RULES
// ============================================

export async function getAutomationRules(filters?: { trigger?: string; status?: string }) {
  const where: any = {};
  if (filters?.trigger) where.trigger = filters.trigger;
  if (filters?.status) where.status = filters.status;
  return prisma.automationRule.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getAutomationRule(id: string) {
  const rule = await prisma.automationRule.findUnique({
    where: { id },
    include: { executionLogs: { orderBy: { executedAt: 'desc' }, take: 50 } },
  });
  if (!rule) throw new AppError('Automation rule not found', 404);
  return rule;
}

export async function createAutomationRule(
  data: {
    name: string;
    description?: string;
    trigger: string;
    triggerConfig?: any;
    conditions?: any;
    actionType: string;
    actionConfig: any;
    cooldownMinutes?: number;
    status?: string;
  },
  adminUserId?: string
) {
  const rule = await prisma.automationRule.create({ data: data as any });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'AUTOMATION_RULE_CHANGED',
      reason: `Règle d'automatisation créée: ${rule.name}`,
      metadata: { action: 'create', ruleId: rule.id },
    });
  }
  return rule;
}

export async function updateAutomationRule(id: string, data: any, adminUserId?: string) {
  const rule = await prisma.automationRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Automation rule not found', 404);
  const updated = await prisma.automationRule.update({ where: { id }, data });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'AUTOMATION_RULE_CHANGED',
      reason: `Règle d'automatisation modifiée: ${rule.name}`,
      metadata: { action: 'update', ruleId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_AUTOMATION_UPDATED',
      properties: { ruleId: id, ruleName: rule.name },
    });
  }
  return updated;
}

export async function deleteAutomationRule(id: string, adminUserId?: string) {
  const rule = await prisma.automationRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Automation rule not found', 404);
  await prisma.automationRule.delete({ where: { id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'AUTOMATION_RULE_CHANGED',
      reason: `Règle d'automatisation supprimée: ${rule.name}`,
      metadata: { action: 'delete', ruleId: id },
    });
  }
  return { message: 'Automation rule deleted' };
}

export async function toggleAutomationRule(id: string, adminUserId?: string) {
  const rule = await prisma.automationRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Automation rule not found', 404);
  const newStatus = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  const updated = await prisma.automationRule.update({
    where: { id },
    data: { status: newStatus as any },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'AUTOMATION_RULE_CHANGED',
      reason: `Règle d'automatisation ${newStatus === 'ACTIVE' ? 'activée' : 'mise en pause'}: ${rule.name}`,
      metadata: { action: 'toggle', ruleId: id, status: newStatus },
    });
  }
  return updated;
}

export async function getAutomationExecutionLogs(ruleId: string) {
  const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });
  if (!rule) throw new AppError('Automation rule not found', 404);
  return prisma.automationExecutionLog.findMany({
    where: { ruleId },
    orderBy: { executedAt: 'desc' },
    take: 100,
  });
}

export async function getAutomationTriggers() {
  return [
    'STOCK_LOW',
    'STOCK_OUT',
    'STOCK_BACK_IN',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'ORDER_PLACED',
    'ORDER_CONFIRMED',
    'ORDER_CANCELLED',
    'BOOKING_MADE',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'BOOKING_REMINDER',
    'REVIEW_PUBLISHED',
    'NEW_CLIENT',
    'CLIENT_INACTIVE',
    'SUBSCRIPTION_EXPIRING',
    'SUBSCRIPTION_EXPIRED',
    'MODULE_INSTALLED',
    'MODULE_UNINSTALLED',
    'SCORE_CHANGED',
    'BADGE_EARNED',
    'DEBT_OVERDUE',
    'DISPUTE_OPENED',
    'AD_COMPLETED',
    'EVENT_SCHEDULED',
    'CUSTOM_WEBHOOK',
  ];
}

export async function getAutomationActionTypes() {
  return [
    'SEND_NOTIFICATION',
    'SEND_EMAIL',
    'SEND_SMS',
    'SEND_WHATSAPP',
    'UPDATE_STATUS',
    'APPLY_DISCOUNT',
    'ASSIGN_TAG',
    'CREATE_TASK',
    'UPDATE_SCORE',
    'BLOCK_USER',
    'SUSPEND_BUSINESS',
    'CALL_WEBHOOK',
    'LOG_EVENT',
  ];
}

// ============================================
// CMS PAGES
// ============================================

export async function getCmsPages(filters?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  const where: any = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [{ title: { contains: filters.search } }, { content: { contains: filters.search } }];
  }
  return prisma.cmsPage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function getCmsPage(slug: string) {
  const page = await prisma.cmsPage.findUnique({
    where: { slug },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (!page) throw new AppError('CMS page not found', 404);
  return page;
}

export async function createCmsPage(
  data: {
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    status?: string;
  },
  authorId: string
) {
  const existing = await prisma.cmsPage.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError('A page with this slug already exists', 400);
  const page = await prisma.cmsPage.create({
    data: {
      slug: data.slug,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      category: data.category || 'general',
      tags: data.tags || [],
      status: (data.status as any) || 'DRAFT',
      authorId,
    },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  await logAdminAction({
    adminUserId: authorId,
    action: 'CMS_PAGE_CHANGED',
    reason: `Page CMS créée: ${page.title}`,
    metadata: { action: 'create', pageId: page.id, slug: page.slug },
  });
  return page;
}

export async function updateCmsPage(
  id: string,
  data: {
    slug?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    status?: string;
  },
  adminUserId?: string
) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new AppError('CMS page not found', 404);
  const updated = await prisma.cmsPage.update({
    where: { id },
    data: data as any,
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'CMS_PAGE_CHANGED',
      reason: `Page CMS modifiée: ${page.title}`,
      metadata: { action: 'update', pageId: id },
    });
  }
  return updated;
}

export async function deleteCmsPage(id: string, adminUserId?: string) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new AppError('CMS page not found', 404);
  await prisma.cmsPage.delete({ where: { id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'CMS_PAGE_CHANGED',
      reason: `Page CMS supprimée: ${page.title}`,
      metadata: { action: 'delete', pageId: id },
    });
  }
  return { message: 'CMS page deleted' };
}

export async function publishCmsPage(id: string, adminUserId?: string) {
  const page = await prisma.cmsPage.findUnique({ where: { id } });
  if (!page) throw new AppError('CMS page not found', 404);
  const updated = await prisma.cmsPage.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'CMS_PAGE_CHANGED',
      reason: `Page CMS publiée: ${page.title}`,
      metadata: { action: 'publish', pageId: id, slug: page.slug },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_CMS_PUBLISHED',
      properties: { pageId: id, slug: page.slug, title: page.title },
    });
  }
  return updated;
}

export async function getCmsCategories() {
  return prisma.cmsCategory.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createCmsCategory(data: {
  slug: string;
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  const existing = await prisma.cmsCategory.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError('Category with this slug already exists', 400);
  return prisma.cmsCategory.create({ data });
}

export async function updateCmsCategory(
  id: string,
  data: { slug?: string; name?: string; description?: string; sortOrder?: number }
) {
  const cat = await prisma.cmsCategory.findUnique({ where: { id } });
  if (!cat) throw new AppError('CMS category not found', 404);
  return prisma.cmsCategory.update({ where: { id }, data });
}

export async function deleteCmsCategory(id: string) {
  const cat = await prisma.cmsCategory.findUnique({ where: { id } });
  if (!cat) throw new AppError('CMS category not found', 404);
  await prisma.cmsCategory.delete({ where: { id } });
  return { message: 'CMS category deleted' };
}

// ============================================
// FORM TEMPLATES
// ============================================

export async function getFormTemplates(filters?: { category?: string; status?: string }) {
  const where: any = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.status) where.status = filters.status;
  return prisma.formTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getFormTemplate(slug: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { slug },
    include: { _count: { select: { submissions: true } } },
  });
  if (!template) throw new AppError('Form template not found', 404);
  return template;
}

export async function createFormTemplate(data: {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  schema: any;
  uiSchema?: any;
  status?: string;
}) {
  const existing = await prisma.formTemplate.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError('Form template with this slug already exists', 400);
  return prisma.formTemplate.create({
    data: {
      ...data,
      schema: data.schema,
      uiSchema: data.uiSchema || {},
      status: (data.status as any) || 'DRAFT',
    },
  });
}

export async function updateFormTemplate(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    category?: string;
    schema?: any;
    uiSchema?: any;
    status?: string;
  }
) {
  const template = await prisma.formTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError('Form template not found', 404);
  return prisma.formTemplate.update({
    where: { id },
    data: { ...data, version: template.version + 1 } as any,
  });
}

export async function deleteFormTemplate(id: string) {
  const template = await prisma.formTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError('Form template not found', 404);
  await prisma.formTemplate.delete({ where: { id } });
  return { message: 'Form template deleted' };
}

export async function activateFormTemplate(id: string) {
  const template = await prisma.formTemplate.findUnique({ where: { id } });
  if (!template) throw new AppError('Form template not found', 404);
  return prisma.formTemplate.update({ where: { id }, data: { status: 'ACTIVE' } });
}

export async function getFormSubmissions(templateId: string) {
  const template = await prisma.formTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new AppError('Form template not found', 404);
  return prisma.formSubmission.findMany({
    where: { templateId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

export async function getFormSubmission(id: string) {
  const submission = await prisma.formSubmission.findUnique({
    where: { id },
    include: {
      template: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!submission) throw new AppError('Form submission not found', 404);
  return submission;
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export async function getNotificationTemplates(filters?: { type?: string; channel?: string }) {
  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.channel) where.channel = filters.channel;
  return prisma.notificationTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function getNotificationTemplate(id: string) {
  const tpl = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!tpl) throw new AppError('Notification template not found', 404);
  return tpl;
}

export async function createNotificationTemplate(data: {
  type: string;
  channel: string;
  subject?: string;
  title?: string;
  content: string;
  variables?: string[];
  isActive?: boolean;
}) {
  return prisma.notificationTemplate.create({ data: data as any });
}

export async function updateNotificationTemplate(
  id: string,
  data: {
    type?: string;
    channel?: string;
    subject?: string;
    title?: string;
    content?: string;
    variables?: string[];
    isActive?: boolean;
  }
) {
  const tpl = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!tpl) throw new AppError('Notification template not found', 404);
  return prisma.notificationTemplate.update({ where: { id }, data: data as any });
}

export async function deleteNotificationTemplate(id: string) {
  const tpl = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!tpl) throw new AppError('Notification template not found', 404);
  await prisma.notificationTemplate.delete({ where: { id } });
  return { message: 'Notification template deleted' };
}

export async function getNotificationTypes() {
  return [
    'ORDER_PLACED',
    'ORDER_CONFIRMED',
    'ORDER_PREPARING',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'ORDER_CANCELLED',
    'BOOKING_CONFIRMED',
    'BOOKING_REMINDER',
    'BOOKING_CANCELLED',
    'PAYMENT_RECEIVED',
    'PAYMENT_REMINDER',
    'PAYMENT_REFUNDED',
    'REVIEW_RESPONSE',
    'NEW_MESSAGE',
    'PROMOTION',
    'NEW_EVENT',
    'SECURITY_ALERT',
    'DISPUTE_OPENED',
    'DISPUTE_RESOLVED',
    'SYSTEM',
    'WELCOME',
    'MODULE_APPROVED',
    'MODULE_REJECTED',
    'AD_VALIDATED',
    'AD_REJECTED',
    'AD_SUSPENDED',
    'VERIFICATION_APPROVED',
    'VERIFICATION_REJECTED',
    'ACCOUNT_SUSPENDED',
  ];
}

export async function getNotificationChannels() {
  return ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'];
}

// ============================================
// COPILOT CONFIGURATION
// ============================================

export async function getPlatformCopilotConfig() {
  let config = await prisma.platformCopilotConfig.findFirst();
  if (!config) {
    config = await prisma.platformCopilotConfig.create({
      data: {},
    });
  }
  return config;
}

export async function updatePlatformCopilotConfig(data: any) {
  let config = await prisma.platformCopilotConfig.findFirst();
  if (!config) {
    config = await prisma.platformCopilotConfig.create({ data });
  } else {
    config = await prisma.platformCopilotConfig.update({ where: { id: config.id }, data });
  }
  return config;
}

export async function getBusinessCopilotConfig(businessId: string) {
  let config = await prisma.copilotConfiguration.findUnique({ where: { businessId } });
  if (!config) {
    config = await prisma.copilotConfiguration.create({
      data: { businessId },
    });
  }
  return config;
}

export async function updateBusinessCopilotConfig(businessId: string, data: any) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.copilotConfiguration.upsert({
    where: { businessId },
    create: { businessId, ...data },
    update: data,
  });
}

// ============================================
// MEDIA MODERATION
// ============================================

export async function getMediaModerationItems(filters?: { contentType?: string; status?: string }) {
  const where: any = {};
  if (filters?.contentType) where.contentType = filters.contentType;
  if (filters?.status) where.status = filters.status;
  return prisma.mediaModerationItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reportedBy: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getMediaModerationItem(id: string) {
  const item = await prisma.mediaModerationItem.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!item) throw new AppError('Moderation item not found', 404);
  return item;
}

export async function reportMedia(
  contentType: string,
  contentId: string,
  reportedById: string,
  reason?: string,
  description?: string
) {
  return prisma.mediaModerationItem.create({
    data: {
      contentType: contentType as any,
      contentId,
      reportedById,
      reason,
      description,
    },
  });
}

export async function approveMedia(id: string, reviewedById: string) {
  const item = await prisma.mediaModerationItem.findUnique({ where: { id } });
  if (!item) throw new AppError('Moderation item not found', 404);
  const updated = await prisma.mediaModerationItem.update({
    where: { id },
    data: { status: 'APPROVED', reviewedById, reviewedAt: new Date() },
  });
  // Piste d'audit + notification au créateur
  await logAdminAction({
    adminUserId: reviewedById,
    action: 'ADMIN_CONTENT_MODERATION',
    reason: `Média approuvé (${updated.contentType})`,
    metadata: { action: 'approve', itemId: id, contentType: updated.contentType },
  });
  await notifyMediaModerated({
    target: { kind: updated.contentType as any, id: updated.contentId },
    status: 'approved',
  });
  return updated;
}

export async function rejectMedia(id: string, reviewedById: string, reason?: string) {
  const item = await prisma.mediaModerationItem.findUnique({ where: { id } });
  if (!item) throw new AppError('Moderation item not found', 404);
  const updated = await prisma.mediaModerationItem.update({
    where: { id },
    data: { status: 'REJECTED', reviewedById, reviewedAt: new Date(), resolution: reason },
  });
  await logAdminAction({
    adminUserId: reviewedById,
    action: 'ADMIN_CONTENT_MODERATION',
    reason: `Média rejeté (${updated.contentType})${reason ? ' — ' + reason : ''}`,
    metadata: { action: 'reject', itemId: id, contentType: updated.contentType, reason },
  });
  await notifyMediaModerated({
    target: { kind: updated.contentType as any, id: updated.contentId },
    status: 'rejected',
    reason,
  });
  return updated;
}

export async function flagMedia(id: string, reviewedById: string, reason?: string) {
  const item = await prisma.mediaModerationItem.findUnique({ where: { id } });
  if (!item) throw new AppError('Moderation item not found', 404);
  const updated = await prisma.mediaModerationItem.update({
    where: { id },
    data: { status: 'FLAGGED', reviewedById, reviewedAt: new Date(), resolution: reason },
  });
  await logAdminAction({
    adminUserId: reviewedById,
    action: 'ADMIN_CONTENT_MODERATION',
    reason: `Média signalé (${updated.contentType})${reason ? ' — ' + reason : ''}`,
    metadata: { action: 'flag', itemId: id, contentType: updated.contentType, reason },
  });
  return updated;
}

export async function getModerationStats() {
  const [pending, approved, rejected, flagged] = await Promise.all([
    prisma.mediaModerationItem.count({ where: { status: 'PENDING' } }),
    prisma.mediaModerationItem.count({ where: { status: 'APPROVED' } }),
    prisma.mediaModerationItem.count({ where: { status: 'REJECTED' } }),
    prisma.mediaModerationItem.count({ where: { status: 'FLAGGED' } }),
  ]);
  return { pending, approved, rejected, flagged, total: pending + approved + rejected + flagged };
}

// ============================================
// COMMISSION CONFIGURATION
// ============================================

export async function getCommissionConfigs() {
  const configs = await prisma.commissionConfig.findMany({ orderBy: { createdAt: 'desc' } });
  return configs.map((c) => ({
    ...c,
    minFee: c.minFee ? Number(c.minFee) : null,
    maxFee: c.maxFee ? Number(c.maxFee) : null,
  }));
}

export async function getCommissionConfig(key: string) {
  const config = await prisma.commissionConfig.findUnique({ where: { key } });
  if (!config) throw new AppError('Commission config not found', 404);
  return {
    ...config,
    minFee: config.minFee ? Number(config.minFee) : null,
    maxFee: config.maxFee ? Number(config.maxFee) : null,
  };
}

export async function createCommissionConfig(data: {
  key: string;
  label: string;
  description?: string;
  rate?: number;
  scope?: string;
  scopeValue?: string;
  minFee?: number;
  maxFee?: number;
  currency?: string;
  isActive?: boolean;
}) {
  const existing = await prisma.commissionConfig.findUnique({ where: { key: data.key } });
  if (existing) throw new AppError('Commission config with this key already exists', 400);
  return prisma.commissionConfig.create({ data: data as any });
}

export async function updateCommissionConfig(
  id: string,
  data: {
    label?: string;
    description?: string;
    rate?: number;
    scope?: string;
    scopeValue?: string;
    minFee?: number;
    maxFee?: number;
    currency?: string;
    isActive?: boolean;
  }
) {
  const config = await prisma.commissionConfig.findUnique({ where: { id } });
  if (!config) throw new AppError('Commission config not found', 404);
  return prisma.commissionConfig.update({ where: { id }, data: data as any });
}

export async function deleteCommissionConfig(id: string) {
  const config = await prisma.commissionConfig.findUnique({ where: { id } });
  if (!config) throw new AppError('Commission config not found', 404);
  await prisma.commissionConfig.delete({ where: { id } });
  return { message: 'Commission config deleted' };
}

// ============================================
// USER WARNINGS
// ============================================

export async function getUserWarnings(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.userWarning.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { issuedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function issueWarning(
  userId: string,
  issuedById: string,
  reason: string,
  description?: string,
  action?: string
) {
  const [user, issuer] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { id: issuedById } }),
  ]);
  if (!user) throw new AppError('User not found', 404);
  if (!issuer) throw new AppError('Issuer not found', 404);
  const warning = await prisma.userWarning.create({
    data: { userId, issuedById, reason, description, action },
    include: { issuedBy: { select: { id: true, firstName: true, lastName: true } } },
  });
  // Piste d'audit + notification à l'utilisateur averti
  await logAdminAction({
    adminUserId: issuedById,
    action: 'ADMIN_USER_ACTION',
    targetUserId: userId,
    reason: `Avertissement émis: ${reason}`,
    metadata: { action: 'warning', warningId: warning.id },
  });
  await trackAdminAction({
    adminUserId: issuedById,
    eventName: 'ADMIN_WARNING_ISSUED',
    properties: { targetUserId: userId, reason },
  });
  await notifyUserWarned({ userId, reason });
  return warning;
}

export async function revokeWarning(id: string, adminUserId?: string) {
  const warning = await prisma.userWarning.findUnique({ where: { id } });
  if (!warning) throw new AppError('Warning not found', 404);
  await prisma.userWarning.delete({ where: { id } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: warning.userId,
      reason: `Avertissement révoqué (${warning.reason})`,
      metadata: { action: 'revoke-warning', warningId: id },
    });
  }
  return { message: 'Warning revoked' };
}

export async function getAllWarnings(filters?: { userId?: string }) {
  const where: any = {};
  if (filters?.userId) where.userId = filters.userId;
  return prisma.userWarning.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      issuedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export async function getAllSubscriptionPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  return plans.map((p) => ({
    ...p,
    price: Number(p.price),
    privileges: p.privileges.map((pr) => ({ ...pr, value: pr.value ? Number(pr.value) : null })),
  }));
}

export async function getSubscriptionPlan(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!plan) throw new AppError('Subscription plan not found', 404);
  return { ...plan, price: Number(plan.price) };
}

export async function createSubscriptionPlan(data: {
  name: string;
  description?: string;
  type?: string;
  price: number;
  currency?: string;
  billingCycle?: string;
  trialDays?: number;
  durationDays?: number;
  maxUsage?: number;
  maxClients?: number;
  maxBookings?: number;
  benefits?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  featured?: boolean;
  badge?: string;
}) {
  return prisma.subscriptionPlan.create({ data: data as any });
}

export async function updateSubscriptionPlan(id: string, data: any) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError('Subscription plan not found', 404);
  const updated = await prisma.subscriptionPlan.update({ where: { id }, data: data as any });
  // Les limites/privilèges changent → invalider le cache des plans
  invalidatePlanCache();
  return updated;
}

export async function deleteSubscriptionPlan(id: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) throw new AppError('Subscription plan not found', 404);
  await prisma.subscriptionPlan.delete({ where: { id } });
  invalidatePlanCache();
  return { message: 'Subscription plan deleted' };
}

export async function addPlanPrivilege(
  planId: string,
  data: {
    code: string;
    label: string;
    description?: string;
    value?: number;
    valueType?: string;
    sortOrder?: number;
  }
) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError('Subscription plan not found', 404);
  const priv = await prisma.subscriptionPrivilege.create({ data: { planId, ...data } });
  invalidatePlanCache();
  return priv;
}

export async function updatePlanPrivilege(
  id: string,
  data: {
    code?: string;
    label?: string;
    description?: string;
    value?: number;
    valueType?: string;
    sortOrder?: number;
  }
) {
  const priv = await prisma.subscriptionPrivilege.findUnique({ where: { id } });
  if (!priv) throw new AppError('Privilege not found', 404);
  const updated = await prisma.subscriptionPrivilege.update({ where: { id }, data });
  invalidatePlanCache();
  return updated;
}

export async function removePlanPrivilege(id: string) {
  const priv = await prisma.subscriptionPrivilege.findUnique({ where: { id } });
  if (!priv) throw new AppError('Privilege not found', 404);
  await prisma.subscriptionPrivilege.delete({ where: { id } });
  invalidatePlanCache();
  return { message: 'Privilege removed' };
}

// ============================================
// BACKUPS
// ============================================

export async function getBackups() {
  ensureBackupDir();
  const manifest = getBackupManifest();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz') || f.endsWith('.json'));
  const autoBackup = await (prisma as any).platformSetting.findUnique({
    where: { key: 'autoBackupEnabled' },
  });
  return {
    backups: manifest.map((b: any) => ({
      ...b,
      size: b.size || 0,
      downloadUrl: `/api/admin/backups/download/${b.filename || b.id}`,
    })),
    files: files.map((f) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, createdAt: stat.birthtime };
    }),
    autoBackup: autoBackup?.value === true || autoBackup?.value === 'true' || false,
    backupCount: manifest.length,
  };
}

export async function createBackup() {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) throw new Error('DATABASE_URL not configured');

    execSync(`pg_dump "${dbUrl}" --no-owner --no-acl | gzip > "${filepath}"`, {
      timeout: 300000,
      stdio: 'pipe',
    });

    const stat = fs.statSync(filepath);
    const manifest = getBackupManifest();
    const entry = {
      id: filename.replace('.sql.gz', ''),
      filename,
      size: stat.size,
      createdAt: new Date().toISOString(),
      type: 'pg_dump',
    };
    manifest.push(entry);
    saveBackupManifest(manifest);

    return { success: true, message: 'Backup created successfully', backup: entry };
  } catch (err: any) {
    logger.warn('pg_dump failed, creating JSON backup as fallback', { error: err.message });
    const fallbackFilepath = path.join(BACKUP_DIR, filename.replace('.sql.gz', '.json'));
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const validTableNames = tables
      .map((r) => r.table_name)
      .filter((name): name is string => !!name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name));
    const backupData: Record<string, any> = {};
    for (const tableName of validTableNames) {
      try {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
        backupData[tableName] = rows;
      } catch {
        /* empty - table may not exist */
      }
    }
    fs.writeFileSync(fallbackFilepath, JSON.stringify(backupData, null, 2), 'utf-8');
    const stat = fs.statSync(fallbackFilepath);
    const manifest = getBackupManifest();
    const entry = {
      id: filename.replace('.sql.gz', ''),
      filename: filename.replace('.sql.gz', '.json'),
      size: stat.size,
      createdAt: new Date().toISOString(),
      type: 'json_fallback',
    };
    manifest.push(entry);
    saveBackupManifest(manifest);
    return { success: true, message: 'JSON backup created (pg_dump not available)', backup: entry };
  }
}

export async function restoreBackup(backupId: string) {
  const manifest = getBackupManifest();
  const entry = manifest.find((b: any) => b.id === backupId || b.filename === backupId);
  if (!entry) throw new AppError('Backup not found in manifest', 404);

  const filepath = path.join(BACKUP_DIR, entry.filename);
  if (!fs.existsSync(filepath)) throw new AppError('Backup file not found on disk', 404);

  try {
    const dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) throw new Error('DATABASE_URL not configured');

    if (entry.filename.endsWith('.sql.gz')) {
      execSync(`gunzip -c "${filepath}" | psql "${dbUrl}"`, { timeout: 600000, stdio: 'pipe' });
    } else if (entry.filename.endsWith('.sql')) {
      execSync(`psql "${dbUrl}" < "${filepath}"`, { timeout: 600000, stdio: 'pipe' });
    } else {
      throw new Error('Unsupported backup format for restore');
    }

    return { success: true, message: 'Backup restored successfully' };
  } catch (err: any) {
    throw new AppError(`Restore failed: ${err.message}`, 500);
  }
}

export async function getBackupDownloadUrl(backupId: string) {
  const manifest = getBackupManifest();
  const entry = manifest.find((b: any) => b.id === backupId || b.filename === backupId);
  if (!entry) throw new AppError('Backup not found', 404);
  return { downloadUrl: `/api/admin/backups/download/${entry.filename}`, filename: entry.filename };
}

export async function toggleAutoBackup(enabled: boolean) {
  await (prisma as any).platformSetting.upsert({
    where: { key: 'autoBackupEnabled' },
    create: {
      key: 'autoBackupEnabled',
      value: enabled,
      category: 'backup',
      label: 'Auto backup enabled',
    },
    update: { value: enabled },
  });
  return { autoBackupEnabled: enabled };
}

// ============================================
// AFRI SCORE
// ============================================

export async function recomputeAllAfriScores() {
  const count = await recomputeAllScores();
  await (prisma as any).platformSetting.upsert({
    where: { key: 'lastAfriScoreRecompute' },
    create: {
      key: 'lastAfriScoreRecompute',
      value: new Date().toISOString(),
      category: 'afriscore',
      label: 'Last AfriScore recompute',
    },
    update: { value: new Date().toISOString() },
  });
  return { success: true, message: `Recompute initiated for ${count} businesses`, count };
}

export async function updateAfriScoreRules(rules: Record<string, any>) {
  await (prisma as any).platformSetting.upsert({
    where: { key: 'afriScoreRules' },
    create: {
      key: 'afriScoreRules',
      value: rules,
      category: 'afriscore',
      label: 'AfriScore scoring rules',
    },
    update: { value: rules },
  });
  return { success: true, message: 'AfriScore rules updated', rules };
}

// ============================================
// REAL PLATFORM SETTINGS (explicit aliases)
// ============================================

export const getRealPlatformSettings = getPlatformSettings;
export const updateRealPlatformSettings = updatePlatformSettings;
