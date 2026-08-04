import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as businessService from '../services/business';
import { getPublicPlatformPlans } from '../services/subscriptions';

const router = Router();

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
      prisma.testimonial.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
      prisma.faqEntry.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
      prisma.siteStat.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.business.findMany({
        where: { isActive: true, verificationStatus: 'VERIFIED', deletedAt: null },
        orderBy: { rating: 'desc' },
        take: 6,
        select: { id: true, name: true, slug: true, type: true, city: true, country: true, rating: true, reviewCount: true, isVerified: true },
      }),
      prisma.developerModule.findMany({
        where: { isPublished: true, isActive: true },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        take: 8,
        select: { id: true, name: true, slug: true, description: true, price: true, currency: true, isFree: true, category: true, isFeatured: true, isVerified: true, tags: true },
      }),
    ]);
    res.json(successResponse({ testimonials, faqs, stats, topBusinesses, modules }));
  })
);

export default router;
