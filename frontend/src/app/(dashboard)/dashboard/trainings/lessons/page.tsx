'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { BookOpen, Plus, Search, Play, Clock, ArrowRight } from 'lucide-react';

export default function LessonsPage() {
  const [search, setSearch] = useState('');

  const {
    data: lessons,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trainings-lessons'],
    queryFn: async () => {
      const res = await apiClient.get('/trainings/advanced/lessons');
      return res.data?.data || [];
    },
  });

  const list = Array.isArray(lessons) ? lessons : [];
  const filtered = list.filter(
    (l: any) =>
      !search ||
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.training?.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leçons"
        description="Consultez et gérez toutes les leçons de vos formations"
        actions={
          <Link href="/dashboard/trainings/manage">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Gérer les formations
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une leçon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucune leçon
          </h3>
          <p className="text-sm text-gray-500 mb-4">Créez d'abord une formation avec des leçons</p>
          <Link href="/dashboard/trainings/manage/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle formation
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson: any) => (
            <Link key={lesson.id} href={`/dashboard/trainings/lessons/${lesson.id}`}>
              <Card className="p-5 hover:border-brand/20 dark:hover:border-brand/30 hover:shadow-card-hover transition-all duration-300 card-hover group h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 shrink-0">
                    <Play className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {lesson.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {lesson.training && (
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {lesson.training.title}
                        </span>
                      )}
                      {lesson.duration ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration} min
                        </span>
                      ) : null}
                    </div>
                    {lesson.isFree && (
                      <span className="inline-block mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        Gratuit
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
