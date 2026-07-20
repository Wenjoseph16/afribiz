import { prisma } from '../lib/db';

const DAILY_QUESTS = [
  {
    type: 'DAILY' as const,
    title: 'Vente du jour',
    description: "Realisez 1 vente aujourd'hui",
    icon: 'ShoppingBag',
    goal: 1,
    rewardXp: 15,
    conditions: { action: 'order', count: 1 },
  },
  {
    type: 'DAILY' as const,
    title: 'Reservation confirmee',
    description: 'Confirmez 1 reservation',
    icon: 'CalendarCheck',
    goal: 1,
    rewardXp: 15,
    conditions: { action: 'booking', count: 1 },
  },
  {
    type: 'DAILY' as const,
    title: 'Repondre aux clients',
    description: 'Repondez a 3 messages',
    icon: 'MessageCircle',
    goal: 3,
    rewardXp: 10,
    conditions: { action: 'message', count: 3 },
  },
  {
    type: 'DAILY' as const,
    title: 'Story du jour',
    description: 'Publiez une story',
    icon: 'Sparkles',
    goal: 1,
    rewardXp: 20,
    conditions: { action: 'story', count: 1 },
  },
];

const WEEKLY_QUESTS = [
  {
    type: 'WEEKLY' as const,
    title: '5 ventes semaine',
    description: 'Realisez 5 ventes',
    icon: 'TrendingUp',
    goal: 5,
    rewardXp: 50,
    conditions: { action: 'order', count: 5 },
  },
  {
    type: 'WEEKLY' as const,
    title: '10 avis clients',
    description: 'Obtenez 10 avis',
    icon: 'Star',
    goal: 10,
    rewardXp: 40,
    conditions: { action: 'review', count: 10 },
  },
  {
    type: 'WEEKLY' as const,
    title: 'Story + Live',
    description: 'Publiez 3 stories + 1 live',
    icon: 'Radio',
    goal: 1,
    rewardXp: 60,
    conditions: { action: 'media', count: 4 },
  },
];

export async function initializeDailyQuests(businessId: string): Promise<void> {
  const existing = await prisma.quest.findFirst({
    where: { businessId, type: 'DAILY', status: 'ACTIVE' },
  });
  if (existing) return;
  for (const q of DAILY_QUESTS) {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const quest = await prisma.quest.create({
      data: {
        businessId,
        type: q.type,
        title: q.title,
        description: q.description,
        icon: q.icon,
        goal: q.goal,
        rewardXp: q.rewardXp,
        conditions: q.conditions as any,
        status: 'ACTIVE',
        startsAt: now,
        expiresAt: endOfDay,
      },
    });
    await prisma.userQuest.create({
      data: { questId: quest.id, userId: businessId, progress: 0, completed: false },
    });
  }
}

export async function initializeWeeklyQuests(businessId: string): Promise<void> {
  const existing = await prisma.quest.findFirst({
    where: { businessId, type: 'WEEKLY', status: 'ACTIVE' },
  });
  if (existing) return;
  for (const q of WEEKLY_QUESTS) {
    const now = new Date();
    const endOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + (7 - now.getDay()),
      23,
      59,
      59
    );
    const quest = await prisma.quest.create({
      data: {
        businessId,
        type: q.type,
        title: q.title,
        description: q.description,
        icon: q.icon,
        goal: q.goal,
        rewardXp: q.rewardXp,
        conditions: q.conditions as any,
        status: 'ACTIVE',
        startsAt: now,
        expiresAt: endOfWeek,
      },
    });
    await prisma.userQuest.create({
      data: { questId: quest.id, userId: businessId, progress: 0, completed: false },
    });
  }
}

export async function updateQuestProgress(
  businessId: string,
  action: string,
  count: number = 1
): Promise<void> {
  const userQuests = await prisma.userQuest.findMany({
    where: { quest: { businessId, status: 'ACTIVE' }, completed: false },
    include: { quest: true },
  });
  for (const uq of userQuests) {
    const conditions = uq.quest.conditions as any;
    if (conditions?.action !== action) continue;
    const newProgress = Math.min(uq.progress + count, uq.quest.goal);
    const completed = newProgress >= uq.quest.goal;
    await prisma.userQuest.update({
      where: { id: uq.id },
      data: { progress: newProgress, completed, completedAt: completed ? new Date() : null },
    });
    if (completed) {
      await prisma.quest.update({
        where: { id: uq.quest.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  }
}

export async function updateStreak(
  businessId: string,
  type: string
): Promise<{ currentStreak: number; maxStreak: number; isNew: boolean }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const streak = await prisma.streak.upsert({
    where: { businessId_type: { businessId, type: type as any } },
    update: {},
    create: { businessId, type: type as any, currentStreak: 0, maxStreak: 0 },
  });
  const lastActivity = streak.lastActivityAt
    ? new Date(
        streak.lastActivityAt.getFullYear(),
        streak.lastActivityAt.getMonth(),
        streak.lastActivityAt.getDate()
      )
    : null;
  const isConsecutive = lastActivity ? today.getTime() - lastActivity.getTime() === 86400000 : true;
  const isSameDay = lastActivity ? today.getTime() === lastActivity.getTime() : false;
  if (isSameDay)
    return { currentStreak: streak.currentStreak, maxStreak: streak.maxStreak, isNew: false };
  const newCurrentStreak = isConsecutive || !lastActivity ? streak.currentStreak + 1 : 1;
  const newMaxStreak = Math.max(newCurrentStreak, streak.maxStreak);
  await prisma.streak.update({
    where: { id: streak.id },
    data: { currentStreak: newCurrentStreak, maxStreak: newMaxStreak, lastActivityAt: now },
  });
  return { currentStreak: newCurrentStreak, maxStreak: newMaxStreak, isNew: true };
}

export async function getStreaks(businessId: string): Promise<any[]> {
  return prisma.streak.findMany({ where: { businessId }, orderBy: { type: 'asc' } });
}

export async function computeLeaderboard(
  category: string = 'OVERALL',
  period: string = 'WEEKLY'
): Promise<any[]> {
  const orderBy =
    category === 'OVERALL'
      ? { overallScore: 'desc' as const }
      : category === 'COMMERCIAL'
        ? { commercialScore: 'desc' as const }
        : { reliabilityScore: 'desc' as const };
  const scores = await prisma.businessScore.findMany({
    where: { business: { isActive: true }, overallScore: { gt: 0 } },
    orderBy: orderBy as any,
    take: 100,
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, type: true, city: true },
      },
    },
  });
  const now = new Date();
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const rankScore = category === 'OVERALL' ? s.overallScore : s.commercialScore;
    await prisma.leaderboard.create({
      data: {
        businessId: s.businessId,
        category,
        rank: i + 1,
        score: rankScore,
        period,
        snapshotAt: now,
      },
    });
  }
  return scores.map((s, i) => ({
    rank: i + 1,
    businessId: s.businessId,
    business: s.business,
    score: category === 'OVERALL' ? s.overallScore : s.commercialScore,
  }));
}

export async function getMyRanking(
  businessId: string
): Promise<{ rank: number; total: number; score: number } | null> {
  const score = await prisma.businessScore.findUnique({ where: { businessId } });
  if (!score) return null;
  const total = await prisma.businessScore.count({
    where: { overallScore: { gt: 0 }, business: { isActive: true } },
  });
  const betterCount = await prisma.businessScore.count({
    where: { overallScore: { gt: score.overallScore }, business: { isActive: true } },
  });
  return { rank: betterCount + 1, total, score: score.overallScore };
}

export async function getActiveQuests(businessId: string): Promise<any[]> {
  return prisma.quest.findMany({
    where: { businessId, status: 'ACTIVE' },
    include: {
      userQuests: { where: { userId: businessId }, select: { progress: true, completed: true } },
    },
    orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getCompletedQuests(businessId: string): Promise<any[]> {
  return prisma.quest.findMany({
    where: { businessId, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 20,
  });
}

export async function getActiveChallenges(businessId: string): Promise<any[]> {
  return prisma.challenge.findMany({
    where: { businessId, completed: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGamificationDashboard(businessId: string): Promise<any> {
  const [quests, completedQuests, streaks, ranking, challenges] = await Promise.all([
    getActiveQuests(businessId),
    getCompletedQuests(businessId),
    getStreaks(businessId),
    getMyRanking(businessId),
    getActiveChallenges(businessId),
  ]);
  const totalXp = completedQuests.reduce((sum, q) => sum + q.rewardXp, 0);
  const badgesEarned = await prisma.businessBadge.count({ where: { businessId, isActive: true } });
  return {
    quests,
    completedQuests,
    streaks,
    ranking,
    challenges,
    stats: {
      totalQuestsCompleted: completedQuests.length,
      totalXp,
      badgesEarned,
      activeQuests: quests.length,
    },
  };
}
