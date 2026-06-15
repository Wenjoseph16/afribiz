'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Plus, Search, Pencil, Trash2, Loader,
  Users, BarChart3, GraduationCap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useBizTrainings, useBizTrainingStats, useDeleteBizTraining } from '@/features/hooks';

export default function ManageTrainingsPage() {
  const { data, isLoading, error, refetch } = useBizTrainings();
  const { data: statsData } = useBizTrainingStats();
  const deleteTraining = useDeleteBizTraining();
  const [search, setSearch] = useState('');

  const list = data?.items || data || [];
  const stats = statsData || { total: 0, totalStudents: 0, completedStudents: 0 };

  const filtered = Array.isArray(list)
    ? list.filter((t: any) => !search || t.title?.toLowerCase().includes(search.toLowerCase()))
    : [];

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gérer les formations"
        description="Créez et gérez vos formations, leçons et quiz"
        actions={
          <Link href="/dashboard/trainings/manage/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle formation</Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total formations', value: stats.total || list.length, icon: BookOpen, color: 'text-brand', bg: 'bg-brand-50' },
          { label: 'Élèves inscrits', value: stats.totalStudents || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Diplômés', value: stats.completedStudents || 0, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Taux complétion', value: stats.totalStudents > 0 ? Math.round((stats.completedStudents / stats.totalStudents) * 100) + '%' : '—', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', s.bg)}><Icon className={cn('h-5 w-5', s.color)} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune formation</h3>
          <p className="text-sm text-gray-500 mb-4">Créez votre première formation</p>
          <Link href="/dashboard/trainings/manage/new"><Button><Plus className="h-4 w-4 mr-1.5" />Créer</Button></Link>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Formation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Catégorie</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Leçons</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Élèves</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/trainings/manage/${t.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t.title}</p>
                        {t.description && <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {t.category || 'Général'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{t._count?.TrainingLesson || t.lessons || 0}</td>
                  <td className="px-4 py-3 text-center">{t._count?.users || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/trainings/manage/${t.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
                        <BookOpen className="h-4 w-4" />
                      </Link>
                      <Link href={`/dashboard/trainings/manage/${t.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => { if (confirm('Supprimer cette formation ?')) deleteTraining.mutate(t.id); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
