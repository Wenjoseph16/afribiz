import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { sensitiveLimiter } from '../middlewares/rateLimiter';
import * as negotiationService from '../services/negotiationService';

const router = Router();

// ============================================
// PUBLIC — le client propose un prix (fiche article, mini-site, WhatsApp)
// ============================================
router.post(
  '/public/negotiations',
  sensitiveLimiter,
  catchAsyncErrors(async (req: Request, res: Response) => {
    const offer = await negotiationService.createOffer(req.body);
    res.status(201).json(
      successResponse({
        offerId: offer.id,
        status: offer.status,
        message: 'Offre envoyée — le commerçant va vous répondre.',
      })
    );
  })
);

// ============================================
// PUBLIC — le lien éphémère : résolution (affiche l'article au prix accordé)
// ============================================
router.get(
  '/public/negotiated/:token',
  catchAsyncErrors(async (req: Request, res: Response) => {
    const data = await negotiationService.resolveToken(req.params.token);
    res.json(successResponse(data));
  })
);

// ============================================
// PUBLIC — le lien éphémère : commander au prix accordé (1 usage)
// ============================================
router.post(
  '/public/negotiated/:token/order',
  sensitiveLimiter,
  catchAsyncErrors(async (req: Request, res: Response) => {
    const order = await negotiationService.createNegotiatedOrder(req.params.token, req.body);
    res.status(201).json(successResponse(order));
  })
);

// ============================================
// BUSINESS — liste des offres de négociation
// ============================================
router.get(
  '/business/negotiations',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    // Multi-activité : header x-business-id OU query businessId (pattern chantier 5)
    const businessId =
      (req.headers['x-business-id'] as string) || (req.query.businessId as string) || null;
    const data = await negotiationService.listOffers(req.user.id, businessId);
    res.json(successResponse(data));
  })
);

// ============================================
// BUSINESS — détail d'une offre
// ============================================
router.get(
  '/business/negotiations/:id',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await negotiationService.getOffer(req.user.id, req.params.id);
    res.json(successResponse(data));
  })
);

// ============================================
// BUSINESS — accepter → prix accordé + lien éphémère généré
// ============================================
router.post(
  '/business/negotiations/:id/accept',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await negotiationService.acceptOffer(req.user.id, req.params.id);
    res.json(successResponse(data));
  })
);

// ============================================
// BUSINESS — contre-proposer
// ============================================
router.post(
  '/business/negotiations/:id/counter',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { counterPrice, message } = req.body;
    const data = await negotiationService.counterOffer(
      req.user.id,
      req.params.id,
      counterPrice,
      message
    );
    res.json(successResponse(data));
  })
);

// ============================================
// BUSINESS — refuser
// ============================================
router.post(
  '/business/negotiations/:id/decline',
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await negotiationService.declineOffer(req.user.id, req.params.id);
    res.json(successResponse(data));
  })
);

export default router;
