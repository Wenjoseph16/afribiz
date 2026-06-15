import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Response } from 'express';
import * as hybridService from '../services/hybridPaymentService';
import * as escrowSteps from '../services/escrowStepsService';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authMiddleware);

router.get('/orders/:orderId/payments', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await hybridService.getHybridPayments(req.params.orderId);
  res.json({ success: true, data: result });
}));

router.post('/orders/:orderId/payments/hybrid', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { amount, method, reference, isManual, proofUrl, notes } = req.body;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user!.id } });
  if (!business) throw new AppError('Business non trouvé', 404);
  const payment = await hybridService.addHybridPayment({
    orderId: req.params.orderId,
    userId: req.user!.id,
    businessId: business.id,
    amount, method, reference, isManual, proofUrl, notes,
  });
  res.status(201).json({ success: true, data: payment });
}));

router.post('/payments/:paymentId/verify', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { verified, notes } = req.body;
  const result = await hybridService.verifyHybridPayment(req.user!.id, req.params.paymentId, verified, notes);
  res.json({ success: true, data: result });
}));

router.post('/escrow/stepped', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, amount, totalSteps, stepDescriptions } = req.body;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user!.id } });
  if (!business) throw new AppError('Business non trouvé', 404);
  const escrow = await escrowSteps.createStepEscrow({
    businessId: business.id, orderId, amount, totalSteps, stepDescriptions,
  });
  res.status(201).json({ success: true, data: escrow });
}));

router.post('/escrow/:id/release-step/:stepNumber', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const business = await prisma.business.findUnique({ where: { ownerId: req.user!.id } });
  if (!business) throw new AppError('Business non trouvé', 404);
  const escrow = await escrowSteps.releaseStep(req.params.id, business.id, parseInt(req.params.stepNumber));
  res.json({ success: true, data: escrow });
}));

router.get('/escrow/:id/steps', catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const business = await prisma.business.findUnique({ where: { ownerId: req.user!.id } });
  if (!business) throw new AppError('Business non trouvé', 404);
  const progress = await escrowSteps.getStepProgress(req.params.id, business.id);
  res.json({ success: true, data: progress });
}));

export default router;
