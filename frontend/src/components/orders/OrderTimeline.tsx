'use client';

import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CreditCard,
  AlertCircle,
  XCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  timestamp?: string;
}

interface OrderTimelineProps {
  /** Statut actuel de la commande */
  orderStatus: string;
  /** Date de création */
  createdAt?: string;
  /** Date de paiement */
  paidAt?: string;
  /** Date de livraison */
  deliveredAt?: string;
  /** Date d'annulation */
  cancelledAt?: string;
  /** Classe CSS */
  className?: string;
}

/**
 * Timeline de suivi de commande.
 *
 * Affiche l'avancement d'une commande avec des étapes visuelles :
 * Créée → Payée → En cours → Livrée
 *
 * Réalitye africaine : le client veut SAVOIR où en est sa commande.
 * Pas de redirect, pas de confusion — juste une timeline claire.
 */
export function OrderTimeline({
  orderStatus,
  createdAt,
  paidAt,
  deliveredAt,
  cancelledAt,
  className,
}: OrderTimelineProps) {
  const steps = buildSteps(orderStatus, createdAt, paidAt, deliveredAt, cancelledAt);

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, i) => {
        const Icon = getStepIcon(step.status);
        const isLast = i === steps.length - 1;

        return (
          <div key={i} className="flex gap-3">
            {/* Colonne gauche : icône + ligne */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                  step.status === 'completed' && 'bg-emerald-100 dark:bg-emerald-900/30',
                  step.status === 'current' && 'bg-brand/10 ring-2 ring-brand/30',
                  step.status === 'pending' && 'bg-gray-100 dark:bg-gray-800',
                  step.status === 'error' && 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    step.status === 'completed' && 'text-emerald-600',
                    step.status === 'current' && 'text-brand',
                    step.status === 'pending' && 'text-gray-400',
                    step.status === 'error' && 'text-red-500'
                  )}
                />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    step.status === 'completed'
                      ? 'bg-emerald-200 dark:bg-emerald-800'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>

            {/* Colonne droite : contenu */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-emerald-700 dark:text-emerald-400',
                  step.status === 'current' && 'text-gray-900 dark:text-gray-100',
                  step.status === 'pending' && 'text-gray-400',
                  step.status === 'error' && 'text-red-600 dark:text-red-400'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              )}
              {step.timestamp && (
                <p className="text-[10px] text-gray-400 mt-1">{formatTimestamp(step.timestamp)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildSteps(
  status: string,
  createdAt?: string,
  paidAt?: string,
  deliveredAt?: string,
  cancelledAt?: string
): TimelineStep[] {
  const isCancelled = status === 'CANCELLED';
  const isRefunded = status === 'REFUNDED';

  const steps: TimelineStep[] = [
    {
      label: 'Commande créée',
      description: 'Votre commande a été enregistrée',
      status: 'completed',
      timestamp: createdAt,
    },
    {
      label: 'Paiement confirmé',
      description: isCancelled ? 'Annulée' : 'Paiement reçu',
      status: isCancelled
        ? 'error'
        : paidAt || ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)
          ? 'completed'
          : status === 'PENDING'
            ? 'current'
            : 'pending',
      timestamp: paidAt,
    },
    {
      label: isCancelled ? 'Annulée' : 'En cours de traitement',
      description: isCancelled ? 'La commande a été annulée' : 'Le business prépare votre commande',
      status: isCancelled
        ? 'error'
        : ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)
          ? 'completed'
          : status === 'PAID'
            ? 'current'
            : 'pending',
      timestamp: cancelledAt,
    },
    {
      label: 'Livrée',
      description: 'Commande réceptionnée',
      status: isCancelled
        ? 'pending'
        : ['DELIVERED', 'COMPLETED'].includes(status)
          ? 'completed'
          : status === 'SHIPPED'
            ? 'current'
            : 'pending',
      timestamp: deliveredAt,
    },
  ];

  return steps;
}

function getStepIcon(status: TimelineStep['status']) {
  switch (status) {
    case 'completed':
      return CheckCircle2;
    case 'current':
      return Clock;
    case 'error':
      return XCircle;
    default:
      return Circle;
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}
