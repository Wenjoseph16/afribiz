'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy, Award, Medal, Star, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

export default function GamificationPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const res = await apiClient.getGamification();
      return res.data.data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: async () => {
      const res = await apiClient.getLeaderboard();
      return res.data.data;
    },
  });

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const achievements = Array.isArray(data?.achievements) ? data.achievements : [];
  const leaderboardEntries = Array.isArray(leaderboard)
    ? leaderboard
    : (leaderboard?.entries ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gamification"
        description="Suivez vos scores, badges et classements"
        breadcrumbs={[{ label: 'Gamification' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Trophy className="h-5 w-5" />}
          label="Score total"
          value={data?.totalScore ?? 0}
        />
        <StatsCard
          icon={<Award className="h-5 w-5" />}
          label="Badges"
          value={achievements.length}
        />
        <StatsCard icon={<Star className="h-5 w-5" />} label="Niveau" value={data?.level ?? 1} />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Progression"
          value={`${data?.progress ?? 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Badges et succès" titleIcon={<Award className="h-4 w-4" />}>
          {achievements.length === 0 ? (
            <EmptyState
              icon={<Award className="h-10 w-10" />}
              title="Aucun badge"
              description="Débloquez des badges en complétant des actions"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((a: any) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg text-center ${a.unlocked ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800/50 opacity-50'}`}
                >
                  <div className="text-2xl mb-1">{a.icon || '🏆'}</div>
                  <p className="text-xs font-medium">{a.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{a.points} pts</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Classement" titleIcon={<Trophy className="h-4 w-4" />}>
          {leaderboardEntries.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Classement vide"
              description="Participez aux défis pour apparaître dans le classement"
            />
          ) : (
            <div className="space-y-2">
              {leaderboardEntries.map((entry: any, i: number) => (
                <div
                  key={entry.id || i}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? 'bg-yellow-400 text-yellow-900'
                          : i === 1
                            ? 'bg-gray-300 text-gray-700'
                            : i === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{entry.name || entry.userName}</span>
                  </div>
                  <span className="text-sm font-semibold">{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
