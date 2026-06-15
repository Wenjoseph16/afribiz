import { Router, Request, Response } from 'express';
import { prisma } from '../lib/db';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';

const router = Router();

router.get('/public/business/:slug', catchAsyncErrors(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      owner: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });
  if (!business) {
    return res.status(404).json({ success: false, error: 'Business non trouvé' });
  }
  res.json(successResponse(business));
}));

export default router;
