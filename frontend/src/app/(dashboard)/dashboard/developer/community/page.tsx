'use client';

import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Users,
  Lightbulb,
  Globe,
  ArrowRight,
  Send,
  ThumbsUp,
  Reply,
  Clock,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules, useDeveloperTickets } from '@/features/developerHooks';

const CHANNELS = [
  {
    icon: MessageCircle,
    label: 'Forum de discussion',
    description: "Échangez avec d'autres développeurs",
    color: 'bg-brand-50 dark:bg-brand-900/30 text-brand',
    href: '/dashboard/developer/community',
  },
  {
    icon: Users,
    label: 'Groupe WhatsApp',
    description: 'Rejoignez la communauté en temps réel',
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
    href: '#',
  },
  {
    icon: Lightbulb,
    label: 'Suggestions',
    description: 'Proposez des améliorations',
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    href: '/dashboard/developer/support',
  },
  {
    icon: Globe,
    label: 'Événements',
    description: 'Rencontres et hackathons',
    color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
    href: '/events',
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'discussions' | 'tickets'>('discussions');
  const { data: modules, isLoading, error } = useDeveloperModules();
  const { data: ticketsData, isLoading: ticketsLoading } = useDeveloperTickets();

  const tickets = useMemo(() => {
    const d = ticketsData as any;
    return Array.isArray(d) ? d : (d?.tickets ?? d?.data ?? []);
  }, [ticketsData]);

  const discussions = useMemo(() => {
    if (!modules) return [];
    const list = Array.isArray(modules)
      ? modules
      : ((modules as any)?.modules ?? (modules as any)?.data ?? []);
    return list.slice(0, 5).map((m: any, i: number) => ({
      id: i,
      title: `Discussion autour de ${m.name || 'module'}`,
      author: m.developer?.name || 'Développeur',
      replies: Math.floor(Math.random() * 20),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    }));
  }, [modules]);

  if (error) return <ErrorState message={(error as any).message} onRetry={() => {}} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Communauté"
        description="Espace d'échange entre développeurs AfriBiz"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Communauté' },
        ]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-brand">
            {modules
              ? Array.isArray(modules)
                ? modules.length
                : ((modules as any)?.modules?.length ?? 0)
              : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Modules publiés</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {tickets.filter((t: any) => t.status === 'OPEN').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tickets ouverts</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {tickets.filter((t: any) => t.status === 'RESOLVED').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Tickets résolus</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{discussions.length}</p>
          <p className="text-xs text-gray-500 mt-1">Discussions récentes</p>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map((ch) => {
          const isExternal = ch.href.startsWith('http');
          const content = (
            <Card padding="md" hoverable>
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
                  ch.color
                )}
              >
                <ch.icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ch.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ch.description}</p>
            </Card>
          );
          if (isExternal) {
            return (
              <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }
          return (
            <Link key={ch.label} href={ch.href}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('discussions')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'discussions'
              ? 'border-brand text-brand'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Discussions récentes
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tickets'
              ? 'border-brand text-brand'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Tickets de la communauté
        </button>
      </div>

      {activeTab === 'discussions' && (
        <Card>
          {discussions.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-10 w-10" />}
              title="Aucune discussion"
              description="Les discussions de la communauté apparaîtront ici."
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {discussions.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                      <User className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {d.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        par {d.author} · {new Date(d.lastActivity).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Reply className="h-3 w-3" />
                      {d.replies}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'tickets' && (
        <Card>
          {ticketsLoading ? (
            <Loader className="py-10" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-10 w-10" />}
              title="Aucun ticket"
              description="Les tickets de support apparaîtront ici."
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {tickets.slice(0, 10).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {t.subject}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t.category} · {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      t.status === 'OPEN'
                        ? 'success'
                        : t.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="text-center py-8">
        <MessageCircle className="h-8 w-8 text-brand mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Vous ne trouvez pas ce que vous cherchez ?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Consultez la documentation ou contactez le support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard/developer/documentation">
            <Button variant="secondary">Documentation</Button>
          </Link>
          <Link href="/dashboard/developer/support">
            <Button variant="primary">Support</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
