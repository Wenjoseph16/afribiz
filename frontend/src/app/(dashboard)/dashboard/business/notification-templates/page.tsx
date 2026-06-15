'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useMyBusiness } from '@/features/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Save, ToggleLeft, ToggleRight, Trash2, MessageSquare,
} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  ORDER_PLACED: 'Commande passée',
  ORDER_CONFIRMED: 'Commande confirmée',
  ORDER_PREPARING: 'Commande en préparation',
  ORDER_SHIPPED: 'Commande expédiée',
  ORDER_DELIVERED: 'Commande livrée',
  ORDER_CANCELLED: 'Commande annulée',
  BOOKING_CONFIRMED: 'Réservation confirmée',
  BOOKING_REMINDER: 'Rappel de réservation',
  BOOKING_CANCELLED: 'Réservation annulée',
  PAYMENT_RECEIVED: 'Paiement reçu',
  PAYMENT_REMINDER: 'Rappel de paiement',
  PAYMENT_REFUNDED: 'Remboursement',
  REVIEW_RESPONSE: 'Réponse à un avis',
  NEW_MESSAGE: 'Nouveau message',
  PROMOTION: 'Promotion',
  NEW_EVENT: 'Nouvel événement',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  ORDER_PLACED: 'Quand un client passe commande',
  ORDER_CONFIRMED: 'Quand la commande est confirmée',
  ORDER_SHIPPED: 'Quand la commande est expédiée',
  ORDER_DELIVERED: 'Quand la commande est livrée',
  ORDER_CANCELLED: 'Quand une commande est annulée',
  BOOKING_CONFIRMED: 'Quand une réservation est confirmée',
  BOOKING_REMINDER: 'Rappel de réservation à venir',
  PAYMENT_RECEIVED: 'Quand un paiement est reçu',
  PAYMENT_REFUNDED: 'Quand un remboursement est effectué',
  REVIEW_RESPONSE: 'Quand vous répondez à un avis',
  NEW_MESSAGE: 'Quand vous envoyez un message',
  PROMOTION: 'Quand une promotion est lancée',
};

interface Template {
  id: string;
  businessId: string;
  type: string;
  customTitle: string;
  customDescription: string | null;
  isActive: boolean;
}

function TemplateEditor({
  type,
  template,
  onSave,
  onToggle,
  onDelete,
  saving,
}: {
  type: string;
  template?: Template;
  onSave: (type: string, title: string, description: string) => void;
  onToggle: (type: string, active: boolean) => void;
  onDelete: (type: string) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(template?.customTitle || '');
  const [description, setDescription] = useState(template?.customDescription || '');
  const [expanded, setExpanded] = useState(false);

  return (
    <Card padding="md" className="border border-border/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {TYPE_LABELS[type] || type}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {TYPE_DESCRIPTIONS[type] || ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template?.isActive ? (
            <button
              onClick={() => onToggle(type, false)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              title="Désactiver"
            >
              <ToggleRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => onToggle(type, true)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Activer"
            >
              <ToggleLeft className="h-5 w-5" />
            </button>
          )}
          {template && (
            <button
              onClick={() => onDelete(type)}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Titre personnalisé *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ex: Merci pour votre commande !`}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Message personnalisé
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex: {clientName}, votre commande #{orderId} a bien été reçue. Merci {businessName} !`}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all placeholder:text-muted-foreground resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Variables disponibles : {'{businessName}'}, {'{orderId}'}, {'{amount}'}, {'{clientName}'}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave(type, title, description)}
              disabled={!title.trim() || saving}
            >
              <Save className="h-3.5 w-3.5" />
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function NotificationTemplatesPage() {
  const { data: business, isLoading: bizLoading, error: bizError, refetch: bizRefetch } = useMyBusiness();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const bizId = business?.id;

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['business-notification-templates', bizId],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/templates', {
        params: { businessId: bizId },
      });
      return res.data.data as Template[];
    },
    enabled: !!bizId,
  });

  const templates = Array.isArray(templatesData) ? templatesData : [];

  const { data: availableTypesData } = useQuery({
    queryKey: ['notification-available-types'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/templates/available-types');
      return res.data.data as string[];
    },
  });

  const availableTypes = Array.isArray(availableTypesData) ? availableTypesData : [];

  const saveMutation = useMutation({
    mutationFn: async ({ type, customTitle, customDescription }: { type: string; customTitle: string; customDescription: string }) => {
      const res = await apiClient.post(`/notifications/templates/business/${bizId}`, {
        type,
        customTitle,
        customDescription,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-notification-templates', bizId] });
      notify({ title: 'Template enregistré', variant: 'success' });
    },
    onError: () => {
      notify({ title: 'Erreur', description: 'Impossible d\'enregistrer le template', variant: 'error' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ type, isActive }: { type: string; isActive: boolean }) => {
      const res = await apiClient.patch(`/notifications/templates/business/${bizId}/toggle`, {
        type,
        isActive,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-notification-templates', bizId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiClient.delete(`/notifications/templates/business/${bizId}`, {
        params: { type },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-notification-templates', bizId] });
      notify({ title: 'Template supprimé', variant: 'success' });
    },
    onError: () => {
      notify({ title: 'Erreur', description: 'Impossible de supprimer le template', variant: 'error' });
    },
  });

  const handleSave = (type: string, title: string, description: string) => {
    saveMutation.mutate({ type, customTitle: title, customDescription: description });
  };

  const handleToggle = (type: string, isActive: boolean) => {
    toggleMutation.mutate({ type, isActive });
  };

  const handleDelete = (type: string) => {
    deleteMutation.mutate(type);
  };

  if (bizError) return <ErrorState message={bizError.message} onRetry={bizRefetch} />;

  if (bizLoading || templatesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
        <div className="h-20 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const typesToShow = availableTypes.length > 0 ? availableTypes : Object.keys(TYPE_LABELS);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications client</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez les messages que vos clients reçoivent de votre part.
        </p>
      </div>

      <Card padding="md" className="bg-gradient-to-r from-brand/5 to-brand/10 dark:from-brand/10 dark:to-brand/5 border-brand/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand/10 text-brand">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Variables disponibles</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Utilisez <code className="px-1 py-0.5 bg-muted rounded text-brand text-[11px]">{'{businessName}'}</code>,
              <code className="px-1 py-0.5 bg-muted rounded text-brand text-[11px]">{'{orderId}'}</code>,
              <code className="px-1 py-0.5 bg-muted rounded text-brand text-[11px]">{'{amount}'}</code> et
              <code className="px-1 py-0.5 bg-muted rounded text-brand text-[11px]">{'{clientName}'}</code>
              dans vos messages pour les personnaliser automatiquement.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {typesToShow.map((type) => {
          const existingTemplate = templates.find((t) => t.type === type);
          return (
            <TemplateEditor
              key={type}
              type={type}
              template={existingTemplate}
              onSave={handleSave}
              onToggle={handleToggle}
              onDelete={handleDelete}
              saving={saveMutation.isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
