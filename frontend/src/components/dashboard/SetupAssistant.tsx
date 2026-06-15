'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Circle, AlertCircle, ArrowRight, Upload, Image,
  Phone, MapPin, Clock, CreditCard, Truck, Calendar, ShoppingBag,
  Hand, Users, Globe, MessageCircle, Star, ChevronDown, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Business } from '@/types/business';

interface Task {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  done: boolean;
  section: string;
}

interface Props {
  completionScore: number;
  business: Business | null | undefined;
}

export function SetupAssistant({ completionScore, business }: Props) {
  const [expanded, setExpanded] = useState(true);

  const tasks: Task[] = useMemo(() => {
    if (!business) return [];
    return [
      { id: 'logo', label: 'Ajouter un logo', href: '/dashboard/public-page', icon: Image, done: !!business.logo, section: 'Identité' },
      { id: 'cover', label: 'Ajouter une couverture', href: '/dashboard/public-page', icon: Image, done: !!business.coverImage, section: 'Identité' },
      { id: 'desc', label: 'Rédiger une description', href: '/dashboard/public-page', icon: Globe, done: !!business.description, section: 'Identité' },
      { id: 'phone', label: 'Ajouter un téléphone', href: '/dashboard/public-page', icon: Phone, done: !!business.phone, section: 'Contact' },
      { id: 'address', label: 'Configurer l\'adresse', href: '/dashboard/public-page', icon: MapPin, done: !!business.address, section: 'Contact' },
      { id: 'hours', label: 'Configurer les horaires', href: '/dashboard/public-page', icon: Clock, done: (business.hours?.length || 0) > 0, section: 'Contact' },
      { id: 'whatsapp', label: 'Ajouter WhatsApp', href: '/dashboard/public-page', icon: MessageCircle, done: !!business.whatsapp, section: 'Contact' },
      { id: 'modules', label: 'Activer des modules', href: '/dashboard/marketplace', icon: Sparkles, done: (business.modules?.length || 0) > 0, section: 'Configuration' },
      { id: 'payments', label: 'Configurer les paiements', href: '/dashboard/settings', icon: CreditCard, done: false, section: 'Configuration' },
      { id: 'delivery', label: 'Configurer les livraisons', href: '/dashboard/deliveries', icon: Truck, done: (business as any)?.deliveryZones?.length > 0, section: 'Configuration' },
    ];
  }, [business]);

  const completedTasks = tasks.filter((t) => t.done).length;
  const score = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : completionScore;

  if (score >= 100) return null;

  const pendingTasks = tasks.filter((t) => !t.done);
  const sections = [...new Set(tasks.map((t) => t.section))];

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center">
              {score >= 100 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <svg className="absolute -top-1 -right-1 w-5 h-5" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-200 dark:text-emerald-700" />
              <circle
                cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 8}`}
                strokeDashoffset={`${2 * Math.PI * 8 * (1 - score / 100)}`}
                className="text-emerald-600 origin-center -rotate-90"
                style={{ transformOrigin: 'center' }}
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Configuration du business
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {completedTasks}/{tasks.length} tâches complétées · {score}%
            </p>
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5">
          <div className="h-2 bg-emerald-100 dark:bg-emerald-800/40 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${score}%` }}
            />
          </div>

          <div className="space-y-4">
            {sections.map((section) => {
              const sectionTasks = pendingTasks.filter((t) => t.section === section);
              if (sectionTasks.length === 0) return null;
              return (
                <div key={section}>
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {section}
                  </p>
                  <div className="space-y-1">
                    {sectionTasks.map((task) => (
                      <Link
                        key={task.id}
                        href={task.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors group"
                      >
                        <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 group-hover:text-brand transition-colors">
                          <task.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                          {task.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 ml-auto text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/dashboard/public-page">
            <Button variant="secondary" size="sm" fullWidth className="mt-4">
              Compléter mon profil
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
