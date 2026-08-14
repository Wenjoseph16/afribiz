import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as supplierService from '../services/supplierService';

export const listSuppliers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const suppliers = await supplierService.listSuppliers(req.user.id);
  res.json(successResponse({ suppliers }));
});

export const createSupplier = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const supplier = await supplierService.createSupplier(req.user.id, req.body);
  res.status(201).json(successResponse(supplier, 'Fournisseur créé'));
});

export const updateSupplier = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const supplier = await supplierService.updateSupplier(req.user.id, req.params.id, req.body);
  res.json(successResponse(supplier, 'Fournisseur mis à jour'));
});

export const deleteSupplier = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  await supplierService.deleteSupplier(req.user.id, req.params.id);
  res.json(successResponse(null, 'Fournisseur supprimé'));
});
