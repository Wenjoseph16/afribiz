'use client';

import { cn } from '@/lib/utils';
import { Check, Clock, XCircle, Package, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TimelineStep {
  status: string;
  label: string;
  date: string | null;
  isActive: boolean;
}

interface OrderTimelineProps {
  timeline: TimelineStep[];
  currentStatus: string;
  orderNumber?: string;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  ACCEPTED: <Check className="h-4 w-4" />,
  PREPARING: <Package className="h-4 w-4" />,
  READY: <CheckCircle2 className="h-4 w-4" />,
  DELIVERED: <Truck className="h-4 w-4" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  REFUSED: <XCircle className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, { active: string; completed: string; text: string }> = {
  PENDING: { active: 'bg-amber-500 border-amber-500', completed: 'bg-amber-100 border-amber-300 dark:bg-amber-900/30', text: 'text-amber-600' },
  ACCEPTED: { active: 'bg-blue-500 border-blue-500', completed: 'bg-blue-100 border-blue-300 dark:bg-blue-900/30', text: 'text-blue-600' },
  PREPARING: { active: 'bg-purple-500 border-purple-500', completed: 'bg-purple-100 border-purple-300 dark:bg-purple-900/30', text: 'text-purple-600' },
  READY: { active: 'bg-teal-500 border-teal-500', completed: 'bg-teal-100 border-teal-300 dark:bg-teal-900/30', text: 'text-teal-600' },
  DELIVERED: { active: 'bg-emerald-500 border-emerald-500', completed: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30', text: 'text-emerald-600' },
  COMPLETED: { active: 'bg-gray-600 border-gray-600', completed: 'bg-gray-100 border-gray-300 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
  CANCELLED: { active: 'bg-red-500 border-red-500', completed: 'bg-red-100 border-red-300 dark:bg-red-900/30', text: 'text-red-600' },
  REFUSED: { active: 'bg-red-500 border-red-500', completed: 'bg-red-100 border-red-300 dark:bg-red-900/30', text: 'text-red-600' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function getDuration(dateStr: string | null, referenceStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const ref = new Date(referenceStr);
    const diffMs = d.getTime() - ref.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'à l\'instant';
    if (diffMin < 60) return `+${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    return `+${diffH}h${diffMin % 60 > 0 ? (diffMin % 60) + 'min' : ''}`;
  } catch {
    return '';
  }
}

export default function OrderTimeline({ timeline, currentStatus, orderNumber }: OrderTimelineProps) {
  const isCancelledOrRefused = ['CANCELLED', 'REFUSED'].includes(currentStatus);
  const isTerminal = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUSED'].includes(currentStatus);

  // Compute elapsed time since order creation for the PENDING step
  const pendingStep = timeline.find(s => s.status === 'PENDING');
  const pendingDate = pendingStep?.date || null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          Suivi de commande
        </h3>
        {orderNumber && (
          <span className="text-xs text-gray-500 font-mono">{orderNumber}</span>
        )}
      </div>

      {/* Status highlight banner */}
      {currentStatus === 'PENDING' && (
        <div className="flex items-center gap-2.5 p-3 mb-5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <Clock className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">En attente de confirmation</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Le vendeur va bientôt prendre en charge votre commande</p>
          </div>
        </div>
      )}

      {currentStatus === 'ACCEPTED' && (
        <div className="flex items-center gap-2.5 p-3 mb-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
          <Check className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Commande prise en charge</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Le vendeur s\'occupe de votre commande</p>
          </div>
        </div>
      )}

      {currentStatus === 'CANCELLED' && (
        <div className="flex items-center gap-2.5 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Commande annulée</p>
            <p className="text-xs text-red-600 dark:text-red-400">Cette commande a été annulée</p>
          </div>
        </div>
      )}

      {currentStatus === 'DELIVERED' && (
        <div className="flex items-center gap-2.5 p-3 mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
          <Truck className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Commande livrée</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Votre commande a été livrée avec succès</p>
          </div>
        </div>
      )}

      {/* Timeline steps */}
      <div className="relative">
        {timeline.map((step, index) => {
          const colors = STATUS_COLORS[step.status] || STATUS_COLORS.PENDING;
          const icons = STATUS_ICONS[step.status] || <Clock className="h-4 w-4" />;
          const isLast = index === timeline.length - 1;
          const isCompleted = step.date !== null && !isCancelledOrRefused;
          const isCurrentStep = step.isActive && !step.date && !isTerminal;

          // Don't show cancelled/refused step in the main flow if it's not the current status
          if (['CANCELLED', 'REFUSED'].includes(step.status) && step.status !== currentStatus) {
            return null;
          }

          return (
            <div key={step.status} className={cn('relative flex gap-4 pb-6', isLast && 'pb-0')}>
              {/* Connection line */}
              {!isLast && (
                <div className={cn(
                  'absolute left-[15px] top-8 w-[2px] h-[calc(100%-24px)]',
                  isCompleted ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                )} />
              )}

              {/* Step circle */}
              <div className="relative shrink-0 z-10">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrentStep
                      ? `${colors.active} text-white animate-pulse-soft`
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : icons}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'text-sm font-medium',
                    isCompleted || isCurrentStep
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  )}>
                    {step.label}
                  </p>
                  {step.date && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                      {formatDate(step.date)}
                      {pendingDate && step.status !== 'PENDING' && (
                        <span className="ml-1 text-gray-400">({getDuration(step.date, pendingDate)})</span>
                      )}
                    </span>
                  )}
                  {isCurrentStep && !step.date && currentStatus !== 'PENDING' && (
                    <span className="text-[10px] text-blue-500 font-medium animate-pulse shrink-0">
                      En cours
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cancellation notice */}
      {currentStatus === 'PENDING' && (
        <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Si le vendeur ne répond pas dans les 60 minutes, la commande sera automatiquement annulée.
              Vous recevrez une notification dès qu&apos;elle sera prise en charge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
