import { Router, Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as businessService from '../services/business';
import { getPublicPlatformPlans } from '../services/subscriptions';

const router = Router();

router.get(
  '/plans',
  catchAsyncErrors(async (_req: Request, res: Response) => {
    const data = await getPublicPlatformPlans();
    res.json(successResponse(data));
  })
);

router.get(
  '/business/:slug/public',
  catchAsyncErrors(async (req: Request, res: Response) => {
    const business = await businessService.getPublicBusiness(req.params.slug);
    res.json(successResponse(business));
  })
);

export default router;
