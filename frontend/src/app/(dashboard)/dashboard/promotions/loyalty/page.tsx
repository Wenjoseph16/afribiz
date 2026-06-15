'use client';

import { useState, useEffect } from 'react';
import { Award, Star, Gift, Settings, Save, Loader, Users, Sparkles, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useLoyaltyProgram } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const TIER_NAMES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
const TIER_COLORS: Record<string, string> = {
  BRONZE: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
  SILVER: 'text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-300',
  GOLD: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
  PLATINUM: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400',
  DIAMOND: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400',
};
const TIER_ICONS: Record<string, any> = { BRONZE: Award, SILVER: Award, GOLD: Star, PLATINUM: Sparkles, DIAMOND: Zap };

export default function BusinessLoyaltyPage() {
  const { data: programData, isLoading, refetch } = useLoyaltyProgram();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);

  const program = programData?.program || programData?.data || programData;

  useEffect(() => {
    if (program && !form) {
      const p: any = program;
      setForm({
        enabled: p.enabled ?? true,
        pointsPerCurrency: p.pointsPerCurrency?.toString() || '1',
        currencyPerPoint: p.currencyPerPoint?.toString() || '100',
        tiers: p.tiers || TIER_NAMES.map((name, i) => ({
          name, minPoints: [0, 500, 2000, 5000, 15000][i] || 0,
          benefits: name === 'BRONZE' ? ['Points de base'] :
                    name === 'SILVER' ? ['Points × 1.2', 'Livraison offerte 1x/mois'] :
                    name === 'GOLD' ? ['Points × 1.5', 'Livraison offerte', 'Réduction 5%'] :
                    name === 'PLATINUM' ? ['Points × 2', 'Livraison offerte', 'Réduction 10%', 'Accès avant-première'] :
                    ['Points × 3', 'Livraison offerte', 'Réduction 15%', 'Accès VIP', 'Support prioritaire'],
        })),
        rewards: p.rewards || [
          { name: 'Réduction 5%', pointsCost: 500, type: 'DISCOUNT' },
          { name: 'Livraison offerte', pointsCost: 300, type: 'FREE_SHIPPING' },
          { name: 'Réduction 10%', pointsCost: 1000, type: 'DISCOUNT' },
          { name: 'Produit gratuit', pointsCost: 2500, type: 'FREE_ITEM' },
        ],
      });
    }
  }, [program]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await apiClient.updateLoyaltyProgram(form);
      refetch();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  if (isLoading && !program) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programme de fidélité</h1><p className="text-sm text-gray-500">Configurez votre programme de fidélité et récompenses</p></div>
        <Button onClick={handleSave} disabled={saving || !form}><Save className="h-4 w-4 mr-1.5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>

      {form && (
        <>
          {/* Activation */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10"><Award className="w-5 h-5 text-brand" /></div>
                <div><p className="text-sm font-semibold text-gray-900 dark:text-white">Activer le programme</p><p className="text-xs text-gray-500">Les clients cumuleront des points à chaque achat</p></div>
              </div>
              <button onClick={() => setForm((f: any) => ({ ...f, enabled: !f.enabled }))}
                className={cn('relative w-11 h-6 rounded-full transition-colors', form.enabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600')}>
                <div className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', form.enabled && 'translate-x-5')} />
              </button>
            </div>
          </Card>

          {/* Points Configuration */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4" />Configuration des points</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Points par unité monétaire</label>
                <input type="number" value={form.pointsPerCurrency} onChange={e => setForm((f: any) => ({ ...f, pointsPerCurrency: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                <p className="text-[10px] text-gray-400 mt-1">Ex: 1 point = 100 FCFA dépensés</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valeur en monnaie par point</label>
                <input type="number" value={form.currencyPerPoint} onChange={e => setForm((f: any) => ({ ...f, currencyPerPoint: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                <p className="text-[10px] text-gray-400 mt-1">Ex: 100 FCFA dépensés = 1 point</p>
              </div>
            </div>
          </Card>

          {/* Tiers */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Star className="w-4 h-4" />Paliers de fidélité</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {form.tiers?.map((tier: any, i: number) => {
                const Icon = TIER_ICONS[tier.name] || Award;
                return (
                  <div key={tier.name} className={cn('p-3 rounded-xl border', i === 0 ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700')}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('p-1.5 rounded-lg', TIER_COLORS[tier.name])}><Icon className="w-4 h-4" /></div>
                      <span className="text-xs font-bold uppercase text-gray-900 dark:text-white">{tier.name}</span>
                    </div>
                    <div className="mb-2">
                      <label className="block text-[10px] text-gray-500 mb-0.5">Points requis</label>
                      <input type="number" value={tier.minPoints} onChange={e => {
                        const newTiers = [...form.tiers];
                        newTiers[i] = { ...newTiers[i], minPoints: parseInt(e.target.value) || 0 };
                        setForm((f: any) => ({ ...f, tiers: newTiers }));
                      }} className="w-full p-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Avantages</p>
                      <div className="flex flex-wrap gap-1">
                        {tier.benefits?.map((b: string, j: number) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Rewards */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Gift className="w-4 h-4" />Récompenses disponibles</h3>
            <div className="space-y-2">
              {form.rewards?.map((reward: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input type="text" value={reward.name} onChange={e => {
                      const newRewards = [...form.rewards];
                      newRewards[i] = { ...newRewards[i], name: e.target.value };
                      setForm((f: any) => ({ ...f, rewards: newRewards }));
                    }} className="p-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" placeholder="Nom" />
                    <input type="number" value={reward.pointsCost} onChange={e => {
                      const newRewards = [...form.rewards];
                      newRewards[i] = { ...newRewards[i], pointsCost: parseInt(e.target.value) || 0 };
                      setForm((f: any) => ({ ...f, rewards: newRewards }));
                    }} className="p-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" placeholder="Points" />
                    <select value={reward.type} onChange={e => {
                      const newRewards = [...form.rewards];
                      newRewards[i] = { ...newRewards[i], type: e.target.value };
                      setForm((f: any) => ({ ...f, rewards: newRewards }));
                    }} className="p-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100">
                      <option value="DISCOUNT">Réduction</option>
                      <option value="FREE_ITEM">Produit gratuit</option>
                      <option value="FREE_SHIPPING">Livraison offerte</option>
                    </select>
                  </div>
                  <button onClick={() => setForm((f: any) => ({ ...f, rewards: f.rewards.filter((_: any, j: number) => j !== i) }))}
                    className="p-1.5 text-gray-400 hover:text-red-500"><span className="text-xs">✕</span></button>
                </div>
              ))}
              <button onClick={() => setForm((f: any) => ({ ...f, rewards: [...(f.rewards || []), { name: '', pointsCost: 500, type: 'DISCOUNT' }] }))}
                className="w-full p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
                + Ajouter une récompense
              </button>
            </div>
          </Card>
        </>
      )}

      {/* Client stats preview */}
      {form?.enabled && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800/30">
          <h3 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2"><Users className="w-4 h-4" />Aperçu fidélité</h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Les clients verront leur programme de fidélité sur la page dédiée et cumuleront des points à chaque achat. Les paliers et récompenses sont automatiquement synchronisés.</p>
        </Card>
      )}
    </div>
  );
}
