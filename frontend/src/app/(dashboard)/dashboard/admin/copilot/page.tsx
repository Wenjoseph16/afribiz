'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  Shield,
  TrendingUp,
  ShoppingCart,
  Calendar,
  MessageSquare,
  Eye,
  Package,
  BarChart3,
  Palette,
  Sun,
  AlertTriangle,
  Users,
  Activity,
  HeartPulse,
  Store,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const TIP_CATEGORIES = [
  'marketing',
  'finance',
  'ventes',
  'ressources_humaines',
  'gestion',
  'fidelisation',
  'numerique',
  'developpement_personnel',
  'juridique',
  'logistique',
];

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  finance: 'Finance',
  ventes: 'Ventes',
  ressources_humaines: 'RH',
  gestion: 'Gestion',
  fidelisation: 'Fidélisation',
  numerique: 'Numérique',
  developpement_personnel: 'Développement personnel',
  juridique: 'Juridique',
  logistique: 'Logistique',
};

const WEIGHT_KEYS = [
  { key: 'afriScore', label: 'AfriScore', icon: TrendingUp },
  { key: 'orders30d', label: 'Commandes (30j)', icon: ShoppingCart },
  { key: 'bookings30d', label: 'Réservations (30j)', icon: Calendar },
  { key: 'reviews30d', label: 'Avis (30j)', icon: MessageSquare },
  { key: 'pageViews30d', label: 'Pages vues (30j)', icon: Eye },
  { key: 'products', label: 'Produits', icon: Package },
  { key: 'ads', label: 'Publicités', icon: BarChart3 },
];

const HEALTH_LEVELS = ['excellent', 'good', 'fair', 'critical'];

const COLORS = [
  { label: 'Vert émeraude', value: '#10b981' },
  { label: 'Bleu', value: '#3b82f6' },
  { label: 'Ambre', value: '#f59e0b' },
  { label: 'Rouge', value: '#ef4444' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Gris', value: '#6b7280' },
];

const DEFAULT_CONFIG = {
  globalEnabled: false,
  dailyTipsEnabled: false,
  alertsEnabled: false,
  tipCategories: [] as string[],
  healthThresholds: { excellent: 80, good: 60, fair: 40, critical: 0 },
  scoreWeights: {
    afriScore: 30,
    orders30d: 15,
    bookings30d: 15,
    reviews30d: 10,
    pageViews30d: 10,
    products: 10,
    ads: 10,
  },
  healthLabels: {
    excellent: { label: 'Excellent', color: '#10b981' },
    good: { label: 'Bon', color: '#3b82f6' },
    fair: { label: 'Moyen', color: '#f59e0b' },
    critical: { label: 'Critique', color: '#ef4444' },
  },
};

function PlatformHealthSection() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['admin', 'copilot', 'platform-health'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/copilot/platform-health');
      return res.data.data as {
        totalBusinesses: number;
        healthDistribution: { excellent: number; good: number; fair: number; critical: number };
        averageHealthScore: number;
        topMissingTips: { tip: string; count: number }[];
        featureAdoption: { module: string; count: number; percentage: number }[];
        businessesAtRisk: {
          id: string;
          name: string;
          healthScore: number;
          daysSinceLastOrder: number;
        }[];
        healthTrend30d: { date: string; avg: number }[];
      };
    },
  });

  if (isLoading) return <Loader className="py-8" />;
  if (!healthData) return null;

  const hd = healthData.healthDistribution;
  const total = hd.excellent + hd.good + hd.fair + hd.critical || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Santé de la plateforme
        </h3>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
          <Store className="h-4 w-4 text-indigo-600 mb-1" />
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
            {healthData.totalBusinesses}
          </p>
          <p className="text-[10px] text-indigo-500">Business actifs</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
          <HeartPulse className="h-4 w-4 text-emerald-600 mb-1" />
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {healthData.averageHealthScore}/100
          </p>
          <p className="text-[10px] text-emerald-500">Score moyen</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 mb-1" />
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {hd.critical + hd.fair}
          </p>
          <p className="text-[10px] text-amber-500">À surveiller</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <Users className="h-4 w-4 text-blue-600 mb-1" />
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {healthData.businessesAtRisk.length}
          </p>
          <p className="text-[10px] text-blue-500">À risque</p>
        </div>
      </div>

      {/* Health distribution */}
      <Card title="Répartition des scores" titleIcon={<BarChart3 className="h-5 w-5" />}>
        <div className="space-y-2">
          {[
            { label: 'Excellent', value: hd.excellent, color: 'bg-emerald-500' },
            { label: 'Bon', value: hd.good, color: 'bg-blue-500' },
            { label: 'Moyen', value: hd.fair, color: 'bg-amber-500' },
            { label: 'Critique', value: hd.critical, color: 'bg-red-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400 w-20">{item.label}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', item.color)}
                  style={{ width: `${(item.value / total) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top missing tips */}
      <Card
        title="Points faibles les plus fréquents"
        titleIcon={<AlertTriangle className="h-5 w-5" />}
      >
        <div className="space-y-2">
          {healthData.topMissingTips.slice(0, 4).map((item) => (
            <div key={item.tip} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{item.tip}</span>
              <Badge variant="danger" size="xs">
                {item.count} business
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Feature adoption */}
      {healthData.featureAdoption.length > 0 && (
        <Card title="Adoption des modules" titleIcon={<Package className="h-5 w-5" />}>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {healthData.featureAdoption.slice(0, 8).map((mod) => (
              <div key={mod.module} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate capitalize">
                  {mod.module.toLowerCase()}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${mod.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
                  {mod.percentage}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Businesses at risk */}
      {healthData.businessesAtRisk.length > 0 && (
        <Card
          title="Business à risque"
          titleIcon={<AlertTriangle className="h-5 w-5 text-red-500" />}
        >
          <div className="space-y-1">
            {healthData.businessesAtRisk.slice(0, 5).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{b.name}</p>
                  <p className="text-xs text-gray-400">
                    Score: {b.healthScore} ·{' '}
                    {b.daysSinceLastOrder > 999
                      ? 'Jamais commandé'
                      : `${b.daysSinceLastOrder}j sans commande`}
                  </p>
                </div>
                <Link
                  href={`/admin/business/${b.id}`}
                  className="text-brand hover:text-brand-700 text-xs font-medium flex items-center gap-1"
                >
                  Voir <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </label>
  );
}

export default function AdminCopilotPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [config, setConfig] = useState<any>(DEFAULT_CONFIG);

  const { data: remoteConfig, isLoading } = useQuery({
    queryKey: ['admin', 'copilot', 'config'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/copilot/config');
      return res.data.data || DEFAULT_CONFIG;
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (remoteConfig) setConfig(remoteConfig);
  }, [remoteConfig]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/admin/copilot/config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'copilot', 'config'] });
      setToast({ message: 'Configuration enregistrée', type: 'success' });
    },
    onError: () => setToast({ message: "Erreur lors de l'enregistrement", type: 'error' }),
  });

  const toggleCategory = (cat: string) => {
    setConfig((prev: any) => ({
      ...prev,
      tipCategories: prev.tipCategories?.includes(cat)
        ? prev.tipCategories.filter((c: string) => c !== cat)
        : [...(prev.tipCategories || []), cat],
    }));
  };

  const updateThreshold = (level: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      healthThresholds: { ...prev.healthThresholds, [level]: Number(value) },
    }));
  };

  const updateWeight = (key: string, value: string) => {
    const num = Math.max(0, Math.min(100, Number(value)));
    setConfig((prev: any) => ({ ...prev, scoreWeights: { ...prev.scoreWeights, [key]: num } }));
  };

  const updateHealthLabel = (level: string, field: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      healthLabels: {
        ...prev.healthLabels,
        [level]: { ...prev.healthLabels[level], [field]: value },
      },
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const weightSum = Object.values(config.scoreWeights || {}).reduce(
    (a: number, b: any) => a + Number(b),
    0
  );
  const isValidWeight = Math.abs(weightSum - 100) < 0.01;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Copilot plateforme
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur."
        />
      </div>
    );
  }

  if (isLoading) return <Loader className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Configuration du Copilot
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Paramètres du conseiller virtuel de la plateforme
          </p>
        </div>
        <Button onClick={handleSave} isLoading={saveMutation.isPending}>
          <Save className="h-4 w-4" /> Enregistrer
        </Button>
      </div>

      {/* Toggles */}
      <Card title="Activation" titleIcon={<Bot className="h-5 w-5" />}>
        <div className="flex flex-col gap-3">
          <Toggle
            enabled={config.globalEnabled}
            onChange={(v) => setConfig({ ...config, globalEnabled: v })}
            label="Activer le Copilot (global)"
          />
          <Toggle
            enabled={config.dailyTipsEnabled}
            onChange={(v) => setConfig({ ...config, dailyTipsEnabled: v })}
            label="Conseils quotidiens"
          />
          <Toggle
            enabled={config.alertsEnabled}
            onChange={(v) => setConfig({ ...config, alertsEnabled: v })}
            label="Alertes intelligentes"
          />
        </div>
      </Card>

      {/* Tip Categories */}
      <Card title="Catégories de conseils" titleIcon={<Sun className="h-5 w-5" />}>
        <div className="flex flex-wrap gap-2">
          {TIP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${config.tipCategories?.includes(cat) ? 'bg-brand text-white border-brand' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand'}`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Health Thresholds */}
      <Card title="Seuils de santé" titleIcon={<AlertTriangle className="h-5 w-5" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {HEALTH_LEVELS.map((level) => (
            <div key={level}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 capitalize">
                {level === 'excellent'
                  ? 'Excellent'
                  : level === 'good'
                    ? 'Bon'
                    : level === 'fair'
                      ? 'Moyen'
                      : 'Critique'}
              </label>
              <Input
                type="number"
                value={config.healthThresholds?.[level] ?? 0}
                onChange={(e) => updateThreshold(level, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Score Weights */}
      <Card
        title="Pondération du score"
        titleIcon={<BarChart3 className="h-5 w-5" />}
        action={
          <Badge variant={isValidWeight ? 'success' : 'danger'} size="xs">
            Total: {weightSum}%
          </Badge>
        }
      >
        <div className="space-y-3">
          {WEIGHT_KEYS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-4">
              <Icon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 w-44">{label}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={config.scoreWeights?.[key] ?? 0}
                onChange={(e) => updateWeight(key, e.target.value)}
                className="flex-1 accent-brand"
              />
              <Input
                type="number"
                value={config.scoreWeights?.[key] ?? 0}
                onChange={(e) => updateWeight(key, e.target.value)}
                className="!w-20"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Platform Health */}
      <PlatformHealthSection />

      {/* Health Labels */}
      <Card title="Libellés de santé" titleIcon={<Palette className="h-5 w-5" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HEALTH_LEVELS.map((level) => {
            const lvlLabels: Record<string, string> = {
              excellent: 'Excellent',
              good: 'Bon',
              fair: 'Moyen',
              critical: 'Critique',
            };
            return (
              <div
                key={level}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-gray-500 capitalize">
                    {lvlLabels[level]}
                  </label>
                  <Input
                    value={config.healthLabels?.[level]?.label || ''}
                    onChange={(e) => updateHealthLabel(level, 'label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500">Couleur</label>
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateHealthLabel(level, 'color', c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${config.healthLabels?.[level]?.color === c.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
