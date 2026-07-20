import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function listRules(businessId: string) {
  return prisma.automationRule.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRule(businessId: string, ruleId: string) {
  const rule = await prisma.automationRule.findFirst({
    where: { id: ruleId, businessId },
  });
  if (!rule) throw new AppError("Règle d'automatisation non trouvée", 404);
  return rule;
}

export async function createRule(
  businessId: string,
  data: {
    name: string;
    description?: string;
    trigger: string;
    conditions?: any;
    actionType: string;
    actionConfig: any;
    triggerConfig?: any;
  }
) {
  return prisma.automationRule.create({
    data: {
      businessId,
      name: data.name,
      description: data.description,
      trigger: data.trigger as any,
      conditions: data.conditions ?? [],
      actionType: data.actionType as any,
      actionConfig: data.actionConfig,
      triggerConfig: data.triggerConfig ?? {},
    },
  });
}

export async function updateRule(
  businessId: string,
  ruleId: string,
  data: Partial<{
    name: string;
    description: string;
    trigger: string;
    conditions: any;
    actionType: string;
    actionConfig: any;
    triggerConfig: any;
    status: string;
  }>
) {
  const existing = await getRule(businessId, ruleId);
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.trigger !== undefined) updateData.trigger = data.trigger;
  if (data.conditions !== undefined) updateData.conditions = data.conditions;
  if (data.actionType !== undefined) updateData.actionType = data.actionType;
  if (data.actionConfig !== undefined) updateData.actionConfig = data.actionConfig;
  if (data.triggerConfig !== undefined) updateData.triggerConfig = data.triggerConfig;
  if (data.status !== undefined) updateData.status = data.status;
  return prisma.automationRule.update({ where: { id: existing.id }, data: updateData });
}

export async function deleteRule(businessId: string, ruleId: string) {
  const existing = await getRule(businessId, ruleId);
  await prisma.automationRule.delete({ where: { id: existing.id } });
}

export async function toggleRule(businessId: string, ruleId: string) {
  const existing = await getRule(businessId, ruleId);
  const newStatus = existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  return prisma.automationRule.update({
    where: { id: existing.id },
    data: { status: newStatus as any },
  });
}

export async function evaluateTriggers(
  businessId: string,
  trigger: string,
  context: Record<string, any>
) {
  const rules = await prisma.automationRule.findMany({
    where: { businessId, trigger: trigger as any, status: 'ACTIVE' },
  });
  for (const rule of rules) {
    await executeAction(businessId, rule, context);
  }
}

async function executeAction(businessId: string, rule: any, context: Record<string, any>) {
  const config = rule.actionConfig as Record<string, any>;
  switch (rule.actionType) {
    case 'SEND_NOTIFICATION': {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true },
      });
      if (business) {
        await prisma.notification.create({
          data: {
            userId: business.ownerId,
            type: 'SYSTEM',
            title: config.notificationTitle || 'Alerte CRM',
            description: config.notificationBody || '',
            metadata: context,
          },
        });
      }
      break;
    }
    case 'MOVE_DEAL':
      if (context.dealId && config.stageId) {
        await prisma.deal.update({
          where: { id: context.dealId },
          data: { stageId: config.stageId },
        });
      }
      break;
    case 'CHANGE_PROBABILITY':
      if (context.dealId && config.probability !== undefined) {
        await prisma.deal.update({
          where: { id: context.dealId },
          data: { probability: config.probability },
        });
      }
      break;
  }
  await prisma.automationRule.update({
    where: { id: rule.id },
    data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
  });
}
