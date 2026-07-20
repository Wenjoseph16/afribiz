import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as postService from '../services/postService';

export const createPost = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId, ...data } = req.body;
  const post = await postService.createPost(req.user.id, businessId, data);
  res.status(201).json({ success: true, data: post });
});

export const updatePost = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const post = await postService.updatePost(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: post });
});

export const deletePost = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await postService.deletePost(req.user.id, req.params.id);
  res.json({ success: true, message: 'Post supprimé' });
});

export const getPost = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const post = await postService.getPost(req.params.id);
  res.json({ success: true, data: post });
});

export const listPosts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, status, tag, page, limit } = req.query;
  const result = await postService.listPosts(businessId as string | null, {
    status: status as string,
    tag: tag as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, ...result });
});

export const toggleLike = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await postService.toggleLike(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

export const getFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await postService.getFeed({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, ...result });
});
