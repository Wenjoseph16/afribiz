'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Loader, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, FileText, Image, Paperclip, User, CalendarDays, ListChecks,
  Timer, History, Send, Plus, X, Play, Square, Check, XCircle, ClipboardList, Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  useAdvancedTask, useUpdateAdvancedTask, useDeleteAdvancedTask,
  useAddTaskComment, useDeleteTaskComment, useStartTaskTimer, useStopTaskTimer,
  useAddTaskChecklistItem, useToggleTaskChecklistItem, useDeleteTaskChecklistItem,
  useAddTaskResource, useDeleteTaskResource, useRequestTaskValidation,
  useApproveTaskValidation, useTaskHistory,
} from '@/features/hooks';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'À faire', IN_PROGRESS: 'En cours', ON_HOLD: 'En attente', DONE: 'Terminé', BLOCKED: 'Bloqué',
};

const STATUS_COLORS: Record<string, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
  TODO: 'warning', IN_PROGRESS: 'info', ON_HOLD: 'default', DONE: 'success', BLOCKED: 'danger',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgent', HIGH: 'Haute', MEDIUM: 'Moyenne', LOW: 'Basse',
};

const PRIORITY_VARIANTS: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'default',
};

const VALIDATION_STATUS: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  REJECTED: { label: 'Rejetée', variant: 'danger' },
};

const RESOURCE_ICONS: Record<string, any> = {
  document: FileText, photo: Image, equipment: ClipboardList, vehicle: Truck,
};

const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'BLOCKED'];

import { Truck } from 'lucide-react';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const { data: task, isLoading, error, refetch } = useAdvancedTask(id);
  const updateTask = useUpdateAdvancedTask();
  const deleteTask = useDeleteAdvancedTask();
  const addComment = useAddTaskComment();
  const deleteComment = useDeleteTaskComment();
  const startTimer = useStartTaskTimer();
  const stopTimer = useStopTaskTimer();
  const addChecklistItem = useAddTaskChecklistItem();
  const toggleChecklistItem = useToggleTaskChecklistItem();
  const deleteChecklistItem = useDeleteTaskChecklistItem();
  const addResource = useAddTaskResource();
  const deleteResource = useDeleteTaskResource();
  const requestValidation = useRequestTaskValidation();
  const approveValidation = useApproveTaskValidation();
  const { data: historyData } = useTaskHistory(id);

  const [deleting, setDeleting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistAssignee, setNewChecklistAssignee] = useState('');
  const [newResourceType, setNewResourceType] = useState<'document' | 'photo' | 'equipment' | 'vehicle'>('document');
  const [newResourceLabel, setNewResourceLabel] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [validationNote, setValidationNote] = useState('');
  const [validationTarget, setValidationTarget] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const t: any = task;

  useEffect(() => {
    if (t?.timers) {
      const active = t.timers.find((tm: any) => !tm.endTime);
      if (active) {
        const elapsed = Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000);
        setActiveTimer(elapsed);
        const interval = setInterval(() => setActiveTimer((prev) => prev + 1), 1000);
        setTimerInterval(interval);
        return () => clearInterval(interval);
      } else {
        setActiveTimer(0);
        if (timerInterval) clearInterval(timerInterval);
      }
    }
    return () => {};
  }, [t?.timers]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTrackedTime = () => {
    if (!t?.timers) return 0;
    return t.timers.reduce((acc: number, tm: any) => {
      if (tm.endTime) return acc + Math.floor((new Date(tm.endTime).getTime() - new Date(tm.startTime).getTime()) / 1000);
      return acc;
    }, 0);
  };

  const hasActiveTimer = t?.timers?.some((tm: any) => !tm.endTime);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette tâche ?')) return;
    setDeleting(true);
    try {
      await deleteTask.mutateAsync(id);
      router.push('/dashboard/tasks');
    } catch {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try { await updateTask.mutateAsync({ id, data: { status } }); } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync({ taskId: id, data: { content: newComment } });
      setNewComment('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try { await deleteComment.mutateAsync({ taskId: id, commentId }); } catch (e) { console.error(e); }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistLabel.trim()) return;
    try {
      await addChecklistItem.mutateAsync({
        taskId: id,
        data: { label: newChecklistLabel, assignedTo: newChecklistAssignee || undefined },
      });
      setNewChecklistLabel('');
      setNewChecklistAssignee('');
    } catch (e) { console.error(e); }
  };

  const handleToggleChecklist = async (itemId: string) => {
    try { await toggleChecklistItem.mutateAsync({ taskId: id, itemId }); } catch (e) { console.error(e); }
  };

  const handleDeleteChecklist = async (itemId: string) => {
    try { await deleteChecklistItem.mutateAsync({ taskId: id, itemId }); } catch (e) { console.error(e); }
  };

  const handleAddResource = async () => {
    if (!newResourceLabel.trim() || !newResourceUrl.trim()) return;
    try {
      await addResource.mutateAsync({
        taskId: id,
        data: { type: newResourceType, label: newResourceLabel, url: newResourceUrl },
      });
      setNewResourceLabel('');
      setNewResourceUrl('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try { await deleteResource.mutateAsync({ taskId: id, resourceId }); } catch (e) { console.error(e); }
  };

  const handleRequestValidation = async () => {
    try {
      await requestValidation.mutateAsync({ taskId: id, data: { note: validationNote } });
      setValidationNote('');
    } catch (e) { console.error(e); }
  };

  const handleApproveValidation = async (validationId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await approveValidation.mutateAsync({
        taskId: id, validationId, data: { status, note: validationTarget === validationId ? validationNote : undefined },
      });
      setValidationTarget(null);
      setValidationNote('');
    } catch (e) { console.error(e); }
  };

  const checklistItems = t?.checklist || [];
  const completedCount = checklistItems.filter((i: any) => i.completed).length;

  if (!params?.id) return null;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!t) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Tâche introuvable</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/tasks" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/tasks/${id}/edit`}>
            <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
            {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
            Supprimer
          </Button>
        </div>
      </div>

      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-brand-700 to-emerald-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <div className="flex flex-wrap gap-2">
              {t.status && <Badge variant={STATUS_COLORS[t.status] || 'default'}>{STATUS_LABELS[t.status] || t.status}</Badge>}
              {t.priority && <Badge variant={PRIORITY_VARIANTS[t.priority] || 'default'}>{PRIORITY_LABELS[t.priority] || t.priority}</Badge>}
              {t.category?.name && <Badge variant="purple">{t.category.name}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Description & details */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Description</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{t.description || 'Aucune description.'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {t.category?.name && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClipboardList className="h-4 w-4 text-gray-400" /> {t.category.name}
                </div>
              )}
              {t.assignee && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4 text-gray-400" /> {t.assignee.firstName} {t.assignee.lastName}
                </div>
              )}
              {t.client?.name && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4 text-gray-400" /> {t.client.name}
                </div>
              )}
              {t.startDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CalendarDays className="h-4 w-4 text-gray-400" /> Début : {new Date(t.startDate).toLocaleDateString('fr-FR')}
                </div>
              )}
              {t.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CalendarDays className="h-4 w-4 text-gray-400" /> Échéance : {new Date(t.dueDate).toLocaleDateString('fr-FR')}
                </div>
              )}
              {t.estimatedHours && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4 text-gray-400" /> {t.estimatedHours}h estimées
                </div>
              )}
            </div>
            {t.linkedEntities && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                {t.linkedEntities?.orderId && (
                  <Link href={`/dashboard/orders/${t.linkedEntities.orderId}`}>
                    <Badge variant="info">Commande #{t.linkedEntities.orderId.slice(0, 8)}</Badge>
                  </Link>
                )}
                {t.linkedEntities?.bookingId && (
                  <Link href={`/dashboard/bookings/${t.linkedEntities.bookingId}`}>
                    <Badge variant="info">Réservation #{t.linkedEntities.bookingId.slice(0, 8)}</Badge>
                  </Link>
                )}
                {t.linkedEntities?.deliveryId && (
                  <Link href={`/dashboard/deliveries/${t.linkedEntities.deliveryId}`}>
                    <Badge variant="info">Livraison #{t.linkedEntities.deliveryId.slice(0, 8)}</Badge>
                  </Link>
                )}
                {t.linkedEntities?.eventId && (
                  <Link href={`/dashboard/events/${t.linkedEntities.eventId}`}>
                    <Badge variant="info">Événement #{t.linkedEntities.eventId.slice(0, 8)}</Badge>
                  </Link>
                )}
                {t.linkedEntities?.rentalId && (
                  <Link href={`/dashboard/rentals/${t.linkedEntities.rentalId}`}>
                    <Badge variant="info">Location #{t.linkedEntities.rentalId.slice(0, 8)}</Badge>
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* 2. Checklist */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> Checklist
              <span className="text-xs font-normal text-gray-400 normal-case">({completedCount}/{checklistItems.length})</span>
            </h3>
            <div className="space-y-2 mb-4">
              {checklistItems.length === 0 && <p className="text-sm text-gray-400">Aucun élément</p>}
              {checklistItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() => handleToggleChecklist(item.id)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                      item.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand'
                    )}
                  >
                    {item.completed && <Check className="h-3 w-3" />}
                  </button>
                  <span className={cn(
                    'text-sm flex-1',
                    item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'
                  )}>
                    {item.label}
                  </span>
                  {item.assignedTo && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.assignedTo.firstName} {item.assignedTo.lastName}
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" value={newChecklistLabel} onChange={(e) => setNewChecklistLabel(e.target.value)}
                placeholder="Ajouter un élément..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
              />
              <input
                type="text" value={newChecklistAssignee} onChange={(e) => setNewChecklistAssignee(e.target.value)}
                placeholder="Assigné à (optionnel)"
                className="w-36 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Button size="sm" onClick={handleAddChecklist} disabled={addChecklistItem.isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* 3. Comments */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Commentaires
            </h3>
            <div className="space-y-4 mb-4">
              {(!t.comments || t.comments.length === 0) && (
                <p className="text-sm text-gray-400">Aucun commentaire</p>
              )}
              {(t.comments || []).map((comment: any) => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comment.author?.firstName} {comment.author?.lastName || 'Utilisateur'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              />
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || addComment.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* 4. Timer */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Timer className="h-4 w-4" /> Chronomètre
            </h3>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {hasActiveTimer ? (
                  <p className="text-2xl font-mono font-bold text-brand">{formatDuration(activeTimer)}</p>
                ) : (
                  <p className="text-sm text-gray-400">Chronomètre arrêté</p>
                )}
                <p className="text-xs text-gray-400">Total : {formatDuration(totalTrackedTime())}</p>
              </div>
              <div className="flex gap-2">
                {hasActiveTimer ? (
                  <Button size="sm" variant="outline" onClick={() => stopTimer.mutateAsync(id)} disabled={stopTimer.isPending}>
                    <Square className="h-4 w-4 mr-1.5" /> Arrêter
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => startTimer.mutateAsync(id)} disabled={startTimer.isPending}>
                    <Play className="h-4 w-4 mr-1.5" /> Démarrer
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* 5. Resources */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Paperclip className="h-4 w-4" /> Ressources
            </h3>
            <div className="space-y-2 mb-4">
              {(!t.resources || t.resources.length === 0) && (
                <p className="text-sm text-gray-400">Aucune ressource</p>
              )}
              {(t.resources || []).map((res: any) => {
                const ResIcon = RESOURCE_ICONS[res.type] || Paperclip;
                return (
                  <div key={res.id} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <ResIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={res.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-brand hover:underline truncate block">
                        {res.label}
                      </a>
                      <span className="text-xs text-gray-400 capitalize">{res.type}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteResource(res.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={newResourceType} onChange={(e) => setNewResourceType(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="document">Document</option>
                <option value="photo">Photo</option>
                <option value="equipment">Équipement</option>
                <option value="vehicle">Véhicule</option>
              </select>
              <input
                type="text" value={newResourceLabel} onChange={(e) => setNewResourceLabel(e.target.value)}
                placeholder="Libellé..."
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <input
                type="url" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)}
                placeholder="URL..."
                className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Button size="sm" onClick={handleAddResource} disabled={!newResourceLabel.trim() || !newResourceUrl.trim() || addResource.isPending}>
                <Plus className="h-4 w-4 mr-1.5" /> Ajouter
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar - right 1/3 */}
        <div className="space-y-6">
          {/* 6. Validations */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Validations
            </h3>
            <div className="space-y-3 mb-4">
              {(!t.validations || t.validations.length === 0) && (
                <p className="text-sm text-gray-400">Aucune validation</p>
              )}
              {(t.validations || []).map((v: any) => {
                const vs = VALIDATION_STATUS[v.status] || VALIDATION_STATUS.PENDING;
                return (
                  <div key={v.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={vs.variant} size="xs">{vs.label}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(v.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {v.note && <p className="text-xs text-gray-500 mb-2">{v.note}</p>}
                    {v.validatedBy && (
                      <p className="text-xs text-gray-400">
                        Par {v.validatedBy.firstName} {v.validatedBy.lastName}
                      </p>
                    )}
                    {v.status === 'PENDING' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="xs" variant="outline" onClick={() => handleApproveValidation(v.id, 'APPROVED')}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          <Check className="h-3 w-3 mr-1" /> Approuver
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => handleApproveValidation(v.id, 'REJECTED')}
                          className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3 mr-1" /> Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <textarea
                value={validationNote} onChange={(e) => setValidationNote(e.target.value)}
                placeholder="Note de validation..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              />
              <Button size="sm" onClick={handleRequestValidation} disabled={requestValidation.isPending} className="w-full">
                <Send className="h-4 w-4 mr-1.5" /> Demander une validation
              </Button>
            </div>
          </Card>

          {/* 7. History */}
          <Card padding="lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> Historique
            </h3>
            <div className="space-y-3">
              {!historyData && <div className="flex justify-center py-4"><Loader className="h-5 w-5 animate-spin text-gray-400" /></div>}
              {historyData && historyData.length === 0 && (
                <p className="text-sm text-gray-400">Aucun événement</p>
              )}
              {(historyData || []).slice(0, 10).map((event: any, i: number, arr: any[]) => {
                const EventIcon = event.action === 'CREATED' ? CheckCircle2
                  : event.action === 'STATUS_CHANGED' ? Clock
                  : event.action === 'COMMENT_ADDED' ? MessageSquare
                  : event.action === 'TIMER_STARTED' ? Play
                  : event.action === 'TIMER_STOPPED' ? Square
                  : event.action === 'VALIDATION_REQUESTED' ? Shield
                  : event.action === 'VALIDATION_APPROVED' ? Check
                  : event.action === 'VALIDATION_REJECTED' ? XCircle
                  : History;
                return (
                  <div key={event.id || i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center',
                        i === 0 ? 'bg-brand-100 dark:bg-brand-900/30 text-brand' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      )}>
                        <EventIcon className="h-3.5 w-3.5" />
                      </div>
                      {i < arr.length - 1 && <div className="w-0.5 h-5 bg-gray-200 dark:bg-gray-700" />}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{event.action}</p>
                      {event.description && <p className="text-xs text-gray-500">{event.description}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(event.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Statut
        </h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => {
            const isActive = t.status === status;
            const colorMap: Record<string, string> = {
              TODO: 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400',
              IN_PROGRESS: 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400',
              ON_HOLD: 'border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400',
              DONE: 'border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400',
              BLOCKED: 'border-red-300 text-red-700 dark:border-red-600 dark:text-red-400',
            };
            const activeColorMap: Record<string, string> = {
              TODO: 'bg-gray-600 text-white border-gray-600',
              IN_PROGRESS: 'bg-blue-600 text-white border-blue-600',
              ON_HOLD: 'bg-amber-600 text-white border-amber-600',
              DONE: 'bg-emerald-600 text-white border-emerald-600',
              BLOCKED: 'bg-red-600 text-white border-red-600',
            };
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updateTask.isPending}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                  isActive ? activeColorMap[status] : `${colorMap[status]} hover:bg-gray-50 dark:hover:bg-gray-800`
                )}
              >
                {STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
