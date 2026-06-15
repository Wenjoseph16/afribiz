'use client';

import { useState } from 'react';
import {
  Clock, Bell, ShoppingBag, Calendar, Wallet, Package,
  Truck, FileText, MessageCircle, Star, RefreshCw,
  Activity, Users, CreditCard, Shield, Award, Megaphone,
  CheckCircle2, AlertTriangle, XCircle, Play, Pause,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';

// ── Automation Jobs Configuration ──
// Maps directly to CronService backend jobs
const AUTOMATION_JOBS = [
  {
    id: 'booking-reminders',
    name: 'Rappels de réservation',
    description: 'Envoie un rappel aux clients 24h avant leur réservation',
    icon: Calendar,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    schedule: 'Toutes les 15 min',
    cron: '*/15 * * * *',
    category: 'client',
    initialStatus: true,
    lastRun: 'Il y a 12 min',
    nextRun: 'Dans 3 min',
    todayCount: 47,
  },
  {
    id: 'overdue-debts',
    name: 'Dettes impayées',
    description: 'Détecte et notifie les dettes arrivées à échéance',
    icon: Wallet,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    schedule: 'Chaque jour à 06:00',
    cron: '0 6 * * *',
    category: 'finance',
    initialStatus: true,
    lastRun: 'Il y a 3h',
    nextRun: 'Demain 06:00',
    todayCount: 12,
  },
  {
    id: 'campaign-dispatch',
    name: 'Envoi campagnes',
    description: 'Déclenche les campagnes marketing programmées',
    icon: Megaphone,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    schedule: 'Chaque minute',
    cron: '* * * * *',
    category: 'marketing',
    initialStatus: true,
    lastRun: 'Il y a 30s',
    nextRun: 'Dans 30s',
    todayCount: 156,
  },
  {
    id: 'abandoned-carts',
    name: 'Paniers abandonnés',
    description: 'Relance les clients avec un panier non finalisé depuis +2h',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    schedule: 'Toutes les 30 min',
    cron: '*/30 * * * *',
    category: 'sales',
    initialStatus: true,
    lastRun: 'Il y a 18 min',
    nextRun: 'Dans 12 min',
    todayCount: 34,
  },
  {
    id: 'inactive-clients',
    name: 'Clients inactifs',
    description: 'Identifie les clients sans commande depuis 90 jours',
    icon: Users,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    schedule: 'Chaque jour à 07:00',
    cron: '0 7 * * *',
    category: 'client',
    initialStatus: true,
    lastRun: 'Il y a 2h',
    nextRun: 'Demain 07:00',
    todayCount: 8,
  },
  {
    id: 'expiring-subscriptions',
    name: 'Abonnements expirants',
    description: 'Notifie les clients dont l\'abonnement expire dans 7 jours',
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    schedule: 'Chaque jour à 08:00',
    cron: '0 8 * * *',
    category: 'finance',
    initialStatus: true,
    lastRun: 'Il y a 1h',
    nextRun: 'Demain 08:00',
    todayCount: 5,
  },
  {
    id: 'low-stock',
    name: 'Stock faible',
    description: 'Alerte quand un produit atteint ≤5 unités en stock',
    icon: Package,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    schedule: 'Chaque jour à 09:00',
    cron: '0 9 * * *',
    category: 'inventory',
    initialStatus: true,
    lastRun: 'Il y a 0h',
    nextRun: 'Demain 09:00',
    todayCount: 23,
  },
  {
    id: 'birthdays',
    name: 'Souhaits anniversaire',
    description: 'Envoie automatiquement des vœux aux clients le jour J',
    icon: Star,
    color: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    schedule: 'Chaque jour à 08:00',
    cron: '0 8 * * *',
    category: 'client',
    initialStatus: true,
    lastRun: 'Il y a 1h',
    nextRun: 'Demain 08:00',
    todayCount: 3,
  },
  {
    id: 'rental-returns',
    name: 'Retour locations',
    description: 'Rappelle les clients 24h avant la fin de leur location',
    icon: Truck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    schedule: 'Chaque jour à 07:00',
    cron: '0 7 * * *',
    category: 'operations',
    initialStatus: true,
    lastRun: 'Il y a 2h',
    nextRun: 'Demain 07:00',
    todayCount: 6,
  },
  {
    id: 'satisfaction-surveys',
    name: 'Enquêtes satisfaction',
    description: 'Envoie un questionnaire après commande ou séjour terminé',
    icon: MessageCircle,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    schedule: 'Chaque jour à 07:00',
    cron: '0 7 * * *',
    category: 'client',
    initialStatus: true,
    lastRun: 'Il y a 2h',
    nextRun: 'Demain 07:00',
    todayCount: 18,
  },
  {
    id: 'loyalty-points',
    name: 'Points fidélité',
    description: 'Crédite automatiquement les points sur chaque commande/paiement',
    icon: Award,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    schedule: 'Temps réel (events)',
    cron: 'event-driven',
    category: 'marketing',
    initialStatus: true,
    lastRun: 'Il y a 2 min',
    nextRun: 'Continue',
    todayCount: 89,
  },
  {
    id: 'score-recalculation',
    name: 'Recalcul AfriScore',
    description: 'Met à jour les scores de réputation hebdomadaires',
    icon: TrendingUp,
    color: 'text-brand',
    bg: 'bg-brand-50 dark:bg-brand-900/20',
    schedule: 'Chaque jour à 00:00',
    cron: '0 0 * * *',
    category: 'system',
    initialStatus: true,
    lastRun: 'Il y a 9h',
    nextRun: 'Ce soir minuit',
    todayCount: 1,
  },
  {
    id: 'expiring-documents',
    name: 'Documents expirants',
    description: 'Notifie les employés dont les documents expirent dans 30 jours',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    schedule: 'Chaque jour à 06:00',
    cron: '0 6 * * *',
    category: 'hr',
    initialStatus: true,
    lastRun: 'Il y a 3h',
    nextRun: 'Demain 06:00',
    todayCount: 4,
  },
  {
    id: 'escrow-release',
    name: 'Libération séquestre',
    description: 'Libère automatiquement les fonds séquestre 48h après livraison',
    icon: Shield,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    schedule: 'Chaque jour à 10:00',
    cron: '0 10 * * *',
    category: 'finance',
    initialStatus: true,
    lastRun: 'Il y a 0h',
    nextRun: 'Demain 10:00',
    todayCount: 2,
  },
  {
    id: 'cleanup',
    name: 'Nettoyage système',
    description: 'Supprime les événements traités, sessions et tokens expirés',
    icon: RefreshCw,
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    schedule: 'Chaque dimanche à 03:00',
    cron: '0 3 * * 0',
    category: 'system',
    initialStatus: true,
    lastRun: 'Il y a 2j',
    nextRun: 'Dans 5 jours',
    todayCount: 0,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Toutes' },
  { key: 'client', label: 'Clients' },
  { key: 'sales', label: 'Ventes' },
  { key: 'finance', label: 'Finance' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'inventory', label: 'Stock' },
  { key: 'operations', label: 'Opérations' },
  { key: 'hr', label: 'RH' },
  { key: 'system', label: 'Système' },
];

const ACTIVITY_LOG = [
  { id: '1', action: 'Rappel réservation envoyé', target: 'Restaurant Chez Maman #1024', time: 'Il y a 2 min', status: 'success' },
  { id: '2', action: 'Campagne marketing déclenchée', target: 'Soldes été 2025', time: 'Il y a 5 min', status: 'success' },
  { id: '3', action: 'Stock faible détecté', target: 'Huile d\'olive (2 unités)', time: 'Il y a 12 min', status: 'warning' },
  { id: '4', action: 'Client inactif identifié', target: 'Kofi A. - 95 jours', time: 'Il y a 1h', status: 'info' },
  { id: '5', action: 'Points fidélité crédités', target: 'Ama B. - 150 pts (commande #892)', time: 'Il y a 2h', status: 'success' },
  { id: '6', action: 'Dette impayée détectée', target: 'Yao K. - 25 000 FCFA', time: 'Il y a 3h', status: 'error' },
  { id: '7', action: 'Document expirant', target: 'Permis conduire - Kouamé J.', time: 'Il y a 4h', status: 'warning' },
  { id: '8', action: 'AfriScore recalculé', target: '15 business mis à jour', time: 'Il y a 9h', status: 'success' },
  { id: '9', action: 'Nettoyage hebdomadaire', target: '238 événements nettoyés', time: 'Il y a 2j', status: 'success' },
];

export default function AutomationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [enabledJobs, setEnabledJobs] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    AUTOMATION_JOBS.forEach(j => { map[j.id] = j.initialStatus; });
    return map;
  });
  const [showActivity, setShowActivity] = useState(false);

  const toggleJob = (jobId: string) => {
    setEnabledJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const filteredJobs = AUTOMATION_JOBS.filter(j => activeCategory === 'all' || j.category === activeCategory);
  const activeCount = Object.values(enabledJobs).filter(Boolean).length;
  const totalEvents = AUTOMATION_JOBS.reduce((s, j) => s + (enabledJobs[j.id] ? j.todayCount : 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Automatisations"
        description="Gérez les tâches automatisées de votre business"
        gradient
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActivity(!showActivity)}
            >
              <Activity className="h-4 w-4" />
              {showActivity ? 'Voir les jobs' : 'Activité récente'}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          iconBg="bg-brand-50 dark:bg-brand-900/20"
          iconColor="text-brand"
          label="Automatisations actives"
          value={`${activeCount}/${AUTOMATION_JOBS.length}`}
        />
        <StatsCard
          icon={<Bell className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Événements aujourd'hui"
          value={totalEvents}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Taux de succès"
          value="98.3%"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="Prochaine exécution"
          value="Dans 30s"
        />
      </div>

      {/* Content */}
      {showActivity ? (
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Activité récente des automatisations
          </h3>
          <div className="space-y-1">
            {ACTIVITY_LOG.map((entry) => {
              const statusIcon = entry.status === 'success' ? CheckCircle2
                : entry.status === 'warning' ? AlertTriangle
                : entry.status === 'error' ? XCircle
                : Activity;
              const statusColor = entry.status === 'success' ? 'text-emerald-600 bg-emerald-50'
                : entry.status === 'warning' ? 'text-amber-600 bg-amber-50'
                : entry.status === 'error' ? 'text-red-600 bg-red-50'
                : 'text-blue-600 bg-blue-50';
              const StatusIcon = statusIcon;
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={cn('p-1.5 rounded-lg shrink-0', statusColor)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.action}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">{entry.time}</span>
                    </div>
                    <p className="text-xs text-gray-500">{entry.target}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeCategory === cat.key
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Jobs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => {
              const Icon = job.icon;
              const enabled = enabledJobs[job.id];
              return (
                <Card key={job.id} className={cn(
                  'p-4 transition-all',
                  enabled ? 'opacity-100' : 'opacity-60'
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', job.bg)}>
                        <Icon className={cn('h-5 w-5', job.color)} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{job.name}</h3>
                        <p className="text-[10px] text-gray-400">{job.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleJob(job.id)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        enabled
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      )}
                      title={enabled ? 'Désactiver' : 'Activer'}
                    >
                      {enabled ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{job.description}</p>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400">Planification</span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">{job.schedule}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400">Dernière exécution</span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">{job.lastRun}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400">Prochaine exécution</span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">{job.nextRun}</span>
                    </div>
                    {enabled && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Aujourd'hui</span>
                        <span className="font-medium text-emerald-600">{job.todayCount} événements</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Badge
                      variant={enabled ? 'success' : 'default'}
                      size="xs"
                    >
                      {enabled ? 'Actif' : 'Inactif'}
                    </Badge>
                    <span className="text-[9px] font-mono text-gray-400">{job.cron}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredJobs.length === 0 && (
            <EmptyState
              icon={<Activity className="h-12 w-12" />}
              title="Aucune automatisation"
              description="Aucun job trouvé dans cette catégorie."
            />
          )}
        </>
      )}

      {/* Status summary */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm shrink-0">
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              État du système d'automatisation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Jobs actifs</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">{activeCount}/{AUTOMATION_JOBS.length}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Temps réel</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Loyalty + Campagnes</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Planifiés (cron)</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">{AUTOMATION_JOBS.length - 2} jobs</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Moteur</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200">node-cron + EventBus</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


