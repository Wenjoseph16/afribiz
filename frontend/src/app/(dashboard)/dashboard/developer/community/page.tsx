'use client';

import { MessageCircle, Users, Lightbulb, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { icon: MessageCircle, label: 'Forum de discussion', description: 'Échangez avec d\'autres développeurs', color: 'bg-brand-50 dark:bg-brand-900/30 text-brand' },
  { icon: Users, label: 'Groupe WhatsApp', description: 'Rejoignez la communauté en temps réel', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
  { icon: Lightbulb, label: 'Suggestions', description: 'Proposez des améliorations', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
  { icon: Globe, label: 'Événements', description: 'Rencontres et hackathons', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' },
];

export default function CommunityPage() {
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

      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="Forum communautaire à venir"
        description="Le forum des développeurs AfriBiz arrive bientôt. Vous pourrez échanger, poser des questions et partager vos expériences avec la communauté."
        action={
          <Link href="/dashboard/developer/documentation">
            <Button variant="gradient">
              Consulter la documentation
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CHANNELS.map((ch) => (
          <Card key={ch.label} padding="md" hoverable>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', ch.color)}>
              <ch.icon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ch.label}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ch.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
