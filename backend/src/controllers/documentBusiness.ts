import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as docService from '../services/documentBusiness';

export const listDocuments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.listDocuments(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.getDocument(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.createDocument(req.user.id, req.body);
  res.status(201).json({ success: true, data: result, message: 'Document cree' });
});

export const updateDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.updateDocument(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result, message: 'Document mis a jour' });
});

export const deleteDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.deleteDocument(req.user.id, req.params.id);
  res.json({ success: true, data: result, message: 'Document supprime' });
});

export const getDocumentStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifie' }); return; }
  const result = await docService.getDocumentStats(req.user.id);
  res.json({ success: true, data: result });
});
