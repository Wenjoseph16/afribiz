import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as businessService from '../services/business';
import { getPublicPlatformPlans } from '../services/subscriptions';
import { prisma } from '../lib/db';
import { computePrice, PriceItemInput } from '../services/priceEngine';

const router = Router();

// ============================================
// POST /api/catalog/attachments
// Résolveur unifié : pour une liste d'articles, retourne en UN appel les
// badges, le prix effectif (calculé par le PriceEngine côté serveur), les
// remises et les boutons à afficher. Public — marketplace, fiche produit,
// page publique, mini-site WhatsApp et contenu shoppable l'utilisent.
// ============================================
router.post(
  '/catalog/attachments',
  catchAsyncErrors(async (req: Request, res: Response) => {
    const { items } = (req.body || {}) as { items?: PriceItemInput[] };
    if (!items || items.length === 0) {
      res.json(successResponse({ items: {} }));
      return;
    }
    if (items.length > 100) {
      res.status(400).json(successResponse(null, 'Maximum 100 articles par appel'));
      return;
    }

    // Résoudre le business depuis le premier article (le panier/marketplace est mono-business)
    let businessId: string | undefined;
    for (const it of items) {
      if (it.itemType === 'PRODUCT') {
        const p = await prisma.product.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (p?.businessId) {
          businessId = p.businessId;
          break;
        }
      }
      if (it.itemType === 'SERVICE') {
        const s = await prisma.service.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (s?.businessId) {
          businessId = s.businessId;
          break;
        }
      }
      if (it.itemType === 'ROOM') {
        const r = await prisma.room.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (r?.businessId) {
          businessId = r.businessId;
          break;
        }
      }
      if (it.itemType === 'MENU_ITEM') {
        const m = await prisma.menuItem.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (m?.businessId) {
          businessId = m.businessId;
          break;
        }
      }
      if (it.itemType === 'RENTAL') {
        const rn = await prisma.rental.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (rn?.businessId) {
          businessId = rn.businessId;
          break;
        }
      }
      if (it.itemType === 'EVENT') {
        const ev = await prisma.event.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (ev?.businessId) {
          businessId = ev.businessId;
          break;
        }
      }
      if (it.itemType === 'TRAINING') {
        const tr = await prisma.training.findUnique({
          where: { id: it.itemId },
          select: { businessId: true },
        });
        if (tr?.businessId) {
          businessId = tr.businessId;
          break;
        }
      }
    }
    if (!businessId) {
      res.json(successResponse({ items: {} }));
      return;
    }

    // Résoudre les noms des ventes croisées (affichage « les clients achètent aussi »)
    const crossSellNames = async (
      itemsArr: Array<{ itemType: string; itemId: string }>
    ): Promise<Array<{ itemType: string; itemId: string; name?: string }>> => {
      const out: Array<{ itemType: string; itemId: string; name?: string }> = [];
      for (const c of itemsArr.slice(0, 8)) {
        let name: string | undefined;
        try {
          if (c.itemType === 'PRODUCT') {
            const p = await prisma.product.findUnique({
              where: { id: c.itemId },
              select: { name: true },
            });
            name = p?.name;
          } else if (c.itemType === 'SERVICE') {
            const s = await prisma.service.findUnique({
              where: { id: c.itemId },
              select: { name: true },
            });
            name = s?.name;
          } else if (c.itemType === 'MENU_ITEM') {
            const m = await prisma.menuItem.findUnique({
              where: { id: c.itemId },
              select: { name: true },
            });
            name = m?.name;
          } else if (c.itemType === 'ROOM') {
            const r = await prisma.room.findUnique({
              where: { id: c.itemId },
              select: { name: true },
            });
            name = r?.name;
          } else if (c.itemType === 'RENTAL') {
            const r = await prisma.rental.findUnique({
              where: { id: c.itemId },
              select: { name: true },
            });
            name = r?.name;
          } else if (c.itemType === 'EVENT') {
            const e = await prisma.event.findUnique({
              where: { id: c.itemId },
              select: { title: true },
            });
            name = e?.title;
          } else if (c.itemType === 'TRAINING') {
            const t = await prisma.training.findUnique({
              where: { id: c.itemId },
              select: { title: true },
            });
            name = t?.title;
          }
        } catch {
          /* nom optionnel */
        }
        out.push({ itemType: c.itemType, itemId: c.itemId, name });
      }
      return out;
    };

    // Cible de navigation (clic → commande) : produit → fiche produit, sinon page vitrine
    const resolveTarget = async (
      itemType: string,
      itemId: string
    ): Promise<{ path: string } | null> => {
      try {
        if (itemType === 'PRODUCT') {
          const p = await prisma.product.findUnique({
            where: { id: itemId },
            select: { slug: true },
          });
          return p?.slug ? { path: `/product/${p.slug}` } : null;
        }
        const biz = await prisma.business.findUnique({
          where: { id: businessId },
          select: { slug: true },
        });
        return biz?.slug ? { path: `/business/${biz.slug}` } : null;
      } catch {
        return null;
      }
    };

    const result: Record<string, any> = {};
    for (const it of items) {
      try {
        const price = await computePrice(businessId, it);
        result[`${it.itemType}:${it.itemId}`] = {
          itemType: price.itemType,
          itemId: price.itemId,
          basePrice: price.basePrice,
          unitPrice: price.unitPrice,
          currency: price.currency,
          discountAmount: price.discountAmount,
          breakdown: price.breakdown,
          surcharges: price.surcharges,
          available: price.available,
          reason: price.reason ?? null,
          badges: price.badges,
          layawayOfferId: price.layawayOfferId ?? null,
          groupBuyId: price.groupBuyId ?? null,
          promotional: price.promotional,
          // Étape C : mécanismes rattachés
          taxRate: price.taxRate ?? null,
          taxAmount: price.taxAmount,
          minQuantity: price.minQuantity ?? null,
          maxQuantity: price.maxQuantity ?? null,
          availabilityOpen: price.availabilityOpen,
          availabilityReason: price.availabilityReason ?? null,
          personalizationFields: price.personalizationFields,
          giftWrapPrice: price.giftWrapPrice ?? null,
          crossSellItems: await crossSellNames(price.crossSellItems),
          timeslotMinutes: price.timeslotMinutes ?? null,
          lowStockThreshold: price.lowStockThreshold ?? null,
          // Étape E : mécanismes de confiance / logistique / opérations
          negotiable: price.negotiable ?? false,
          negotiationMinDiscount: price.negotiationMinDiscount ?? null,
          commissionPercent: price.commissionPercent ?? null,
          commissionEmployeeIds: price.commissionEmployeeIds ?? null,
          vipRestricted: price.vipRestricted ?? false,
          allowedSegments: price.allowedSegments ?? null,
          storePickup: price.storePickup ?? null,
          preorder: price.preorder ?? null,
          warranty: price.warranty ?? null,
          returnPolicy: price.returnPolicy ?? null,
          lotTrace: price.lotTrace ?? null,
          techSheet: price.techSheet ?? null,
          notice: price.notice ?? null,
          supplier: price.supplier ?? null,
          zoneRestriction: price.zoneRestriction ?? null,
          target: await resolveTarget(price.itemType, price.itemId),
        };
      } catch (err) {
        result[`${it.itemType}:${it.itemId}`] = {
          itemType: it.itemType,
          itemId: it.itemId,
          error: (err as Error).message,
          available: false,
        };
      }
    }

    res.json(successResponse({ items: result }));
  })
);

// ============================================
// POST /api/public/delivery-info
// Checkout intelligent : le client choisit entre livraison et retrait selon la
// config du business (deliveryEnabled/pickupEnabled), avec les zones et frais réels.
// Public — fonctionne pour le client connecté ET l'invité.
// ============================================
router.post(
  '/delivery-info',
  catchAsyncErrors(async (req: Request, res: Response) => {
    const { productIds = [], serviceIds = [] } = (req.body || {}) as {
      productIds?: string[];
      serviceIds?: string[];
    };

    // Résoudre le business depuis le panier
    let businessId: string | undefined;
    for (const id of productIds) {
      const p = await prisma.product.findUnique({ where: { id }, select: { businessId: true } });
      if (p?.businessId) {
        businessId = p.businessId;
        break;
      }
    }
    if (!businessId) {
      for (const id of serviceIds) {
        const s = await prisma.service.findUnique({ where: { id }, select: { businessId: true } });
        if (s?.businessId) {
          businessId = s.businessId;
          break;
        }
      }
    }

    if (!businessId) {
      res.json(successResponse({ business: null, zones: [] }));
      return;
    }

    const [business, settings, zones] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          latitude: true,
          longitude: true,
          phone: true,
          whatsapp: true,
        },
      }),
      prisma.businessSettings.findUnique({ where: { businessId } }),
      prisma.deliveryZone.findMany({
        where: { businessId, isActive: true },
        orderBy: { fee: 'asc' },
        select: {
          id: true,
          name: true,
          fee: true,
          minOrder: true,
          estimatedTime: true,
        },
      }),
    ]);

    res.json(
      successResponse({
        business: business
          ? {
              ...business,
              deliveryEnabled: settings?.deliveryEnabled ?? true,
              pickupEnabled: settings?.pickupEnabled ?? true,
              minDeliveryAmount: settings?.minDeliveryAmount
                ? Number(settings.minDeliveryAmount)
                : null,
            }
          : null,
        zones: zones.map((z) => ({
          id: z.id,
          name: z.name,
          fee: Number(z.fee),
          minOrder: z.minOrder ? Number(z.minOrder) : null,
          estimatedTime: z.estimatedTime ?? null,
        })),
      })
    );
  })
);

router.get(
  '/plans',
  catchAsyncErrors(async (_req: Request, res: Response) => {
    const data = await getPublicPlatformPlans();
    res.json(successResponse(data));
  })
);

router.get(
  '/business/:slug/public',
  catchAsyncErrors(async (req: Request, res: Response) => {
    const business = await businessService.getPublicBusiness(req.params.slug);
    res.json(successResponse(business));
  })
);

// ============================================
// GET /api/home — alimente les sections de la page d accueil
// (témoignages + FAQ + stats + modules marketplace, 100% depuis la base, zéro statique)
// ============================================
router.get(
  '/home',
  catchAsyncErrors(async (_req: Request, res: Response) => {
    const prisma = (await import('../lib/db')).prisma;
    const [testimonials, faqs, stats, topBusinesses, modules] = await Promise.all([
      prisma.testimonial.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
      }),
      prisma.faqEntry.findMany({
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
      }),
      prisma.siteStat.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.business.findMany({
        where: { isActive: true, verificationStatus: 'VERIFIED', deletedAt: null },
        orderBy: { rating: 'desc' },
        take: 6,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          country: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
        },
      }),
      prisma.developerModule.findMany({
        where: { isPublished: true, isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        take: 8,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          currency: true,
          isFree: true,
          category: true,
          isFeatured: true,
          isVerified: true,
          tags: true,
        },
      }),
    ]);
    res.json(successResponse({ testimonials, faqs, stats, topBusinesses, modules }));
  })
);

export default router;
