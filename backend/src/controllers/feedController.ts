import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as feedService from '../services/feedService';

export const getFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    const trending = await feedService.getTrendingFeed(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json({ success: true, data: trending });
    return;
  }
  const result = await feedService.getFeed(
    req.user.id,
    Number(req.query.page) || 1,
    Number(req.query.limit) || 20
  );
  res.json({ success: true, data: result });
});

export const getTrendingFeed = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await feedService.getTrendingFeed(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json({ success: true, data: result });
  }
);
