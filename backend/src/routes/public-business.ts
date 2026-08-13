import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as businessService from '../services/business';
import { getPublicPlatformPlans } from '../services/subscriptions';
import { prisma } from '../lib/db';

const router = Router();

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
