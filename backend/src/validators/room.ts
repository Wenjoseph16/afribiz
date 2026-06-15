import { z } from 'zod';

const roomTypes = ['STANDARD', 'VIP', 'SUITE', 'STUDIO', 'APARTMENT', 'VILLA', 'DORMITORY', 'FAMILY', 'DOUBLE', 'SINGLE', 'DELUXE', 'BUNGALOW'] as const;
const roomStatuses = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'CLOSED', 'BLOCKED'] as const;
const bathroomTypes = ['PRIVATE', 'SHARED', 'COMMUNAL'] as const;

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Le nom de la chambre est requis').max(200),
  roomNumber: z.string().optional(),
  type: z.enum(roomTypes).optional().default('STANDARD'),
  shortDescription: z.string().max(300).optional(),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit \u00eatre positif'),
  priceWeekend: z.number().positive().optional(),
  priceHighSeason: z.number().positive().optional(),
  priceLowSeason: z.number().positive().optional(),
  currency: z.string().default('FCFA'),
  isPromotional: z.boolean().default(false),
  promotionalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  capacity: z.number().int().positive().default(1),
  adults: z.number().int().positive().default(1),
  children: z.number().int().min(0).default(0),
  beds: z.number().int().positive().default(1),
  size: z.number().positive().optional(),
  bathroom: z.enum(bathroomTypes).optional().default('PRIVATE'),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  checkInTime: z.string().default('14:00'),
  checkOutTime: z.string().default('12:00'),
  quantity: z.number().int().positive().default(1),
  breakfastIncluded: z.boolean().default(false),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const updateRoomStatusSchema = z.object({
  status: z.enum(roomStatuses),
});

export const blockRoomDatesSchema = z.object({
  startDate: z.string().min(1, 'Date de d\u00e9but requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  reason: z.string().min(2, 'Motif requis'),
  notes: z.string().optional(),
});
