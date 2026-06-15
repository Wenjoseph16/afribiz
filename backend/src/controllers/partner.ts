import { Request, Response, NextFunction } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as partnerService from '../services/partner';

// ===================== PARTNERS =====================

export const listPartners = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listPartners(req.user!.id, req.query as any);
  res.json({ success: true, data });
});

export const getPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.getPartner(req.user!.id, req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'Partenaire non trouvé' });
  res.json({ success: true, data });
});

export const createPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createPartner(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Partenaire ajouté avec succès' });
});

export const updatePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.updatePartner(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Partenaire mis à jour avec succès' });
});

export const deletePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await partnerService.deletePartner(req.user!.id, req.params.id);
  res.json({ success: true, message: 'Partenaire désactivé avec succès' });
});

export const getPartnerStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.getPartnerStats(req.user!.id);
  res.json({ success: true, data });
});

export const getPublicPartners = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await partnerService.getPublicPartners(req.params.slug);
  res.json({ success: true, data });
});

// ===================== CONTRACTS =====================

export const listContracts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listContracts(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createContract = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createContract(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Contrat créé avec succès' });
});

export const updateContract = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.updateContract(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Contrat mis à jour avec succès' });
});

export const signContract = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.signContract(req.user!.id, req.params.id, req.body.byBusiness);
  res.json({ success: true, data, message: 'Contrat signé avec succès' });
});

// ===================== TRANSACTIONS =====================

export const listTransactions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listTransactions(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createTransaction = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createTransaction(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Paiement enregistré' });
});

// ===================== ASSIGNMENTS =====================

export const listAssignments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listAssignments(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createAssignment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createAssignment(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Partenaire assigné avec succès' });
});

export const updateAssignment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.updateAssignment(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Assignation mise à jour' });
});

// ===================== REVIEWS =====================

export const listReviews = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listReviews(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createReview(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Avis enregistré' });
});

// ===================== DOCUMENTS =====================

export const listDocuments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listDocuments(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createDocument(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Document ajouté' });
});

export const deleteDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await partnerService.deleteDocument(req.user!.id, req.params.id);
  res.json({ success: true, message: 'Document supprimé' });
});

// ===================== PERMISSIONS =====================

export const listPermissions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.listPermissions(req.user!.id, req.query.partnerId as string);
  res.json({ success: true, data });
});

export const createPermission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.createPermission(req.user!.id, req.body);
  res.status(201).json({ success: true, data, message: 'Permission ajoutée' });
});

export const updatePermission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.updatePermission(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Permission mise à jour' });
});

export const deletePermission = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await partnerService.deletePermission(req.user!.id, req.params.id);
  res.json({ success: true, message: 'Permission supprimée' });
});

// ===================== ANALYTICS =====================

export const getPartnerAnalytics = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await partnerService.getPartnerAnalytics(req.user!.id);
  res.json({ success: true, data });
});
