'use client';

import { useEffect, useState } from 'react';
import { Truck, Store, Gift, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { MoneyInput } from '@/components/formkit';
import { apiClient } from '@/services/apiClient';
import { useNotifyError } from '@/hooks/useNotifyError';

interface Settings {
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  minDeliveryAmount: number | null;
}

export default function DeliverySettingsPage() {
  const notifyError = useNotifyError();
  const [settings, setSettings] = useState<Settings>({
    deliveryEnabled: true,
    pickupEnabled: true,
    minDeliveryAmount: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient
      .getDeliverySettings()
      .then((res) => {
        const d = res.data.data;
        if (d) setSettings({ ...settings, ...d });
      })
      .catch(() => notifyError('Impossible de charger les réglages'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiClient.updateDeliverySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      notifyError(err, 'Erreur', 'Impossible de sauvegarder les réglages');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Livraison & Retrait"
        description="Décidez comment vos clients reçoivent leurs commandes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Livraisons', href: '/dashboard/deliveries' },
          { label: 'Réglages' },
        ]}
        actions={
          <Button onClick={handleSave} isLoading={saving}>
            {saved ? (
              <>
                <Save className="w-4 h-4" /> Enregistré !
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Enregistrer
              </>
            )}
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
        </div>
      ) : (
        <>
          {/* Livraison */}
          <Card padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Livraison à domicile
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Vos clients choisiront un quartier (zone) et payeront le frais que vous avez
                    défini. Définissez vos zones et livreurs dans la page{' '}
                    <a href="/dashboard/deliveries/zones" className="text-brand hover:underline">
                      Zones de livraison
                    </a>
                    .
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryEnabled}
                onChange={(v) => setSettings({ ...settings, deliveryEnabled: v })}
              />
            </div>

            {settings.deliveryEnabled && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <MoneyInput
                  label="Livraison offerte à partir de"
                  hint="Optionnel"
                  help="Au-dessus de ce montant, vos clients ne paient pas les frais de livraison."
                  value={settings.minDeliveryAmount ?? undefined}
                  onChange={(v) => setSettings({ ...settings, minDeliveryAmount: v || null })}
                />
              </div>
            )}
          </Card>

          {/* Retrait */}
          <Card padding="lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Retrait en boutique
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Vos clients viennent chercher leur commande à votre adresse. Pensez à renseigner
                    votre adresse dans les réglages de votre entreprise pour qu'elle s'affiche au
                    moment du retrait.
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.pickupEnabled}
                onChange={(v) => setSettings({ ...settings, pickupEnabled: v })}
              />
            </div>
          </Card>

          {/* Info bonus */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <Gift className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Checkout intelligent :</strong> si les deux sont activés, vos clients
              choisissent eux-mêmes entre <strong>Livraison</strong> et <strong>Retrait</strong> au
              moment de commander. Le frais de livraison est calculé automatiquement selon le
              quartier choisi.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
