import { z } from 'zod';

/**
 * ============================================
 * CATALOG ATTACHMENTS — validateurs
 * ============================================
 * Chaque mécanisme rattachable à un article du catalogue a sa propre
 * validation de config. Le service vérifie ensuite que l'article existe.
 */

export const CATALOG_ITEM_TYPES = [
  'PRODUCT',
  'SERVICE',
  'MENU_ITEM',
  'ROOM',
  'RENTAL',
  'EVENT',
  'TRAINING',
] as const;

export const ATTACHMENT_SOURCE_TYPES = [
  'DISCOUNT_TIER', // prix dégressifs par quantité (existant)
  'TAX', // TVA / taxe locale par article
  'MIN_MAX_QTY', // quantité min / max
  'AVAILABILITY', // disponibilité programmée (jours + heures)
  'PERSONALIZATION', // personnalisation (gravure, broderie…) avec prix
  'GIFT_WRAP', // emballage cadeau
  'CROSS_SELL', // ventes croisées (« les clients achètent aussi »)
  'TIMESLOT', // réservation sur créneau horaire
  'LOW_STOCK', // urgence / stock limité (badge + seuil)
  'CUSTOM_BADGE', // badge personnalisé (existant)
  'NEGOTIATION', // autoriser la négociation du prix (Prix Flash Client)
  'COMMISSION', // commission employé sur cet article
  'VIP_ONLY', // réservé aux clients VIP / segments précis
  'STORE_PICKUP', // retrait en boutique dispo/non pour cet article
  'PREORDER', // précommande (délai, message)
  'TECH_SHEET', // fiche technique (caractéristiques)
  'NOTICE', // notice / guide PDF
  'WARRANTY', // garantie (durée + conditions)
  'RETURN_POLICY', // politique de retour / SAV
  'LOT_TRACE', // lot + date de péremption
  'SUPPLIER', // fournisseur + prix d'achat + délai
  'ZONE_RESTRICTION', // zones de livraison restreintes pour cet article
] as const;

export type AttachmentSourceType = (typeof ATTACHMENT_SOURCE_TYPES)[number];

const itemTypeSchema = z.enum(CATALOG_ITEM_TYPES);

const configByType = {
  DISCOUNT_TIER: z
    .object({
      tiers: z
        .array(
          z.object({
            minQuantity: z.number().int().min(1),
            percent: z.number().min(0).max(100),
          })
        )
        .min(1),
    })
    .default({ tiers: [] }),
  TAX: z.object({
    rate: z.number().min(0).max(100, 'Le taux de taxe ne peut pas dépasser 100%'),
  }),
  MIN_MAX_QTY: z
    .object({
      minQuantity: z.number().int().min(0),
      maxQuantity: z.number().int().min(1),
    })
    .refine((v) => v.maxQuantity > v.minQuantity, {
      message: 'La quantité maximale doit être supérieure à la minimale',
    }),
  AVAILABILITY: z
    .object({
      days: z.array(z.number().int().min(0).max(6)).default([]), // 0 = dimanche … 6 = samedi (JS getDay)
      hours: z
        .array(
          z.object({
            open: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure d'ouverture invalide (HH:MM)"),
            close: z
              .string()
              .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure de fermeture invalide (HH:MM)'),
          })
        )
        .default([]),
    })
    .refine(
      (v) =>
        v.hours.every((h) => {
          const [oh, om] = h.open.split(':').map(Number);
          const [ch, cm] = h.close.split(':').map(Number);
          return oh * 60 + om < ch * 60 + cm;
        }),
      { message: "Chaque plage horaire doit avoir une fermeture après l'ouverture" }
    ),
  PERSONALIZATION: z.object({
    fields: z
      .array(
        z.object({
          key: z.string().min(1).max(40),
          label: z.string().min(1).max(80),
          price: z.number().min(0).default(0),
          required: z.boolean().default(false),
        })
      )
      .min(1),
  }),
  GIFT_WRAP: z.object({
    price: z.number().min(0),
  }),
  CROSS_SELL: z.object({
    items: z
      .array(
        z.object({
          itemType: itemTypeSchema,
          itemId: z.string().min(1),
        })
      )
      .min(1)
      .max(20),
  }),
  TIMESLOT: z.object({
    durationMinutes: z.number().int().min(5).max(1440),
  }),
  LOW_STOCK: z.object({
    threshold: z.number().int().min(1),
  }),
  CUSTOM_BADGE: z.object({
    label: z.string().min(1).max(40),
    emoji: z.string().default('⭐'),
  }),
  NEGOTIATION: z.object({
    enabled: z.boolean().default(true),
    minDiscountPercent: z.number().min(0).max(90).optional(), // plancher de remise accepté
  }),
  COMMISSION: z.object({
    percent: z.number().min(0).max(100),
    employeeIds: z.array(z.string()).optional(), // vide = tous les employés
  }),
  VIP_ONLY: z.object({
    allowedSegments: z.array(z.string()).min(1), // VIP | LOYAL | NEW | segment custom
  }),
  STORE_PICKUP: z.object({
    available: z.boolean().default(true),
    instructions: z.string().max(300).optional(),
  }),
  PREORDER: z.object({
    leadDays: z.number().int().min(0).max(365),
    message: z.string().max(200).optional(),
  }),
  TECH_SHEET: z.object({
    attributes: z
      .array(
        z.object({
          key: z.string().min(1).max(40),
          label: z.string().min(1).max(80),
          value: z.string().min(1).max(300),
        })
      )
      .min(1)
      .max(30),
  }),
  NOTICE: z.object({
    url: z.string().min(1).max(500),
    label: z.string().max(120).optional(),
  }),
  WARRANTY: z.object({
    durationDays: z.number().int().min(1),
    conditions: z.string().max(500).optional(),
  }),
  RETURN_POLICY: z.object({
    days: z.number().int().min(0).max(365),
    conditions: z.string().max(500).optional(),
  }),
  LOT_TRACE: z.object({
    trackLots: z.boolean().default(true),
    defaultExpiryDays: z.number().int().min(1).max(3650).optional(),
  }),
  SUPPLIER: z.object({
    supplierId: z.string().min(1),
    costPrice: z.number().min(0).optional(),
    leadTimeDays: z.number().int().min(0).optional(),
  }),
  ZONE_RESTRICTION: z.object({
    zoneIds: z.array(z.string()).min(1),
    mode: z.enum(['ONLY', 'EXCLUDE']).default('ONLY'), // ONLY = livre seulement là, EXCLUDE = ne livre pas là
  }),
};

export const createCatalogAttachmentSchema = z.object({
  itemType: itemTypeSchema,
  itemId: z.string().min(1),
  sourceType: z.enum(ATTACHMENT_SOURCE_TYPES),
  config: z.unknown().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCatalogAttachmentSchema = z.object({
  config: z.unknown().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

/** Valide la config selon le sourceType (au moment de create/update). */
export function validateAttachmentConfig(sourceType: string, config: unknown) {
  const schema = (configByType as Record<string, z.ZodTypeAny>)[sourceType];
  if (!schema) {
    throw new Error(`Type de rattachement inconnu: ${sourceType}`);
  }
  return schema.parse(config ?? {});
}
