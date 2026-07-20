import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as commentService from '../services/commentService';
import { CommentTargetType } from '@prisma/client';

export const createComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const { type, referenceId, content, parentId } = req.body;

  if (!type || !referenceId || !content?.trim()) {
    throw new AppError('type, referenceId et content sont requis', 400);
  }

  const validTypes = Object.values(CommentTargetType);
  if (!validTypes.includes(type)) {
    throw new AppError(`Type invalide. Types supportés: ${validTypes.join(', ')}`, 400);
  }

  const comment = await commentService.createComment({
    userId: req.user.id,
    type: type as CommentTargetType,
    referenceId,
    content: content.trim(),
    parentId,
  });

  res.status(201).json(successResponse(comment, 'Commentaire ajouté'));
});

export const getComments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { type, referenceId } = req.params;
  const { page, limit } = req.query;

  if (!type || !referenceId) {
    throw new AppError('type et referenceId sont requis', 400);
  }

  const result = await commentService.getComments(
    type as CommentTargetType,
    referenceId as string,
    Number(page) || 1,
    Number(limit) || 20
  );

  res.json(successResponse(result));
});

export const getCommentById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const comment = await commentService.getCommentById(req.params.id);
  if (!comment) {
    throw new AppError('Commentaire introuvable', 404);
  }
  res.json(successResponse(comment));
});

export const updateComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const { content } = req.body;
  if (!content?.trim()) {
    throw new AppError('content est requis', 400);
  }

  const comment = await commentService.updateComment(req.params.id, req.user.id, {
    content: content.trim(),
  });
  if (!comment) {
    throw new AppError('Commentaire introuvable', 404);
  }
  res.json(successResponse(comment, 'Commentaire modifié'));
});

export const deleteComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const deleted = await commentService.deleteComment(req.params.id, req.user.id);
  if (!deleted) {
    throw new AppError('Commentaire introuvable', 404);
  }
  res.json(successResponse(null, 'Commentaire supprimé'));
});
