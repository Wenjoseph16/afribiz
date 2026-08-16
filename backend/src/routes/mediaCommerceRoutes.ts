import { Router, Response } from 'express';
import { authMiddleware, optionalAuth } from '../middlewares/auth';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as mediaActions from '../services/mediaActionsService';
import { prisma } from '../lib/db';

const router = Router();

// Liste des médias avec données commerce
router.get(
  '/media-commerce',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.query.businessId as string | undefined;
    const where: any = {};
    if (businessId) where.businessId = businessId;
    else if (req.user?.primaryRole === 'BUSINESS') {
      const business = await prisma.business.findFirst({
      where: { ownerId: req.user!.id, deletedAt: null },
        select: { id: true },
      });
      if (business) where.businessId = business.id;
    }

    const [stories, shorts] = await Promise.all([
      prisma.story.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.short.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);

    const items = [
      ...stories.map((s) => ({ ...s, type: 'story' })),
      ...shorts.map((s) => ({ ...s, type: 'short' })),
    ];
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(successResponse({ items }));
  })
);

// Récupère les infos commerce d'un média (produit, service, etc.)
router.get(
  '/media/:type/:id/commerce',
  optionalAuth,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const { type, id } = req.params;
    if (!['STORY', 'SHORT'].includes(type)) {
      res.status(400).json({ success: false, error: 'Type must be STORY or SHORT' });
      return;
    }
    const result = await mediaActions.getMediaCommerceData(type as 'STORY' | 'SHORT', id);
    res.json(successResponse(result));
  })
);

// Ajouter au panier depuis un média
router.post(
  '/media/add-to-cart',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }
    const { productId, quantity } = req.body;
    const item = await mediaActions.addToCartFromMedia(req.user.id, productId, quantity);
    res.json(successResponse(item, 'Ajouté au panier'));
  })
);

// Commander directement depuis un média
router.post(
  '/media/order',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }
    const { productId, businessId, quantity, paymentMethod } = req.body;
    const order = await mediaActions.createOrderFromMedia(
      req.user.id,
      productId,
      businessId,
      quantity || 1,
      paymentMethod
    );
    res.status(201).json(successResponse(order, 'Commande créée'));
  })
);

// Réserver un service depuis un média
router.post(
  '/media/book',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }
    const { serviceId, businessId, scheduledAt } = req.body;
    const booking = await mediaActions.createBookingFromMedia(
      req.user.id,
      serviceId,
      businessId,
      scheduledAt
    );
    res.status(201).json(successResponse(booking, 'Réservation créée'));
  })
);

// Installer un module depuis un média développeur
router.post(
  '/media/install-module',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }
    const { moduleId, businessId } = req.body;
    const installation = await mediaActions.installModuleFromMedia(
      req.user.id,
      moduleId,
      businessId
    );
    res.json(successResponse(installation, 'Module installé'));
  })
);

export default router;
