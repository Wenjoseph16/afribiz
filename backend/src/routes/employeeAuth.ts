import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middlewares/validators';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { authenticateEmployee } from '../services/employeeAuth';

const router = Router();

/**
 * Validation du body : phone + pinCode (4-6 chiffres)
 */
const employeeAuthSchema = z.object({
  phone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .max(20, 'Numéro de téléphone trop long'),
  pinCode: z
    .string()
    .min(4, 'Le code PIN doit contenir au moins 4 chiffres')
    .max(6, 'Le code PIN ne peut pas dépasser 6 chiffres')
    .regex(/^\d+$/, 'Le code PIN ne doit contenir que des chiffres'),
});

/**
 * POST /api/business/:businessId/employee-auth
 *
 * Authentification employé par PIN contextuel.
 * Chaque business a ses propres employés et PINs.
 *
 * Body: { phone, pinCode }
 * Response: { token, expiresIn, employee, permissions, maxDiscountPercentage }
 */
router.post(
  '/:businessId/employee-auth',
  validateBody(employeeAuthSchema),
  catchAsyncErrors(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const { phone, pinCode } = req.body;

    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const result = await authenticateEmployee({
      businessId,
      phone,
      pinCode,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Authentification réussie',
    });
  })
);

export default router;
