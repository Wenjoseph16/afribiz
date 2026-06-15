import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as storyService from '../services/storyService';
import { resolveBusinessAccess } from '../lib/businessAccess';

export const getActiveStories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await storyService.getActiveStories(req.user?.id);
  res.json(successResponse(data));
});

export const getBusinessStories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;
  const data = await storyService.getBusinessStories(businessId, req.user?.id);
  res.json(successResponse(data));
});

export const createStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await storyService.createStory({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Story créée'));
});

export const viewStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await storyService.viewStory(req.params.id, req.user?.id, req.ip);
  res.json(successResponse(data));
});

export const clickStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await storyService.recordStoryClick(req.params.id);
  res.json(successResponse({ clicked: true }));
});

export const deleteStory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  await storyService.deleteStory(req.params.id, access.businessId);
  res.json(successResponse(null, 'Story supprimée'));
});

export const getFeedItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { types, page, limit, businessId } = req.query;
  const data = await storyService.getFeedItems({
    types: types ? (types as string).split(',') : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    businessId: businessId as string,
  });
  res.json(successResponse(data));
});

export const createFeedItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await storyService.createFeedItem({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Feed item créé'));
});

export const deleteFeedItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  await storyService.deleteFeedItem(req.params.id, access.businessId);
  res.json(successResponse(null, 'Feed item supprimé'));
});
