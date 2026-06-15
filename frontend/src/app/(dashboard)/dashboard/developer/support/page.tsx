'use client';

import { useState, useMemo } from 'react';
import {
  MessageCircle, Plus, ChevronDown, ChevronUp, Clock,
  AlertCircle, CheckCircle2, XCircle, Bug, Lightbulb,
  HelpCircle, ArrowUpRight, Send, Filter, Reply,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  useDeveloperTickets, useCreateDeveloperTicket, useReplyToTicket,
  useUpdateTicketStatus, useDeveloperModules,
} from '@/features/developerHooks';
import type { DeveloperSupportTicket, TicketPriority, TicketStatus, TicketCategory } from '@/types/developer';

const PRIORITY_STYLES: Record<TicketPriority, { label: string; className: string }> = {
  LOW: { label: 'Basse', className: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  NORMAL: { label: 'Normale', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  HIGH: { label: 'Haute', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CRITICAL: { label: 'Critique', className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const STATUS_STYLES: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: { label: 'Ouvert', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  WAITING: { label: 'En attente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  RESOLVED: { label: 'Résolu', className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  CLOSED: { label: 'Fermé', className: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  BUG: <Bug className="h-4 w-4" />,
  FEATURE: <Lightbulb className="h-4 w-4" />,
  QUESTION: <HelpCircle className="h-4 w-4" />,
  OTHER: <MessageCircle className="h-4 w-4" />,
};

const TABS: { id: TicketStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'OPEN', label: 'Ouverts' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'RESOLVED', label: 'Résolus' },
  { id: 'CLOSED', label: 'Fermés' },
];

const PRIORITIES: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE', label: 'Fonctionnalité' },
  { value: 'QUESTION', label: 'Question' },
  { value: 'OTHER', label: 'Autre' },
];

export default function DeveloperSupportPage() {
  const { data: tickets, isLoading, error, refetch } = useDeveloperTickets();
  const { data: modules } = useDeveloperModules('PUBLISHED');
  const createTicket = useCreateDeveloperTicket();
  const replyToTicket = useReplyToTicket();
  const updateStatus = useUpdateTicketStatus();

  const [activeTab, setActiveTab] = useState<TicketStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'NORMAL' as TicketPriority,
    category: 'OTHER' as TicketCategory,
    moduleId: '',
  });

  const ticketList = useMemo(() => {
    if (!tickets) return [];
    const list = Array.isArray(tickets) ? tickets : (tickets.tickets || tickets.data || []);
    if (activeTab === 'ALL') return list;
    return list.filter((t: DeveloperSupportTicket) => t.status === activeTab);
  }, [tickets, activeTab]);

  const moduleOptions = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const tabCounts = useMemo(() => {
    if (!tickets) return {};
    const list = Array.isArray(tickets) ? tickets : (tickets.tickets || tickets.data || []);
    const counts: Record<string, number> = { ALL: list.length };
    list.forEach((t: DeveloperSupportTicket) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tickets]);

  const handleCreateTicket = async () => {
    try {
      if (!newTicket.subject.trim() || !newTicket.description.trim()) return;
      const payload: any = {
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
      };
      if (newTicket.moduleId) payload.moduleId = newTicket.moduleId;
      await createTicket.mutateAsync(payload);
      setNewTicket({ subject: '', description: '', priority: 'NORMAL', category: 'OTHER', moduleId: '' });
      setShowNewTicket(false);
    } catch (e) { console.error(e); }
  };

  const handleReply = async (ticketId: string) => {
    try {
      const content = replyContent[ticketId];
      if (!content?.trim()) return;
      await replyToTicket.mutateAsync({ ticketId, content });
      setReplyContent((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      await updateStatus.mutateAsync({ ticketId, status });
    } catch (e) { console.error(e); }
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des tickets..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Support"
        description="Gérez vos tickets de support"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Support' },
        ]}
        actions={
          <Button variant="gradient" onClick={() => setShowNewTicket(!showNewTicket)}>
            {showNewTicket ? 'Annuler' : <><Plus className="h-4 w-4" />Nouveau ticket</>}
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {tab.label}
            {(tabCounts[tab.id] ?? 0) > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-brand/10 text-brand' : 'bg-gray-200 dark:bg-gray-700 text-gray-500',
              )}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* New ticket form */}
      {showNewTicket && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Créer un nouveau ticket</h3>
          <div className="space-y-4">
            <Input
              label="Sujet *"
              value={newTicket.subject}
              onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Résumé du problème..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
                placeholder="Décrivez votre problème en détail..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priorité</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20"
                >
                  {PRIORITIES.map((pr) => (
                    <option key={pr} value={pr}>{PRIORITY_STYLES[pr].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catégorie</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket((p) => ({ ...p, category: e.target.value as TicketCategory }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module concerné</label>
                <select
                  value={newTicket.moduleId}
                  onChange={(e) => setNewTicket((p) => ({ ...p, moduleId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20"
                >
                  <option value="">— Aucun —</option>
                  {moduleOptions.map((mod: any) => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              variant="gradient"
              onClick={handleCreateTicket}
              isLoading={createTicket.isPending}
              disabled={!newTicket.subject.trim() || !newTicket.description.trim()}
            >
              <Send className="h-4 w-4" />
              Envoyer le ticket
            </Button>
          </div>
        </Card>
      )}

      {/* Tickets list */}
      <Card>
        {ticketList.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-10 w-10" />}
            title="Aucun ticket"
            description="Vous n'avez pas encore de tickets de support."
            action={
              <Button variant="secondary" onClick={() => setShowNewTicket(true)}>
                <Plus className="h-4 w-4" />
                Créer un ticket
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {(ticketList as DeveloperSupportTicket[]).map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="shrink-0 text-gray-400">
                      {CATEGORY_ICONS[ticket.category || 'OTHER'] || <MessageCircle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ticket.module?.name && `${ticket.module.name} · `}
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                        {ticket.messages && ticket.messages.length > 0 && ` · ${ticket.messages.length} message${ticket.messages.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', PRIORITY_STYLES[ticket.priority]?.className)}>
                      {PRIORITY_STYLES[ticket.priority]?.label}
                    </span>
                    <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', STATUS_STYLES[ticket.status]?.className)}>
                      {STATUS_STYLES[ticket.status]?.label}
                    </span>
                    {expandedId === ticket.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {expandedId === ticket.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {ticket.messages && ticket.messages.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages</p>
                        {ticket.messages.map((msg) => (
                          <div key={msg.id} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {msg.sender?.firstName} {msg.sender?.lastName}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyContent[ticket.id] || ''}
                        onChange={(e) => setReplyContent((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 resize-none"
                        placeholder="Écrivez votre réponse..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleReply(ticket.id)}
                          isLoading={replyToTicket.isPending}
                          disabled={!replyContent[ticket.id]?.trim()}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Répondre
                        </Button>
                        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleStatusChange(ticket.id, 'RESOLVED')}
                            isLoading={updateStatus.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Marquer résolu
                          </Button>
                        )}
                        {ticket.status === 'RESOLVED' && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleStatusChange(ticket.id, 'OPEN')}
                            isLoading={updateStatus.isPending}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            Réouvrir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
