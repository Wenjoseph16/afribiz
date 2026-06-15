import { z } from 'zod';

export const inviteReferralSchema = z.object({
  email: z.string().email('Email invalide'),
});
