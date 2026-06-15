import { z } from 'zod';

const bookingTypes = ['SERVICE','ROOM','EVENT','RESOURCE','TABLE'] as const;
const bookingSources = ['AFRIBIZ_SITE','MARKETPLACE','WHATSAPP','PHONE','WALK_IN'] as const;
const bookingStatuses = ['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','RESCHEDULED','ARRIVED','NO_SHOW'] as const;
const cancelPolicies = ['FLEXIBLE','MODERATE','STRICT','NON_REFUNDABLE'] as const;
const reminderTypes = ['CONFIRMATION','REMINDER','FOLLOWUP','CANCELLATION'] as const;
const reminderChannels = ['WHATSAPP','SMS','PUSH','EMAIL'] as const;
const resourceTypes = ['ROOM','EMPLOYEE','EQUIPMENT','VEHICLE','SPACE','TABLE'] as const;
const weekDays = [0,1,2,3,4,5,6] as const;

export const createBookingSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  type: z.enum(bookingTypes).optional().default('SERVICE'),
  source: z.enum(bookingSources).optional().default('AFRIBIZ_SITE'),
  isWalkIn: z.boolean().optional().default(false),
  serviceId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  guests: z.number().int().positive().optional().default(1),
  adults: z.number().int().positive().optional().default(1),
  children: z.number().int().min(0).optional().default(0),
  numberOfPeople: z.number().int().positive().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  location: z.string().optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().optional(),
  depositAmount: z.number().positive().optional(),
  depositPaid: z.boolean().optional().default(false),
  cancellationPolicy: z.enum(cancelPolicies).optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  cancelReason: z.string().optional(),
});

export const createTimeSlotSchema = z.object({
  resourceId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().optional().default(true),
  maxCapacity: z.number().int().positive().optional().default(1),
  slotDuration: z.number().int().positive().optional(),
  bufferTime: z.number().int().min(0).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateTimeSlotSchema = createTimeSlotSchema.partial();

export const createResourceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(resourceTypes),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateResourceSchema = createResourceSchema.partial();

export const sendReminderSchema = z.object({
  type: z.enum(reminderTypes),
  channel: z.enum(reminderChannels),
});
