import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function createAdCampaign(userId: string, data: any): Promise<any> {
  const { advertiserType, businessId, developerId, creatives, packageId, ...campaignData } = data;

  if (advertiserType === 'EXTERNAL') {
    const externalRequired = ['companyName', 'responsibleName', 'phone', 'email'];
    for (const field of externalRequired) {
      if (!data[field]) {
        throw new AppError(`Champ requis pour annonceur externe : ${field}`, 400);
      }
    }
  } else if (advertiserType === 'BUSINESS') {
    if (!businessId) {
      throw new AppError('businessId requis pour un annonceur BUSINESS', 400);
    }
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new AppError('Business non trouvé', 404);
    }
    if (business.ownerId !== userId) {
      throw new AppError("Vous n'êtes pas le propriétaire de ce business", 403);
    }
  } else if (advertiserType === 'DEVELOPER') {
    if (!developerId) {
      throw new AppError('developerId requis pour un annonceur DEVELOPER', 400);
    }
    const developer = await prisma.developerProfile.findUnique({ where: { id: developerId } });
    if (!developer) {
      throw new AppError('Développeur non trouvé', 404);
    }
    if (developer.userId !== userId) {
      throw new AppError("Vous n'êtes pas le propriétaire de ce profil développeur", 403);
    }
  } else {
    throw new AppError("Type d'annonceur invalide", 400);
  }

  // Durée : 1 à 30 jours (les prix des emplacements sont configurables par l'admin)
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 0) {
    throw new AppError('La date de fin doit être après la date de début', 400);
  }
  if (diffHours > 30 * 24) {
    throw new AppError("La durée d'une campagne ne peut pas dépasser 30 jours", 400);
  }

  // Si l'annonceur choisit un emplacement (slot), le budget est calculé automatiquement
  // à partir des prix de l'emplacement (configurables par l'admin) × la durée choisie.
  const durationDays = Math.max(1, Math.ceil(diffHours / 24));
  if (data.slotId) {
    const slot = await prisma.adSlot.findUnique({ where: { id: data.slotId } });
    if (!slot) throw new AppError('Emplacement publicitaire non trouvé', 404);
    if (!slot.isActive) throw new AppError('Cet emplacement est désactivé', 400);
    const price = computeCampaignPrice(slot, durationDays);
    if (price > 0) campaignData.budget = price;
    campaignData.slotId = slot.id;
    campaignData.targetPages = campaignData.targetPages?.length
      ? campaignData.targetPages
      : [slot.page];
    campaignData.targetPositions = campaignData.targetPositions?.length
      ? campaignData.targetPositions
      : [slot.position];
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      ...campaignData,
      advertiserType,
      businessId: advertiserType === 'BUSINESS' ? businessId : undefined,
      developerId: advertiserType === 'DEVELOPER' ? developerId : undefined,
      packageId: packageId || undefined,
      status: 'PENDING',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      creatives: {
        create: (creatives || []).map((c: any) => ({
          placementPage: c.placementPage,
          placementPosition: c.placementPosition,
          format: c.format,
          mainImage: c.mainImage,
          secondaryImages: c.secondaryImages || [],
          banner: c.banner,
          video: c.video,
          logo: c.logo,
          adText: c.adText,
          destinationUrl: c.destinationUrl,
          cta: c.cta,
          ctaColor: c.ctaColor,
          targetCountries: c.targetCountries || [],
          targetCities: c.targetCities || [],
          minRating: c.minRating,
          isActive: true,
          sortOrder: c.sortOrder || 0,
        })),
      },
    },
    include: {
      creatives: true,
      package: true,
    },
  });

  return campaign;
}

export async function getAdCampaignsForBusiness(businessId: string): Promise<any[]> {
  return prisma.adCampaign.findMany({
    where: { businessId },
    include: {
      creatives: true,
      package: true,
      _count: {
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdCampaignsForDeveloper(developerId: string): Promise<any[]> {
  return prisma.adCampaign.findMany({
    where: { developerId },
    include: {
      creatives: true,
      package: true,
      _count: {
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdCampaignById(campaignId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      creatives: true,
      package: true,
      invoice: true,
      business: {
        select: { id: true, name: true, slug: true, logo: true },
      },
      _count: {
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  return campaign;
}

export async function getPendingAdCampaigns(): Promise<any[]> {
  return prisma.adCampaign.findMany({
    where: { status: 'PENDING' },
    include: {
      creatives: true,
      package: true,
      business: {
        select: { id: true, name: true, slug: true, logo: true, ownerId: true },
      },
      _count: {
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function validateAdCampaign(campaignId: string, adminId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }
  if (campaign.status !== 'PENDING' && campaign.status !== 'VALIDATED') {
    throw new AppError('Seules les campagnes en attente peuvent être validées', 400);
  }

  const now = new Date();
  const newStatus = campaign.startDate > now ? 'SCHEDULED' : 'ACTIVE';

  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      status: newStatus,
      validatedAt: now,
      validatedBy: adminId,
      activatedAt: newStatus === 'ACTIVE' ? now : undefined,
    },
    include: {
      creatives: true,
      package: true,
    },
  });

  return updated;
}

export async function rejectAdCampaign(campaignId: string, reason: string): Promise<any> {
  if (!reason || reason.trim().length === 0) {
    throw new AppError('Un motif de rejet est requis', 400);
  }

  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
    include: {
      creatives: true,
    },
  });
}

export async function suspendAdCampaign(campaignId: string, reason: string): Promise<any> {
  if (!reason || reason.trim().length === 0) {
    throw new AppError('Un motif de suspension est requis', 400);
  }

  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'SUSPENDED',
      suspendReason: reason,
      suspendedAt: new Date(),
    },
    include: {
      creatives: true,
    },
  });
}

export async function getActiveAdCreatives(
  page?: string,
  position?: string,
  country?: string,
  city?: string,
  limit?: number
): Promise<any[]> {
  const now = new Date();
  const where: any = {
    isActive: true,
    campaign: {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    },
  };

  if (page) where.placementPage = page;
  if (position) where.placementPosition = position;
  if (country) where.targetCountries = { has: country };
  if (city) where.targetCities = { has: city };

  const creatives = await prisma.adCreative.findMany({
    where,
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          objective: true,
          geoTarget: true,
          advertiserType: true,
          companyName: true,
          business: {
            select: { id: true, name: true, slug: true, logo: true },
          },
        },
      },
    },
  });

  // Rotation équitable : shuffle + limite de pubs par emplacement (maxPerSlot)
  for (let i = creatives.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [creatives[i], creatives[j]] = [creatives[j], creatives[i]];
  }
  return creatives.slice(0, Math.max(1, limit || 10));
}

export async function trackImpression(campaignId: string, data: any): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  await prisma.adImpression.create({
    data: {
      campaignId,
      creativeId: data.creativeId || undefined,
      userId: data.userId || undefined,
      ipAddress: data.ipAddress || undefined,
      userAgent: data.userAgent || undefined,
      page: data.page || 'unknown',
      position: data.position || 'unknown',
      referrer: data.referrer || undefined,
      sessionId: data.sessionId || undefined,
      cost: data.cost || 0,
    },
  });

  if (data.creativeId) {
    await prisma.adCreative
      .update({
        where: { id: data.creativeId },
        data: { impressions: { increment: 1 } },
      })
      .catch(() => null);
  }
}

export async function trackClick(campaignId: string, data: any): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  await prisma.adClick.create({
    data: {
      campaignId,
      impressionId: data.impressionId || undefined,
      userId: data.userId || undefined,
      ipAddress: data.ipAddress || undefined,
      userAgent: data.userAgent || undefined,
      page: data.page || 'unknown',
      position: data.position || 'unknown',
      cost: data.cost || 0,
    },
  });

  if (data.creativeId) {
    await prisma.adCreative.update({
      where: { id: data.creativeId },
      data: {
        clicks: { increment: 1 },
      },
    });
  }
}

export async function trackConversion(campaignId: string, data: any): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  await prisma.adConversion.create({
    data: {
      campaignId,
      clickId: data.clickId || undefined,
      type: data.type || 'lead',
      value: data.value || undefined,
      reference: data.reference || undefined,
      userId: data.userId || undefined,
    },
  });

  if (data.creativeId) {
    await prisma.adCreative.update({
      where: { id: data.creativeId },
      data: { conversions: { increment: 1 } },
    });
  }
}

export async function reportAd(
  campaignId: string,
  data: { reason: string; reporterEmail?: string; details?: string }
): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  // Stocker le signalement comme conversion de type 'report'
  await prisma.adConversion.create({
    data: {
      campaignId,
      type: 'report',
      value: 0,
      reference: JSON.stringify({
        reason: data.reason,
        reporterEmail: data.reporterEmail || null,
        details: data.details || null,
        reportedAt: new Date().toISOString(),
      }),
    },
  });

  // Suspendre automatiquement la campagne si signalée
  if (campaign.status === 'ACTIVE') {
    await prisma.adCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SUSPENDED',
        suspendReason: `Signalé : ${data.reason}`,
        suspendedAt: new Date(),
      },
    });
  }
}

export async function getAdStats(campaignId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      _count: {
        select: {
          impressions: true,
          clicks: true,
          conversions: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  const impressions = campaign._count.impressions;
  const clicks = campaign._count.clicks;
  const conversions = campaign._count.conversions;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  const [impressionAgg, clickAgg] = await Promise.all([
    prisma.adImpression.aggregate({
      where: { campaignId },
      _sum: { cost: true },
    }),
    prisma.adClick.aggregate({
      where: { campaignId },
      _sum: { cost: true },
    }),
  ]);

  const impressionCost = impressionAgg._sum.cost?.toNumber() || 0;
  const clickCost = clickAgg._sum.cost?.toNumber() || 0;
  const totalSpend = impressionCost + clickCost;

  return {
    campaignId,
    campaignName: campaign.name,
    status: campaign.status,
    impressions,
    clicks,
    ctr: Math.round(ctr * 100) / 100,
    conversions,
    conversionRate: clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0,
    totalSpend,
    budget: campaign.budget?.toNumber() || 0,
  };
}

export async function getAdvertiserStats(userId: string, role: string): Promise<any> {
  let campaigns;

  if (role === 'BUSINESS') {
    const business = await prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) {
      throw new AppError('Business non trouvé', 404);
    }
    campaigns = await prisma.adCampaign.findMany({
      where: { businessId: business.id },
      include: {
        _count: {
          select: {
            impressions: true,
            clicks: true,
            conversions: true,
          },
        },
      },
    });
  } else if (role === 'DEVELOPER') {
    const developer = await prisma.developerProfile.findUnique({ where: { userId } });
    if (!developer) {
      throw new AppError('Profil développeur non trouvé', 404);
    }
    campaigns = await prisma.adCampaign.findMany({
      where: { developerId: developer.id },
      include: {
        _count: {
          select: {
            impressions: true,
            clicks: true,
            conversions: true,
          },
        },
      },
    });
  } else {
    throw new AppError('Rôle non autorisé pour les statistiques publicitaires', 400);
  }

  const totalImpressions = campaigns.reduce((sum, c) => sum + c._count.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c._count.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c._count.conversions, 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget?.toNumber() || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED').length;

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    completedCampaigns,
    totalImpressions,
    totalClicks,
    totalConversions,
    ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    totalBudget,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      impressions: c._count.impressions,
      clicks: c._count.clicks,
      conversions: c._count.conversions,
      budget: c.budget?.toNumber() || 0,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
  };
}

export async function getAllAdCampaigns(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.status) {
    where.status = params.status;
  }

  const [campaigns, total] = await Promise.all([
    prisma.adCampaign.findMany({
      where,
      skip,
      take: limit,
      include: {
        creatives: true,
        package: true,
        business: {
          select: { id: true, name: true, slug: true, logo: true, ownerId: true },
        },
        _count: {
          select: {
            impressions: true,
            clicks: true,
            conversions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adCampaign.count({ where }),
  ]);

  return {
    data: campaigns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getMyCampaigns(userId: string, role: string, _filters?: any): Promise<any[]> {
  if (role === 'BUSINESS') {
    const business = await prisma.business.findFirst({ where: { ownerId: userId } });
    if (!business) return [];
    return getAdCampaignsForBusiness(business.id);
  } else if (role === 'DEVELOPER') {
    const developer = await prisma.developerProfile.findUnique({ where: { userId } });
    if (!developer) return [];
    return getAdCampaignsForDeveloper(developer.id);
  }
  return [];
}

export async function expireCampaigns(): Promise<number> {
  const now = new Date();

  const result = await prisma.adCampaign.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
    },
    data: {
      status: 'COMPLETED',
      completedAt: now,
    },
  });

  return result.count;
}

export async function autoActivateCampaigns(): Promise<number> {
  const now = new Date();

  const result = await prisma.adCampaign.updateMany({
    where: {
      status: 'SCHEDULED',
      startDate: { lte: now },
    },
    data: {
      status: 'ACTIVE',
      activatedAt: now,
    },
  });

  return result.count;
}

// ===================== EMPLACEMENTS (SLOTS) — prix configurables par l'admin =====================

/**
 * Calcule le prix d'une campagne pour un emplacement et une durée (jours).
 * Interpolation linéaire entre les paliers 1j / 7j / 30j définis par l'admin.
 */
export function computeCampaignPrice(
  slot: { price1Day: any; price7Days: any; price30Days: any },
  days: number
): number {
  const p1 = Number(slot.price1Day || 0);
  const p7 = Number(slot.price7Days || 0);
  const p30 = Number(slot.price30Days || 0);
  if (p1 <= 0 && p7 <= 0 && p30 <= 0) return 0;
  const d = Math.min(30, Math.max(1, days));
  if (d <= 7) {
    // Interpolation 1j → 7j
    if (d === 1) return p1;
    return Math.round(p1 + ((p7 - p1) * (d - 1)) / 6);
  }
  if (d === 7) return p7;
  if (d >= 30) return p30;
  // Interpolation 7j → 30j
  return Math.round(p7 + ((p30 - p7) * (d - 7)) / 23);
}

export async function getAdSlots(activeOnly = false): Promise<any[]> {
  const slots = await prisma.adSlot.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ page: 'asc' }, { position: 'asc' }],
    include: { _count: { select: { campaigns: true } } },
  });
  return slots.map((s: any) => ({
    ...s,
    price1Day: Number(s.price1Day || 0),
    price7Days: Number(s.price7Days || 0),
    price30Days: Number(s.price30Days || 0),
  }));
}

export async function createAdSlot(data: any): Promise<any> {
  const existing = await prisma.adSlot.findUnique({
    where: { page_position: { page: data.page, position: data.position } },
  });
  if (existing) throw new AppError('Un emplacement existe déjà pour cette page/position', 400);
  return prisma.adSlot.create({
    data: {
      page: data.page,
      position: data.position,
      label: data.label,
      description: data.description || null,
      width: data.width || 0,
      height: data.height || 0,
      price1Day: data.price1Day || 0,
      price7Days: data.price7Days || 0,
      price30Days: data.price30Days || 0,
      maxPerSlot: data.maxPerSlot || 10,
      isActive: data.isActive !== false,
    },
  });
}

export async function updateAdSlot(id: string, data: any): Promise<any> {
  const slot = await prisma.adSlot.findUnique({ where: { id } });
  if (!slot) throw new AppError('Emplacement non trouvé', 404);
  const upd: any = {};
  if (data.label !== undefined) upd.label = data.label;
  if (data.description !== undefined) upd.description = data.description;
  if (data.width !== undefined) upd.width = Number(data.width);
  if (data.height !== undefined) upd.height = Number(data.height);
  if (data.price1Day !== undefined) upd.price1Day = Number(data.price1Day);
  if (data.price7Days !== undefined) upd.price7Days = Number(data.price7Days);
  if (data.price30Days !== undefined) upd.price30Days = Number(data.price30Days);
  if (data.maxPerSlot !== undefined) upd.maxPerSlot = Number(data.maxPerSlot);
  if (data.isActive !== undefined) upd.isActive = !!data.isActive;
  return prisma.adSlot.update({ where: { id }, data: upd });
}

export async function deleteAdSlot(id: string): Promise<void> {
  await prisma.adSlot.delete({ where: { id } });
}

export async function getAdPackages(): Promise<any[]> {
  return prisma.adPackage.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });
}

export async function getAdRevenue(): Promise<any> {
  const [totalInvoices, monthlyInvoices, pendingInvoices, totalImpressionCost, totalClickCost] =
    await Promise.all([
      prisma.adInvoice.aggregate({
        _sum: { amount: true },
      }),
      prisma.adInvoice.findMany({
        where: {
          issuedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { amount: true, status: true, issuedAt: true },
      }),
      prisma.adInvoice.findMany({
        where: { status: 'PENDING' },
        select: { amount: true },
      }),
      prisma.adImpression.aggregate({
        _sum: { cost: true },
      }),
      prisma.adClick.aggregate({
        _sum: { cost: true },
      }),
    ]);

  const invoiceTotal = totalInvoices._sum.amount?.toNumber() || 0;
  const monthlyTotal = monthlyInvoices.reduce((sum, inv) => sum + (inv.amount?.toNumber() || 0), 0);
  const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + (inv.amount?.toNumber() || 0), 0);
  const adSpend =
    (totalImpressionCost._sum.cost?.toNumber() || 0) + (totalClickCost._sum.cost?.toNumber() || 0);

  return {
    totalRevenue: invoiceTotal,
    monthlyRevenue: monthlyTotal,
    pendingInvoices: pendingTotal,
    pendingInvoiceCount: pendingInvoices.length,
    totalAdSpend: adSpend,
  };
}

export async function createAdPackage(data: any): Promise<any> {
  const existing = await prisma.adPackage.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new AppError('Un package avec ce slug existe déjà', 409);
  }

  return prisma.adPackage.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      advertiserType: data.advertiserType,
      placements: data.placements || [],
      durationHours: data.durationHours,
      price: data.price,
      currency: data.currency || 'FCFA',
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });
}

export async function updateAdPackage(id: string, data: any): Promise<any> {
  const existing = await prisma.adPackage.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Package publicitaire non trouvé', 404);
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = await prisma.adPackage.findUnique({ where: { slug: data.slug } });
    if (slugExists) {
      throw new AppError('Un package avec ce slug existe déjà', 409);
    }
  }

  return prisma.adPackage.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      description: data.description !== undefined ? data.description : undefined,
      advertiserType: data.advertiserType !== undefined ? data.advertiserType : undefined,
      placements: data.placements !== undefined ? data.placements : undefined,
      durationHours: data.durationHours !== undefined ? data.durationHours : undefined,
      price: data.price !== undefined ? data.price : undefined,
      currency: data.currency !== undefined ? data.currency : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });
}

async function isCampaignOwner(
  campaign: { businessId?: string | null; developerId?: string | null },
  userId: string
): Promise<boolean> {
  if (campaign.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: campaign.businessId },
      select: { ownerId: true },
    });
    if (business?.ownerId === userId) return true;
  }
  if (campaign.developerId) {
    const developer = await prisma.developerProfile.findUnique({
      where: { id: campaign.developerId },
      select: { userId: true },
    });
    if (developer?.userId === userId) return true;
  }
  return false;
}

export async function pauseAdCampaign(campaignId: string, userId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { business: { select: { ownerId: true } } },
  });
  if (!campaign) throw new AppError('Campagne publicitaire non trouvée', 404);
  if (campaign.status !== 'ACTIVE')
    throw new AppError('Seules les campagnes actives peuvent être mises en pause', 400);
  const isOwner = await isCampaignOwner(campaign, userId);
  if (!isOwner) throw new AppError("Vous n'êtes pas autorisé à modifier cette campagne", 403);
  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'PAUSED' as any },
    include: { creatives: true, package: true },
  });
}

export async function resumeAdCampaign(campaignId: string, userId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new AppError('Campagne publicitaire non trouvée', 404);
  if (campaign.status !== 'PAUSED')
    throw new AppError('Seules les campagnes en pause peuvent être reprises', 400);
  const isOwner = await isCampaignOwner(campaign, userId);
  if (!isOwner) throw new AppError("Vous n'êtes pas autorisé à modifier cette campagne", 403);
  return prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: 'ACTIVE' },
    include: { creatives: true, package: true },
  });
}

export async function deleteAdCampaign(campaignId: string, userId: string): Promise<void> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) throw new AppError('Campagne publicitaire non trouvée', 404);
  const isOwner = await isCampaignOwner(campaign, userId);
  if (!isOwner) throw new AppError("Vous n'êtes pas autorisé à supprimer cette campagne", 403);
  if (!['PENDING', 'REJECTED', 'COMPLETED', 'PAUSED'].includes(campaign.status)) {
    throw new AppError('Cette campagne ne peut pas être supprimée dans son état actuel', 400);
  }
  await prisma.adCampaign.delete({ where: { id: campaignId } });
}

export async function updateAdCampaign(
  campaignId: string,
  userId: string,
  data: any
): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { business: { select: { ownerId: true } } },
  });
  if (!campaign) throw new AppError('Campagne publicitaire non trouvée', 404);

  const isOwner = await isCampaignOwner(campaign as any, userId);
  if (!isOwner) throw new AppError("Vous n'êtes pas autorisé à modifier cette campagne", 403);

  const canEdit = ['PENDING', 'REJECTED', 'PAUSED'].includes(campaign.status);
  if (!canEdit)
    throw new AppError('Cette campagne ne peut pas être modifiée dans son état actuel', 400);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.objective !== undefined) updateData.objective = data.objective;
  if (data.budget !== undefined) updateData.budget = data.budget;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.companyName !== undefined) updateData.companyName = data.companyName;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.geoTarget !== undefined) updateData.geoTarget = data.geoTarget;

  // Mettre le statut en PENDING si la campagne était REJECTED (après modifications)
  if (campaign.status === 'REJECTED') {
    updateData.status = 'PENDING';
    updateData.rejectionReason = null;
  }

  await prisma.adCampaign.update({
    where: { id: campaignId },
    data: updateData,
    include: { creatives: true, package: true },
  });

  // Mettre à jour les créatifs si fournis
  if (data.creatives && data.creatives.length > 0) {
    for (const creative of data.creatives) {
      if (creative.id) {
        await prisma.adCreative.update({
          where: { id: creative.id },
          data: {
            adText: creative.adText !== undefined ? creative.adText : undefined,
            mainImage: creative.mainImage !== undefined ? creative.mainImage : undefined,
            destinationUrl:
              creative.destinationUrl !== undefined ? creative.destinationUrl : undefined,
            placementPage:
              creative.placementPage !== undefined ? creative.placementPage : undefined,
            placementPosition:
              creative.placementPosition !== undefined ? creative.placementPosition : undefined,
            format: creative.format !== undefined ? creative.format : undefined,
            cta: creative.cta !== undefined ? creative.cta : undefined,
          },
        });
      }
    }
  }

  return prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: { creatives: true, package: true },
  });
}

export async function generateInvoice(campaignId: string): Promise<any> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      package: true,
      invoice: true,
    },
  });

  if (!campaign) {
    throw new AppError('Campagne publicitaire non trouvée', 404);
  }

  if (campaign.invoice) {
    throw new AppError('Une facture existe déjà pour cette campagne', 409);
  }

  const invoiceNumber = `INV-ADS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  let amount = 0;
  if (campaign.budget) {
    amount = campaign.budget.toNumber();
  } else if (campaign.package) {
    amount = campaign.package.price.toNumber();
  }

  const invoice = await prisma.adInvoice.create({
    data: {
      campaignId,
      number: invoiceNumber,
      amount,
      currency: 'FCFA',
      status: 'PENDING',
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: {
        campaignName: campaign.name,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        packageName: campaign.package?.name || null,
        durationHours: campaign.package?.durationHours || null,
      },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  return invoice;
}
