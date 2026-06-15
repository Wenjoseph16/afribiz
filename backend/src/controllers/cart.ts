import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as cartService from '../services/cart';

export const getCart = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.getCart(req.user.id);
  res.json(successResponse(data));
});

export const addItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.addItem(req.user.id, req.body);
  res.json(successResponse(data, 'Article ajouté au panier'));
});

export const updateItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.updateItem(req.user.id, req.params.itemId, req.body);
  res.json(successResponse(data, 'Panier mis à jour'));
});

export const removeItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.removeItem(req.user.id, req.params.itemId);
  res.json(successResponse(data, 'Article retiré du panier'));
});

export const clearCart = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.clearCart(req.user.id);
  res.json(successResponse(data, 'Panier vidé'));
});

export const applyCoupon = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.applyCoupon(req.user.id, req.body.code);
  res.json(successResponse(data, 'Code promo appliqué'));
});

export const removeCoupon = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.removeCoupon(req.user.id);
  res.json(successResponse(data, 'Code promo retiré'));
});

export const checkout = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await cartService.checkout(req.user.id, req.body);
  res.status(201).json(successResponse(data, 'Commande créée avec succès'));
});
