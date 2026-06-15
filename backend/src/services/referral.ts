import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishReferralInvited, publishReferralConverted, publishReferralRewardAwarded } from '../events/publishers';

function generateReferralCode(_userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getMyReferralCode(userId: string) {
  // Find or create a referral code for the user
  // We use the first referral record's code as the user's code
  const existing = await prisma.referral.findFirst({
    where: { referrerId: userId },
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  const code = existing?.code || generateReferralCode(userId);

  const [referrals, rewards] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalRewards = rewards.reduce((sum, r) => sum + Number(r.amount), 0);

  const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?ref=${code}`;

  return {
    code,
    shareUrl,
    totalReferrals: referrals.length,
    totalRewards,
    referrals,
    rewards,
  };
}

export async function createReferral(referrerId: string, refereeEmail: string) {
  // Check referee doesn't already have an account
  const referee = await prisma.user.findUnique({ where: { email: refereeEmail } });
  if (referee) throw new AppError('Cet utilisateur a déjà un compte', 400);

  const code = generateReferralCode(referrerId);

  const referrer = await prisma.user.findUnique({ where: { id: referrerId }, select: { firstName: true, lastName: true } });
  if (!referrer) throw new AppError('Utilisateur non trouvé', 404);

  const referral = await prisma.referral.create({
    data: {
      referrerId,
      code,
      status: 'PENDING',
      refereeId: undefined,
    },
  });

  publishReferralInvited({
    userId: referrerId,
    refereeEmail,
    code,
  });

  return referral;
}

export async function processReferralSignup(refereeId: string, code: string) {
  const referral = await prisma.referral.findFirst({
    where: { code, status: 'PENDING' },
    include: { referrer: true },
  });

  if (!referral) return null; // Silently ignore invalid codes

  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      refereeId,
      status: 'CONVERTED',
      convertedAt: new Date(),
    },
  });

  publishReferralConverted({
    userId: referral.referrerId,
    refereeId,
    code,
  });

  // Award referral bonus (points)
  const points = 100;

  // Add points to referrer's loyalty if they have a loyalty program
  const referrerBusiness = await prisma.business.findFirst({
    where: { ownerId: referral.referrerId },
    select: { id: true },
  });

  if (referrerBusiness) {
    const loyalty = await prisma.loyaltyPoints.upsert({
      where: {
        businessId_clientId: {
          businessId: referrerBusiness.id,
          clientId: referral.referrerId,
        },
      },
      create: {
        businessId: referrerBusiness.id,
        clientId: referral.referrerId,
        totalPoints: points,
        lifetimePoints: points,
        tier: 'BRONZE',
      },
      update: {
        totalPoints: { increment: points },
        lifetimePoints: { increment: points },
      },
    });

    await prisma.loyaltyTransaction.create({
      data: {
        loyaltyId: loyalty.id,
        type: 'BONUS',
        points,
        description: 'Bonus de parrainage',
        reference: referral.id,
      },
    });
  }

  // Create reward record
  await prisma.referralReward.create({
    data: {
      referralId: referral.id,
      userId: referral.referrerId,
      type: 'POINTS',
      amount: 0,
      points,
      status: 'AWARDED',
      awardedAt: new Date(),
    },
  });

  publishReferralRewardAwarded({
    userId: referral.referrerId,
    points,
    type: 'POINTS',
  });

  return referral;
}

export async function getMyReferrals(userId: string) {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return referrals;
}

export async function getMyReferralRewards(userId: string) {
  const rewards = await prisma.referralReward.findMany({
    where: { userId },
    include: {
      referral: {
        include: {
          referee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rewards;
}

export async function getReferralStats(userId: string) {
  const [totalReferrals, convertedReferrals, totalRewards] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, status: 'CONVERTED' } }),
    prisma.referralReward.aggregate({
      where: { userId },
      _sum: { points: true, amount: true },
    }),
  ]);

  return {
    totalReferrals,
    convertedReferrals,
    conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0,
    totalPointsEarned: totalRewards._sum.points || 0,
    totalCashEarned: totalRewards._sum.amount || 0,
  };
}
