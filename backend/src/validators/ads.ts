import { z } from 'zod';

const advertiserTypeEnum = z.enum(['BUSINESS', 'DEVELOPER', 'EXTERNAL']);
const placementPageEnum = z.enum(['HOMEPAGE', 'MARKETPLACE', 'DASHBOARD_CLIENT', 'DASHBOARD_BUSINESS', 'DASHBOARD_DEVELOPER', 'MODULE_PAGE', 'EVENT_PAGE', 'NOTIFICATION_CENTER']);
const placementPositionEnum = z.enum(['HERO_BANNER', 'TOP_BANNER', 'BOTTOM_BANNER', 'SIDEBAR', 'SPONSORED_CARD', 'SPONSORED_RESULT', 'CAROUSEL', 'FEATURED_BLOCK', 'PROMO_WIDGET', 'RECOMMENDED', 'POPUP']);
const formatEnum = z.enum(['BANNER_HORIZONTAL', 'BANNER_VERTICAL', 'SPONSORED_CARD', 'CAROUSEL', 'WIDGET', 'VIDEO', 'POPUP', 'NOTIFICATION']);
const objectiveEnum = z.enum(['BRAND_AWARENESS', 'TRAFFIC', 'LEADS', 'SALES', 'INSTALLS', 'PROMOTION']);

const creativeSchema = z.object({
  placementPage: placementPageEnum,
  placementPosition: placementPositionEnum,
  format: formatEnum,
  mainImage: z.string().optional(),
  banner: z.string().optional(),
  video: z.string().optional(),
  logo: z.string().optional(),
  adText: z.string().optional(),
  destinationUrl: z.string().optional(),
  cta: z.string().optional(),
  targetCountries: z.array(z.string()).optional(),
  targetCities: z.array(z.string()).optional(),
});

const MAX_CAMPAIGN_DURATION_HOURS = 48;

const campaignSchemaFields = {
  advertiserType: advertiserTypeEnum,
  companyName: z.string().optional(),
  responsibleName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  name: z.string().min(1, 'Le nom de la campagne est requis'),
  objective: objectiveEnum,
  description: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  budget: z.number().positive().optional(),
  geoTarget: z.array(z.string()).optional(),
  creatives: z.array(creativeSchema).min(1, 'Au moins un creative est requis'),
} as const;

export const createCampaignSchema = z.object(campaignSchemaFields).superRefine((data, ctx) => {
  if (data.startDate && data.endDate) {
    const diffMs = data.endDate.getTime() - data.startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de fin doit être après la date de début',
        path: ['endDate'],
      });
    }
    if (diffHours > MAX_CAMPAIGN_DURATION_HOURS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La durée d'une campagne ne peut pas dépasser ${MAX_CAMPAIGN_DURATION_HOURS} heures`,
        path: ['endDate'],
      });
    }
  }
});

export const updateCampaignSchema = z.object(campaignSchemaFields).partial();

export const validateCampaignSchema = z.object({
  adminId: z.string(),
});

export const rejectCampaignSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const suspendCampaignSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const trackImpressionSchema = z.object({
  campaignId: z.string(),
  creativeId: z.string().optional(),
  page: z.string(),
  position: z.string(),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  sessionId: z.string().optional(),
});

export const trackClickSchema = z.object({
  campaignId: z.string(),
  impressionId: z.string().optional(),
  page: z.string(),
  position: z.string(),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const createPackageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  advertiserType: advertiserTypeEnum,
  placements: z.array(z.string()).min(1),
  durationHours: z.number().int().positive(),
  price: z.number().positive(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();
