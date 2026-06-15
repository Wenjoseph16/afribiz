import { z } from 'zod';

const deliveryStatuses = ['PREPARING', 'ASSIGNED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED', 'CANCELLED'] as const;
const driverStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'] as const;
const deliveryTypes = ['STANDARD', 'EXPRESS', 'SCHEDULED', 'PICKUP', 'GROUPED'] as const;
const proofTypes = ['SIGNATURE', 'PHOTO', 'PIN', 'MANUAL'] as const;

export const createDeliveryZoneSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  fee: z.number().min(0, 'Frais requis'),
  minOrder: z.number().min(0).optional(),
  estimatedTime: z.number().int().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial();

export const createDriverSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  phone: z.string().min(1, 'Téléphone requis'),
  email: z.string().email().optional(),
  photo: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
  status: z.enum(driverStatuses).optional().default('AVAILABLE'),
  zones: z.array(z.string()).optional().default([]),
  maxDistance: z.number().int().positive().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const createDeliverySchema = z.object({
  orderId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  type: z.enum(deliveryTypes).optional().default('STANDARD'),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deliveryInstructions: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  fee: z.number().min(0).optional().default(0),
  estimatedMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const updateDeliverySchema = createDeliverySchema.partial();

export const assignDriverSchema = z.object({
  driverId: z.string().uuid('Chauffeur requis'),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(deliveryStatuses),
  notes: z.string().optional(),
});

export const addTrackingEventSchema = z.object({
  status: z.enum(deliveryStatuses).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  notes: z.string().optional(),
});

export const addDeliveryProofSchema = z.object({
  type: z.enum(proofTypes),
  url: z.string().optional(),
  value: z.string().optional(),
  notes: z.string().optional(),
});
