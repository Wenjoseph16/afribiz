import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as signatureService from '../services/signature';

export const createSignatureReq = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { documentId, signerEmail, signerName } = req.body;
  const result = await signatureService.createSignatureRequest(documentId, req.user.id, signerEmail, signerName);
  res.status(201).json({ success: true, data: result, message: 'Demande de signature envoyée' });
});

export const signDocumentCtrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { token } = req.params;
  const { signatureData } = req.body;
  const result = await signatureService.signDocument(token, signatureData, req.ip);
  res.json({ success: true, data: result, message: 'Document signé avec succès' });
});

export const verifySignatureCtrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await signatureService.verifySignature(req.params.documentId);
  res.json({ success: true, data: result });
});

export const listSignatureReqs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await signatureService.listSignatureRequests(req.user.id, req.query.documentId as string);
  res.json({ success: true, data: result });
});
