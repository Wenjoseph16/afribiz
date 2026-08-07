import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { getIO } from './socket';

/**
 * ============================================
 * PLAN ACCESS SERVICE — checkPlanLimit
 * ============================================
 * Résout le plan actif d'un business puis vérifie
 * ses privilèges avant les actions métier clés.
 *
 * Tolérance : si le plan ou les privilèges sont
 * introuvables, la limite est considérée illimitée
 * (on ne bloque JAMAIS un flux métier en cas de
 * configuration manquante).
 */

// Plan plateforme par défaut. Au lancement : AfriBiz est GRATUIT (promo de lancement,
// price=0 en base) avec limites illimitées. Le jour où la monétisation est activée,
// l'admin repasse price=5000 → tout est réglé sans toucher au code.
// NB: l'ancien plan « platform-free » n'existe plus.
export const DEFAULT_PLAN_ID = 'platform-afribiz';

// Alerte de quota : notifie le propriétaire quand une limite est utilisée à >= 80%.
// Anti-spam : au maximum 1 alerte par ressource (produits/clients/réservations) et par période.
export const PLAN_LIMIT_ALERT_RATIO = 0.8;
export const PLAN_LIMIT_ALERT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Cache court (30s) pour limiter les requêtes répétées
const planCache = new Map<string, { plan: any; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

function cacheKey(businessId: string) {
  return `plan:${businessId}`;
}

async function getPlanForBusiness(businessId: string): Promise<any | null> {
  try {
    const key = cacheKey(businessId);
    const cached = planCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.plan;

    // Plan explicite sur le business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { planId: true },
    });
    let plan: any = null;
    if (business?.planId) {
      plan = await prisma.subscriptionPlan.findUnique({
        where: { id: business.planId },
        include: { privileges: { orderBy: { sortOrder: 'asc' } } },
      });
    }
    if (!plan) {
      // Fallback : plan par défaut (AfriBiz) — jamais de planId sans plan résolu
      plan = await prisma.subscriptionPlan.findUnique({
        where: { id: DEFAULT_PLAN_ID },
        include: { privileges: { orderBy: { sortOrder: 'asc' } } },
      });
    }
    planCache.set(key, { plan, expiresAt: Date.now() + CACHE_TTL_MS });
    return plan;
  } catch (e) {
    // Jamais bloquant : en cas d'erreur, aucun plan → pas de limite
    return null;
  }
}

export function invalidatePlanCache(businessId?: string) {
  if (businessId) {
    planCache.delete(cacheKey(businessId));
    return;
  }
  planCache.clear();
}

/**
 * Récupère la valeur d'un privilège pour un business.
 * - null / undefined → privilège absent → illimité
 * - -1 (COUNT)      → illimité
 */
export async function getPlanPrivilegeValue(
  businessId: string,
  code: string
): Promise<number | null> {
  const plan = await getPlanForBusiness(businessId);
  if (!plan) return null;
  const priv = plan.privileges?.find((p: any) => p.code === code);
  if (!priv || priv.value === undefined || priv.value === null) return null;
  const value = Number(priv.value);
  return value < 0 ? null : value;
}

export async function getBusinessPlanInfo(businessId: string) {
  const plan = await getPlanForBusiness(businessId);
  // Le fallback résout toujours le plan AfriBiz (DEFAULT_PLAN_ID) —
  // `plan` n'est null qu'en cas d'erreur DB. On affiche alors AfriBiz.
  if (!plan) return { planId: null, planName: 'AfriBiz', privileges: [] };
  return {
    planId: plan.id,
    planName: plan.name,
    privileges: plan.privileges || [],
  };
}

/**
 * Vue complète du plan d'un business pour le dashboard /dashboard/business/subscription :
 * plan + badge/promo + quotas d'utilisation réels (produits, clients CRM, réservations).
 * - limit === null → illimité (AfriBiz au lancement)
 * - usage réel compté en base, jamais bloquant (tolérant aux erreurs de comptage).
 */
export async function getBusinessPlanOverview(businessId: string) {
  const plan = await getPlanForBusiness(businessId);
  const safePlan =
    plan || (await prisma.subscriptionPlan.findUnique({ where: { id: DEFAULT_PLAN_ID } }));

  const privilegeValue = (code: string): number | null => {
    const priv = safePlan?.privileges?.find((p: any) => p.code === code);
    if (!priv || priv.value === undefined || priv.value === null) return null;
    const v = Number(priv.value);
    return v < 0 ? null : v;
  };

  // Comptage d'usage réel — jamais bloquant (une erreur de comptage → usage 0)
  let usage = { products: 0, clients: 0, bookings: 0 };
  try {
    const [products, clients, bookings] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      prisma.businessClient.count({ where: { businessId } }),
      prisma.booking.count({ where: { businessId } }),
    ]);
    usage = { products, clients, bookings };
  } catch (e) {
    logger.warn('getBusinessPlanOverview count failed', {
      error: (e as Error).message,
    });
  }

  const quotas = [
    {
      code: 'PRODUCTS_LIMIT',
      label: 'Produits au catalogue',
      used: usage.products,
      limit: privilegeValue('PRODUCTS_LIMIT'),
    },
    {
      code: 'CLIENTS_LIMIT',
      label: 'Clients CRM',
      used: usage.clients,
      limit: privilegeValue('CLIENTS_LIMIT'),
    },
    {
      code: 'BOOKINGS_LIMIT',
      label: 'Réservations',
      used: usage.bookings,
      limit: privilegeValue('BOOKINGS_LIMIT'),
    },
  ];

  return {
    planId: safePlan?.id || DEFAULT_PLAN_ID,
    planName: safePlan?.name || 'AfriBiz',
    price: safePlan ? Number(safePlan.price) : 0,
    currency: safePlan?.currency || 'FCFA',
    billingCycle: safePlan?.billingCycle || 'MONTHLY',
    badge: safePlan?.badge || null,
    description: safePlan?.description || null,
    benefits: safePlan?.benefits || [],
    isPromo: safePlan ? Number(safePlan.price) === 0 : true,
    quotas,
  };
}

/**
 * Vérifie qu'un business n'a pas dépassé sa limite sur un privilège.
 * Lève une AppError 403 si currentCount >= limit (et limit >= 0).
 * Ne fait RIEN si le privilège est absent ou illimité.
 */
export async function checkPlanLimit(
  businessId: string,
  code: string,
  currentCount: number,
  label: string
): Promise<void> {
  const limit = await getPlanPrivilegeValue(businessId, code);
  if (limit === null) return; // illimité ou config absente
  if (currentCount >= limit) {
    const { planName } = await getBusinessPlanInfo(businessId);
    throw new AppError(
      `Limite du plan ${planName} atteinte : ${label} (max ${limit}). Passez à un plan supérieur pour continuer.`,
      403
    );
  }
  // Alerte d'usage à 80% de la limite (non-bloquant, anti-spam)
  await maybeNotifyPlanLimit(businessId, code, currentCount, limit, label);
}

/**
 * Alerte de quota : notifie le propriétaire du business quand une limite
 * (produits, clients, réservations) est utilisée à >= 80% pour l'inciter à upgrader.
 *
 * Garanties :
 * - Anti-spam : 1 alerte max par ressource et par période (7 jours) → aucun harcèlement.
 * - Non-bloquant : toute erreur est loggée en warn, jamais de 500 métier.
 * - Le push socket `notification:new` arrive en temps réel sur le dashboard du propriétaire.
 */
async function maybeNotifyPlanLimit(
  businessId: string,
  code: string,
  currentCount: number,
  limit: number,
  label: string
): Promise<void> {
  try {
    const threshold = Math.ceil(limit * PLAN_LIMIT_ALERT_RATIO);
    if (currentCount < threshold) return; // en dessous de 80%

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, name: true },
    });
    const ownerId = business?.ownerId;
    if (!ownerId) return;

    // Anti-spam : une alerte identique récente existe déjà pour CE business + CETTE ressource ?
    // (le contrôle par businessId évite de sous-notifier les propriétaires multi-business)
    const recentAlerts = await prisma.notification.findMany({
      where: {
        userId: ownerId,
        type: NotificationType.PLAN_LIMIT,
        createdAt: { gte: new Date(Date.now() - PLAN_LIMIT_ALERT_WINDOW_MS) },
      },
      select: { metadata: true },
    });
    const alreadyWarned = (recentAlerts || []).some(
      (n: any) => n.metadata?.resource === code && n.metadata?.businessId === businessId
    );
    if (alreadyWarned) return;

    const pct = Math.round((currentCount / limit) * 100);
    const notification = await prisma.notification.create({
      data: {
        userId: ownerId,
        type: NotificationType.PLAN_LIMIT,
        title: `Limite « ${label} » presque atteinte (${pct}%)`,
        description: `Vous utilisez déjà ${currentCount} ${label} sur ${limit} autorisés par votre plan actuel. Passez au plan AfriBiz pour profiter de l'illimité.`,
        link: '/dashboard/business/subscription',
        metadata: {
          resource: code,
          limit,
          current: currentCount,
          pct,
          businessId,
        },
      },
    });

    // Push temps réel vers le dashboard du propriétaire (même événement que les autres notifications)
    try {
      const io = getIO();
      io?.to(`user:${ownerId}`).emit('notification:new', notification);
    } catch (err) {
      logger.warn('PLAN_LIMIT socket push skipped', { error: (err as Error).message });
    }
  } catch (err) {
    logger.warn('PLAN_LIMIT alert skipped (non-bloquant)', { error: (err as Error).message });
  }
}

/**
 * Accès Copilot IA : privilège COPILOT_ACCESS (1 = autorisé).
 * Tolérant : sans configuration, l'accès est refusé SAUF pour le plan Copilot IA.
 */
export async function hasCopilotAccess(businessId: string): Promise<boolean> {
  const plan = await getPlanForBusiness(businessId);
  if (!plan) return false;
  // Le plan Copilot IA (platform-copilot) donne l'accès par défaut
  if (plan.id === 'platform-copilot') return true;
  const priv = plan.privileges?.find((p: any) => p.code === 'COPILOT_ACCESS');
  return priv ? Number(priv.value) === 1 : false;
}

/**
 * Guard express pour les routes Copilot : vérifie l'accès IA du business du user.
 */
export async function assertCopilotAccess(businessId: string): Promise<void> {
  const ok = await hasCopilotAccess(businessId);
  if (!ok) {
    throw new AppError(
      "Votre plan ne donne pas accès à l'assistant Copilot IA. Le plan AfriBiz l'inclut gratuitement pour le lancement — passez au plan AfriBiz pour le débloquer.",
      403
    );
  }
}
