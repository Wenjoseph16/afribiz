import { z } from 'zod';

export const submitSurveySchema = z
  .object({
    score: z.number().min(1, 'Note minimale 1').max(5, 'Note maximale 5'),
    feedback: z.string().max(2000, 'Commentaire trop long').optional(),
    orderId: z.string().optional(),
    bookingId: z.string().optional(),
  })
  .passthrough();
