'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  CalendarClock,
  Check,
  ChevronRight,
  Loader,
  Mail,
  MessageSquare,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

const CHANNELS = [
  {
    key: 'WHATSAPP',
    label: 'WhatsApp',
    desc: 'Message direct sur WhatsApp',
    icon: MessageSquare,
    color: 'text-emerald-500',
  },
  {
    key: 'SMS',
    label: 'SMS',
    desc: 'Message texte classique',
    icon: Smartphone,
    color: 'text-blue-500',
  },
  {
    key: 'EMAIL',
    label: 'Email',
    desc: 'Email personnalisé',
    icon: Mail,
    color: 'text-purple-500',
  },
  {
    key: 'PUSH',
    label: 'Push',
    desc: 'Notification in-app AfriBiz',
    icon: Bell,
    color: 'text-amber-500',
  },
] as const;

const PRESET_DAYS = [
  { day: 3, label: 'J+3', desc: 'Rappel doux' },
  { day: 7, label: 'J+7', desc: 'Relance ferme' },
  { day: 15, label: 'J+15', desc: 'Mise en garde' },
  { day: 30, label: 'J+30', desc: 'Dernier avertissement' },
];

const TEMPLATE_FIELDS = [
  {
    key: 'dueDateMessage',
    label: 'Rappel d’échéance',
    icon: CalendarClock,
    hint: 'Envoyé quand la date limite approche',
    default:
      'Bonjour {client} 👋, un petit rappel amical : il reste {montant} à régler chez {business} ({reference}). Vous pouvez payer en un clic ici : {lien}',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'overdueMessage',
    label: 'En retard',
    icon: BellRing,
    hint: 'Envoyé quand la dette dépasse l’échéance',
    default:
      'Bonjour {client}, votre règlement de {montant} chez {business} ({reference}) est arrivé à échéance. Un paiement rapide protège votre confiance : {lien}',
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'criticalMessage',
    label: 'Dette critique',
    icon: ShieldCheck,
    hint: 'Envoyé pour les dettes très en retard',
    default:
      'Bonjour {client}, votre dette de {montant} chez {business} ({reference}) devient urgente. Contactez-nous ou payez ici pour éviter toute gêne : {lien}',
    color: 'from-rose-500 to-red-500',
  },
  {
    key: 'paymentThanks',
    label: 'Merci après paiement',
    icon: Check,
    hint: 'Envoyé automatiquement quand le client solde',
    default:
      'Merci {client} 🙏 ! Votre règlement de {montant} chez {business} a bien été reçu. À très vite !',
    color: 'from-emerald-500 to-teal-500',
  },
];

const VARIABLES = [
  { var: '{client}', desc: 'Nom du client' },
  { var: '{business}', desc: 'Nom du commerce' },
  { var: '{montant}', desc: 'Montant restant (ex : 3 500 FCFA)' },
  { var: '{reference}', desc: 'N° commande ou facture' },
  { var: '{lien}', desc: 'Lien de paiement en un clic' },
];

export default function DebtReminderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cfg, setCfg] = useState<any>(null);

  const [enabled, setEnabled] = useState(true);
  const [channels, setChannels] = useState<string[]>(['WHATSAPP', 'EMAIL']);
  const [scheduleDays, setScheduleDays] = useState<number[]>([3, 7, 15, 30]);
  const [maxRemindersPerDebt, setMaxRemindersPerDebt] = useState(4);
  const [templates, setTemplates] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await apiClient.getReminderConfig();
      const data = res.data?.data;
      if (data) {
        setCfg(data);
        setEnabled(!!data.enabled);
        setChannels(Array.isArray(data.channels) ? data.channels : ['WHATSAPP', 'EMAIL']);
        setScheduleDays(
          Array.isArray(data.scheduleDays) ? data.scheduleDays.map(Number) : [3, 7, 15, 30]
        );
        setMaxRemindersPerDebt(Number(data.maxRemindersPerDebt) || 4);
        setTemplates({
          dueDateMessage: data.dueDateMessage || TEMPLATE_FIELDS[0].default,
          overdueMessage: data.overdueMessage || TEMPLATE_FIELDS[1].default,
          criticalMessage: data.criticalMessage || TEMPLATE_FIELDS[2].default,
          paymentThanks: data.paymentThanks || TEMPLATE_FIELDS[3].default,
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleChannel = (key: string) => {
    setChannels((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const toggleDay = (day: number) => {
    setScheduleDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return next.sort((a, b) => a - b);
    });
  };

  const preview = (template: string) => {
    return template
      .replace('{client}', 'Awa Coulibaly')
      .replace('{business}', 'Saveur d’Abidjan')
      .replace('{montant}', '3 500 FCFA')
      .replace('{reference}', '#CMD-2026-0042')
      .replace('{lien}', 'afribiz.app/payer');
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload = {
        enabled,
        channels,
        scheduleDays,
        maxRemindersPerDebt,
        ...templates,
      };
      await apiClient.updateReminderConfig(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  if (error)
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Rappels de dettes"
          description="Configuration du recouvrement automatique"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
            { label: 'Paramètres rappels' },
          ]}
        />
        <ErrorState onRetry={load} message="Impossible de charger la configuration des rappels." />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageHeader
        title="Rappels de dettes"
        description="Le recouvrement travaille tout seul : des rappels doux et progressifs, avec des messages déjà rédigés que vous pouvez personnaliser."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
          { label: 'Paramètres rappels' },
        ]}
        badge={enabled ? 'Actif' : 'En pause'}
        actions={
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <Loader className="h-4 w-4 mr-1.5 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {saved ? 'Enregistré' : 'Enregistrer'}
          </Button>
        }
      />

      {/* Bandeau mode automatique */}
      <Card className="p-5 border-l-4 border-l-brand overflow-hidden relative">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-brand/5 pointer-events-none" />
        <div className="flex items-center justify-between gap-4 flex-wrap relative">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-brand/70 text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Recouvrement automatique
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
                Une dette impayée est relancée toute seule, en douceur, aux paliers que vous
                choisissez. Le client reçoit un lien de paiement en un clic. Vous n’avez rien à
                faire.
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              'relative w-14 h-8 rounded-full transition-colors duration-300 shrink-0',
              enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300',
                enabled ? 'left-7' : 'left-1'
              )}
            />
          </button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne gauche : fréquence + canaux */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-4.5 h-4.5 text-brand" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Fréquence des rappels</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Chaque palier déclenche un message progressif. Le palier J+X est envoyé X jours après
              la date d’échéance.
            </p>
            <div className="space-y-2.5">
              {PRESET_DAYS.map((p) => {
                const active = scheduleDays.includes(p.day);
                return (
                  <button
                    key={p.day}
                    onClick={() => toggleDay(p.day)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
                      active
                        ? 'border-brand/40 bg-brand/5 dark:bg-brand/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold',
                          active
                            ? 'bg-brand text-white shadow-md shadow-brand/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {p.day}
                      </span>
                      <div className="text-left">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            active
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {p.label}
                        </p>
                        <p className="text-[11px] text-gray-400">{p.desc}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                    >
                      {active && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Rappels max par dette
                </p>
                <p className="text-[11px] text-gray-400">Évite d’importuner le client</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaxRemindersPerDebt((v) => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                  {maxRemindersPerDebt}
                </span>
                <button
                  onClick={() => setMaxRemindersPerDebt((v) => Math.min(10, v + 1))}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4.5 h-4.5 text-brand" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Canaux d’envoi</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Le client est contacté sur le premier canal disponible.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                const active = channels.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => toggleChannel(c.key)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl border text-left transition-all duration-200',
                      active
                        ? 'border-brand/40 bg-brand/5 dark:bg-brand/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <Icon className={cn('w-4.5 h-4.5', active ? c.color : 'text-gray-400')} />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        active
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {c.label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight">{c.desc}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Colonne droite : templates */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4.5 h-4.5 text-brand" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Messages envoyés</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Modifiez librement le ton des messages. Les variables entre {'{'} {'}'} sont
              remplacées automatiquement pour chaque client.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {VARIABLES.map((v) => (
                <span
                  key={v.var}
                  title={v.desc}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-mono text-brand cursor-help"
                >
                  {v.var}
                  <span className="text-gray-400 font-sans">{v.desc}</span>
                </span>
              ))}
            </div>

            <div className="space-y-5">
              {TEMPLATE_FIELDS.map((field) => {
                const Icon = field.icon;
                const value = templates[field.key] || field.default;
                const previewText = preview(value);
                return (
                  <div
                    key={field.key}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div
                      className={cn(
                        'bg-gradient-to-r px-4 py-2.5 text-white flex items-center justify-between',
                        field.color
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-semibold">{field.label}</span>
                      </div>
                      <span className="text-[11px] text-white/80">{field.hint}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <textarea
                        value={value}
                        onChange={(e) =>
                          setTemplates((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100 resize-y"
                      />
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 px-3.5 py-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Aperçu
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {previewText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Barre de sauvegarde fixe en bas sur mobile */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <Button className="w-full shadow-xl" onClick={save} disabled={saving}>
          {saved ? <Check className="h-4 w-4 mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
          {saved ? 'Configuration enregistrée' : 'Enregistrer la configuration'}
        </Button>
      </div>

      <Card className="p-4 bg-gradient-to-r from-brand/5 to-transparent border-brand/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">
                100% doux, jamais agressif.
              </span>{' '}
              Les rappels sont progressifs, personnalisés et contiennent un lien de paiement direct.
              Le client garde une excellente image de votre commerce.
            </p>
          </div>
          <button
            onClick={() => window.open('/dashboard/debts-payments/reminders', '_self')}
            className="inline-flex items-center gap-1 text-sm text-brand font-medium hover:underline shrink-0"
          >
            Voir l’historique des relances
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
