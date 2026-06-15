import { z } from 'zod';

export const rescheduleBookingSchema = z.object({
  startDate: z.string().min(1, 'Nouvelle date requise'),
  endDate: z.string().optional(),
});

export const updateMyOrderSchema = z.object({
  deliveryAddress: z.string().optional(),
  deliveryInstructions: z.string().optional(),
  notes: z.string().optional(),
  contactPhone: z.string().optional(),
  scheduledAt: z.string().optional(),
}).passthrough().optional();

