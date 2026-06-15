import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function generateDailyTips(businessId: string): Promise<any> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true, hours: { take: 1 } },
  });
  if (!business) throw new AppError('Business not found', 404);

  const tips: { type: string; priority: 'high' | 'medium' | 'low'; message: string; action?: string }[] = [];

  const hasHours = business.hours && business.hours.length > 0;
  const score = business.score;

  // Profile completeness tips
  if (!business.logo) tips.push({ 
    type: 'profile', priority: 'high', message: 'Ajoutez un logo pour rendre votre profil plus professionnel.', action: 'Mettre à jour le profil' 
  });
  if (!business.description) tips.push({ 
    type: 'profile', priority: 'high', message: 'Ajoutez une description de votre entreprise pour attirer plus de clients.', action: 'Ajouter une description' 
  });
  if (!business.address) tips.push({ 
    type: 'profile', priority: 'medium', message: 'Ajoutez votre adresse pour que les clients vous trouvent facilement.' 
  });
  if (!business.phone) tips.push({ 
    type: 'profile', priority: 'medium', message: 'Ajoutez un numéro de téléphone pour être contacté facilement.' 
  });
  if (!hasHours) tips.push({ 
    type: 'profile', priority: 'medium', message: 'Configurez vos horaires d\'ouverture pour informer vos clients.' 
  });

  if (score) {
    if (score.completionPct < 50) tips.push({
      type: 'score', priority: 'high', message: 'Votre profil est complété à ' + score.completionPct.toFixed(0) + '%. Complétez-le pour améliorer votre score AfriScore.',
      action: 'Voir mon profil'
    });
    if (score.overallScore < 400) tips.push({
      type: 'score', priority: 'high', message: 'Votre AfriScore est de ' + score.overallScore + '/1000. Un score faible peut réduire votre visibilité.',
      action: 'Améliorer mon score'
    });
    if (score.reliabilityScore < 100) tips.push({
      type: 'reliability', priority: 'high', message: 'Votre fiabilité opérationnelle est basse. Assurez-vous d\'honorer vos commandes et réservations.'
    });
  }

  // Check recent activity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recentOrders, products, reviews] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { businessId, deletedAt: null, isActive: true } }),
    prisma.businessReview.findMany({ where: { businessId, createdAt: { gte: thirtyDaysAgo } }, select: { rating: true } }),
  ]);

  // Activity tips
  if (recentOrders === 0 && business.createdAt < thirtyDaysAgo) tips.push({
    type: 'activity', priority: 'high', message: 'Aucune commande reçue depuis 30 jours. Lancez une promotion pour attirer des clients.',
    action: 'Créer une promotion'
  });
  if (products === 0) tips.push({
    type: 'products', priority: 'medium', message: 'Aucun produit publié. Ajoutez vos produits pour commencer à vendre en ligne.',
    action: 'Ajouter un produit'
  });

  const negativeReviews = reviews.filter((r) => r.rating < 3);
  if (negativeReviews.length > 0) tips.push({
    type: 'reviews', priority: 'high', message: negativeReviews.length + ' avis négatif(s) récemment. Répondez-y pour montrer votre réactivité.'
  });

  // Growth tip based on score trend
  if (score && score.overallScore >= 600) tips.push({
    type: 'growth', priority: 'low', message: 'Votre AfriScore est bon ! Pensez à activer les publicités AfriBiz Ads pour booster votre visibilité.',
    action: 'Créer une campagne pub'
  });

  if (tips.length === 0) tips.push({
    type: 'success', priority: 'low', message: 'Tout va bien ! Continuez à maintenir la qualité de votre service.'
  });

  return {
    businessId,
    businessName: business.name,
    generatedAt: new Date(),      score: score ? { overall: score.overallScore, category: score.category } : null,
    tips: tips.slice(0, 10),
    totalUnresolvedIssues: tips.filter((t) => t.priority === 'high').length,
  };
}

export async function getBusinessHealth(businessId: string): Promise<any> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [orders, bookings, reviews, pageViews, activeCampaigns] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { providerId: business.ownerId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.adCampaign.count({ where: { businessId: business.id, status: 'ACTIVE' } }),
  ]);

  const totalProducts = await prisma.product.count({ where: { businessId, deletedAt: null, isActive: true } });

  const score = business.score;
  const healthScore = score ? Math.round(
    (score.overallScore / 10) * 0.5 + // 50% from AfriScore
    Math.min(orders * 5, 200) * 0.2 + // 20% from recent orders
    Math.min(pageViews / 10, 100) * 0.2 + // 20% from traffic
    (totalProducts > 0 ? 100 : 0) * 0.1 // 10% from products
  ) : 0;

  let status: 'excellent' | 'good' | 'fair' | 'critical' = 'fair';
  if (healthScore >= 80) status = 'excellent';
  else if (healthScore >= 60) status = 'good';
  else if (healthScore >= 40) status = 'fair';
  else status = 'critical';

  return {
    businessId,
    businessName: business.name,
    healthScore,
    status,
    metrics: {
      afriScore: score?.overallScore || 0,
      orders30d: orders,
      bookings30d: bookings,
      reviews30d: reviews,
      pageViews30d: pageViews,
      totalProducts,
      activeAdCampaigns: activeCampaigns,
    },
    scoreCategory: score?.category || 'VERY_LOW',
  };
}
