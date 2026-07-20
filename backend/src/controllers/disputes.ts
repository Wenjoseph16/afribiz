import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as disputeService from '../services/disputes';
import { createDisputeSchema, updateDisputeSchema } from '../validators/disputes';

export const listDisputes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await disputeService.listDisputes(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const dispute = await disputeService.getDispute(req.user.id, req.params.id);
  res.json({ success: true, data: dispute });
});

export const createDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  // Validation des données avec Zod
  const validatedData = createDisputeSchema.parse(req.body);

  const dispute = await disputeService.createDispute(req.user.id, validatedData);
  res.status(201).json({ success: true, data: dispute, message: 'Litige créé avec succès' });
});

export const updateDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  // Validation des données avec Zod
  const validatedData = updateDisputeSchema.parse(req.body);

  const dispute = await disputeService.updateDispute(req.user.id, req.params.id, validatedData);
  res.json({ success: true, data: dispute, message: 'Litige mis à jour avec succès' });
});

export const deleteDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await disputeService.deleteDispute(req.user.id, req.params.id);
  res.json({ success: true, message: 'Litige supprimé avec succès' });
});

// ============================================
// DISPUTE EVIDENCE
// ============================================

export const addEvidence = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { fileName, fileUrl, fileType, fileSize } = req.body;
  if (!fileName || !fileUrl || !fileType) {
    throw new AppError('fileName, fileUrl et fileType sont requis', 400);
  }
  const result = await disputeService.addDisputeEvidence(req.user.id, req.params.id, {
    fileName,
    fileUrl,
    fileType,
    fileSize,
  });
  res.json({ success: true, data: result, message: 'Preuve ajoutée au litige' });
});

export const getEvidence = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await disputeService.getDisputeEvidence(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const deleteEvidence = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { fileUrl } = req.body;
  if (!fileUrl) throw new AppError('fileUrl est requis', 400);
  await disputeService.deleteDisputeEvidence(req.user.id, req.params.id, fileUrl);
  res.json({ success: true, message: 'Preuve supprimée du litige' });
});

// ============================================
// DISPUTE COMMENTS (Messages)
// ============================================

export const addComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { content } = req.body;
  if (!content?.trim()) throw new AppError('Le message ne peut pas être vide', 400);
  const comment = await disputeService.addDisputeComment(
    req.user.id,
    req.params.id,
    content.trim()
  );
  res.status(201).json({ success: true, data: comment, message: 'Message ajouté' });
});

export const getComments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const comments = await disputeService.getDisputeComments(req.user.id, req.params.id);
  res.json({ success: true, data: comments });
});
