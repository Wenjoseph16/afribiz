'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Globe,
  Percent,
  BarChart3,
  Loader2,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

export default function TaxesPage() {
  const [activeTab, setActiveTab] = useState<'countries' | 'config' | 'reports'>('countries');
  const [countries, setCountries] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewCountry, setShowNewCountry] = useState(false);
  const [showNewReport, setShowNewReport] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [newCountry, setNewCountry] = useState({
    countryCode: '',
    countryName: '',
    taxRate: '18',
    currency: 'FCFA',
    taxName: 'TVA',
  });
  const [newReport, setNewReport] = useState({
    periodStart: '',
    periodEnd: '',
    totalRevenue: '0',
    totalTax: '0',
    countryCode: '',
  });
  const [configForm, setConfigForm] = useState({
    countryCode: '',
    taxRate: '18',
    taxId: '',
    exempt: false,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, cfgRes, rRes] = await Promise.all([
        apiClient.getCountryTaxes().catch(() => ({ data: { data: [] } })),
        apiClient.getBusinessTaxConfig().catch(() => ({ data: { data: null } })),
        apiClient.getTaxReports().catch(() => ({ data: { data: [] } })),
      ]);
      setCountries(cRes.data?.data || []);
      setConfig(cfgRes.data?.data);
      setReports(rRes.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCountry = async () => {
    try {
      await apiClient.createCountryTax({ ...newCountry, taxRate: Number(newCountry.taxRate) });
      setShowNewCountry(false);
      setNewCountry({
        countryCode: '',
        countryName: '',
        taxRate: '18',
        currency: 'FCFA',
        taxName: 'TVA',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await apiClient.updateBusinessTaxConfig({
        ...configForm,
        taxRate: Number(configForm.taxRate),
      });
      setShowConfig(false);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleNewReport = async () => {
    try {
      await apiClient.generateTaxReport({
        ...newReport,
        totalRevenue: Number(newReport.totalRevenue),
        totalTax: Number(newReport.totalTax),
      });
      setShowNewReport(false);
      setNewReport({
        periodStart: '',
        periodEnd: '',
        totalRevenue: '0',
        totalTax: '0',
        countryCode: '',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  const tabs = [
    { key: 'countries' as const, label: 'Pays', icon: Globe },
    { key: 'config' as const, label: 'Ma config', icon: Percent },
    { key: 'reports' as const, label: 'Rapports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Taxes Multi-Pays (ZLECAF)"
        description="Gérez la TVA et les taxes par pays africain, factures conformes et rapports fiscaux"
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Taxes ZLECAF' }]}
        actions={
          <div className="flex gap-2">
            {activeTab === 'countries' && (
              <button
                onClick={() => setShowNewCountry(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Ajouter un pays
              </button>
            )}
            {activeTab === 'config' && (
              <button
                onClick={() => {
                  setConfigForm(
                    config
                      ? {
                          countryCode: config.countryCode,
                          taxRate: String(config.taxRate),
                          taxId: config.taxId || '',
                          exempt: config.exempt || false,
                        }
                      : { countryCode: '', taxRate: '18', taxId: '', exempt: false }
                  );
                  setShowConfig(true);
                }}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
              >
                <Edit2 className="w-4 h-4 inline mr-1" /> Configurer
              </button>
            )}
            {activeTab === 'reports' && (
              <button
                onClick={() => setShowNewReport(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Nouveau rapport
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.key ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'countries' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((c: any) => (
            <Card key={c.countryCode} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {c.countryName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{c.countryCode}</p>
                </div>
                <Badge variant={c.isDefault ? 'success' : 'default'}>
                  {c.isDefault ? 'Défaut' : c.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{c.taxName || 'TVA'}</p>
                  <p className="text-lg font-bold text-brand-600">{c.taxRate}%</p>
                </div>
                <p className="text-sm text-gray-400">{c.currency || 'FCFA'}</p>
              </div>
            </Card>
          ))}
          {countries.length === 0 && (
            <Card className="p-8 text-center col-span-full">
              <Globe className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucun pays configuré
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajoutez des configurations fiscales par pays pour la facturation ZLECAF.
              </p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <Card className="p-6">
          {config ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Configuration fiscale
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-gray-500">Pays</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {config.country?.countryName || config.countryCode}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-gray-500">Taux</p>
                  <p className="text-lg font-semibold text-brand-600">{config.taxRate}%</p>
                </div>
              </div>
              {config.taxId && (
                <p className="text-sm text-gray-500">
                  N° fiscal :{' '}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {config.taxId}
                  </span>
                </p>
              )}
              {config.exempt && <Badge variant="success">Exonéré</Badge>}
            </div>
          ) : (
            <div className="text-center py-8">
              <Percent className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Configuration requise
              </h3>
              <p className="text-sm text-gray-500">
                Configurez votre pays et taux de TVA pour générer des factures conformes.
              </p>
              <button
                onClick={() => {
                  setConfigForm({ countryCode: '', taxRate: '18', taxId: '', exempt: false });
                  setShowConfig(true);
                }}
                className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
              >
                Configurer
              </button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <Card key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {r.countryCode} · {new Date(r.periodStart).toLocaleDateString()} →{' '}
                    {new Date(r.periodEnd).toLocaleDateString()}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  CA: {Number(r.totalRevenue).toLocaleString()} FCFA · Taxe:{' '}
                  {Number(r.totalTax).toLocaleString()} FCFA
                </p>
              </div>
              <Badge>{new Date(r.createdAt).toLocaleDateString()}</Badge>
            </Card>
          ))}
          {reports.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucun rapport
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Générez vos premiers rapports fiscaux.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Modal: Nouveau pays */}
      <Modal open={showNewCountry} onClose={() => setShowNewCountry(false)} title="Ajouter un pays">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code pays
              </label>
              <input
                value={newCountry.countryCode}
                onChange={(e) => setNewCountry({ ...newCountry, countryCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="CI"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                value={newCountry.countryName}
                onChange={(e) => setNewCountry({ ...newCountry, countryName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Côte d'Ivoire"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux TVA (%)
              </label>
              <input
                value={newCountry.taxRate}
                onChange={(e) => setNewCountry({ ...newCountry, taxRate: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monnaie
              </label>
              <Select
                value={newCountry.currency}
                onChange={(e) => setNewCountry({ ...newCountry, currency: e.target.value })}
                options={[
                  { value: 'FCFA', label: 'FCFA' },
                  { value: 'GNF', label: 'GNF (Guinée)' },
                  { value: 'MGA', label: 'MGA (Madagascar)' },
                  { value: 'CDF', label: 'CDF (RDC)' },
                ]}
              />
            </div>
          </div>
          <button
            onClick={handleAddCountry}
            disabled={!newCountry.countryCode || !newCountry.countryName}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Modal: Config business */}
      <Modal open={showConfig} onClose={() => setShowConfig(false)} title="Configuration fiscale">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pays
            </label>
            <Select
              value={configForm.countryCode}
              onChange={(e) => setConfigForm({ ...configForm, countryCode: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner...' },
                ...countries.map((c: any) => ({
                  value: c.countryCode,
                  label: `${c.countryName} (${c.taxRate}%)`,
                })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux (%)
              </label>
              <input
                value={configForm.taxRate}
                onChange={(e) => setConfigForm({ ...configForm, taxRate: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                N° fiscal
              </label>
              <input
                value={configForm.taxId}
                onChange={(e) => setConfigForm({ ...configForm, taxId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Optionnel"
              />
            </div>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={!configForm.countryCode}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Enregistrer
          </button>
        </div>
      </Modal>

      {/* Modal: Nouveau rapport */}
      <Modal
        open={showNewReport}
        onClose={() => setShowNewReport(false)}
        title="Générer un rapport fiscal"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Début période
              </label>
              <input
                value={newReport.periodStart}
                onChange={(e) => setNewReport({ ...newReport, periodStart: e.target.value })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fin période
              </label>
              <input
                value={newReport.periodEnd}
                onChange={(e) => setNewReport({ ...newReport, periodEnd: e.target.value })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CA total (FCFA)
              </label>
              <input
                value={newReport.totalRevenue}
                onChange={(e) => setNewReport({ ...newReport, totalRevenue: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taxe totale (FCFA)
              </label>
              <input
                value={newReport.totalTax}
                onChange={(e) => setNewReport({ ...newReport, totalTax: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleNewReport}
            disabled={!newReport.periodStart || !newReport.periodEnd}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Générer
          </button>
        </div>
      </Modal>
    </div>
  );
}
