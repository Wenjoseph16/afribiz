'use client';

import Link from 'next/link';
import { useGamificationDashboard, useInitializeQuests } from '@/features/gamificationHooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { useBusinessStore } from '@/stores/businessStore';
import {
  Trophy,
  Flame,
  Target,
  Star,
  Award,
  TrendingUp,
  Zap,
  CalendarCheck,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Crown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const QUEST_ICONS: Record<string, any> = {
  ShoppingBag,
  CalendarCheck,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Star,
  Radio: Zap,
};

const STREAK_ICONS: Record<string, any> = {
  DAILY_LOGIN: Zap,
  DAILY_ORDER: ShoppingBag,
  DAILY_BOOKING: CalendarCheck,
  DAILY_REVIEW: Star,
  DAILY_FOLLOW: Award,
  DAILY_STORY: Sparkles,
  DAILY_SHORT: Zap,
  DAILY_LIVE: Zap,
};

const STREAK_LABELS: Record<string, string> = {
  DAILY_LOGIN: 'Connexion',
  DAILY_ORDER: 'Commande',
  DAILY_BOOKING: 'Reservation',
  DAILY_REVIEW: 'Avis',
  DAILY_FOLLOW: 'Abonnement',
  DAILY_STORY: 'Story',
  DAILY_SHORT: 'Short',
  DAILY_LIVE: 'Live',
};

export default function GamificationPage() {
  const { business } = useBusinessStore();
  const { data: dashboard, isLoading } = useGamificationDashboard();
  const initQuestMutation = useInitializeQuests();
  const { notify } = useToast();

  if (isLoading) return <Loader className="min-h-[60vh]" />;

  if (!business) {
    return (
      <EmptyState
        icon={<Trophy className="h-8 w-8" />}
        title="Aucun business"
        description="Activez votre business pour acceder aux quetes et defis."
      />
    );
  }

  const stats = dashboard?.stats || {
    totalQuestsCompleted: 0,
    totalXp: 0,
    badgesEarned: 0,
    activeQuests: 0,
  };
  const quests = dashboard?.quests || [];
  const completedQuests = dashboard?.completedQuests || [];
  const streaks = dashboard?.streaks || [];
  const ranking = dashboard?.ranking || null;
  const challenges = dashboard?.challenges || [];

  const handleInitQuests = async () => {
    try {
      await initQuestMutation.mutateAsync();
    } catch (e: any) {
      notify({
        title: 'Erreur',
        description: e?.response?.data?.error || "Impossible d'initialiser les quêtes.",
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gamification et Défis"
        description="Quêtes, séries, classements et défis pour booster votre business"
        breadcrumbs={[
          { label: 'AfriScore', href: '/dashboard/afriscore' },
          { label: 'Gamification' },
        ]}
        actions={
          <Link href="/dashboard/afriscore">
            <Button variant="secondary" size="sm">
              <Award className="h-4 w-4" />
              AfriScore
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quetes completees</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalQuestsCompleted}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">XP gagne</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalXp}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Badges obtenus</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.badgesEarned}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Crown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Classement</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {ranking ? `#${ranking.rank}/${ranking.total}` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {quests.length === 0 && completedQuests.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Commencez les quetes
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Initialisez vos quetes quotidiennes et hebdomadaires pour gagner de l&apos;XP et des
            badges.
          </p>
          <Button
            variant="gradient"
            onClick={handleInitQuests}
            isLoading={initQuestMutation.isPending}
          >
            <Zap className="h-4 w-4" /> Initialiser les quetes
          </Button>
        </Card>
      )}

      {quests.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4" />
              Quetes actives
              <Badge variant="brand" size="xs">
                {stats.activeQuests}
              </Badge>
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInitQuests}
              isLoading={initQuestMutation.isPending}
            >
              <RefreshCw className="h-3 w-3" /> Rafraichir
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quests.map((quest: any) => {
              const userQuest = quest.userQuests?.[0];
              const progress = userQuest?.progress || 0;
              const completed = userQuest?.completed || false;
              const pct = Math.round((progress / quest.goal) * 100);
              const Icon = QUEST_ICONS[quest.icon as string] || Target;
              return (
                <div
                  key={quest.id}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    completed
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        completed
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                          : 'bg-white dark:bg-gray-700 text-gray-400'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {quest.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {quest.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              completed ? 'bg-emerald-500' : 'bg-brand'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                          {progress}/{quest.goal}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-purple-500" />
                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                          +{quest.rewardXp} XP
                        </span>
                        {completed && (
                          <Badge variant="success" size="xs">
                            Completee
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {streaks.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Series en cours
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {streaks.map((s: any) => {
              const Icon = STREAK_ICONS[s.type] || Flame;
              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-700/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {STREAK_LABELS[s.type] || s.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                      {s.currentStreak}
                    </span>
                    <span className="text-xs text-gray-400">jours</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Record: {s.maxStreak} jours</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {ranking && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Votre classement
            </h3>
          </div>
          <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/50">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-2xl font-black text-amber-600">#{ranking.rank}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Rang {ranking.rank} sur {ranking.total} businesses
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Score AfriScore: {ranking.score}/1000
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 max-w-[200px] rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${(ranking.rank / ranking.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  Top {Math.round((ranking.rank / ranking.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {challenges.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Defis en cours
            </h3>
          </div>
          <div className="space-y-3">
            {challenges.map((c: any) => {
              const pct = c.goal > 0 ? Math.round((c.progress / c.goal) * 100) : 0;
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 shrink-0">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {c.description}
                        </p>
                        {c.rewardLabel && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                            <Award className="h-3 w-3" />
                            {c.rewardLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{pct}%</p>
                      <p className="text-[10px] text-gray-400">
                        {c.progress}/{c.goal}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {completedQuests.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quetes completes ({completedQuests.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {completedQuests.slice(0, 6).map((q: any) => (
              <div
                key={q.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <Star className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {q.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {q.completedAt
                      ? new Date(q.completedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : ''}{' '}
                    - +{q.rewardXp} XP
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
