import { z } from 'zod';

const disputeTypeEnum = z.enum(['ORDER', 'BOOKING', 'SERVICE', 'PAYMENT', 'OTHER']);
const disputePriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const disputeStatusEnum = z.enum(['OUVERT', 'EN_COURS', 'RESOLU', 'FERME']);

export const createDisputeSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  reference: z.string().optional(),
  type: disputeTypeEnum.optional(),
  priority: disputePriorityEnum.optional(),
  amount: z.number().positive().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
});

export const updateDisputeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  type: disputeTypeEnum.optional(),
  priority: disputePriorityEnum.optional(),
  status: disputeStatusEnum.optional(),
  amount: z.number().positive().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
});
