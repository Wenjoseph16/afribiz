'use client';

import { useState } from 'react';
import {
  Beaker, Play, CheckCircle2, XCircle, Clock, Code, Database,
  Globe, Webhook, Activity, RefreshCw, Terminal,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules } from '@/features/developerHooks';
import { useSimulationEnvironments, useTestEndpoint, useSimulationEndpoints, useSimulationMockData } from '@/features/simulationHooks';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  POST: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  PUT: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  DELETE: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  PATCH: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
};

const MOCK_DATA_TYPES = [
  { key: 'businesses', label: 'Entreprises', icon: Globe },
  { key: 'users', label: 'Utilisateurs', icon: Database },
  { key: 'orders', label: 'Commandes', icon: Activity },
  { key: 'payments', label: 'Paiements', icon: Terminal },
];

export default function SimulationPage() {
  const [activeTab, setActiveTab] = useState('sandbox');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedDataType, setSelectedDataType] = useState('businesses');

  const { data: modules, isLoading: modulesLoading, error: modulesError } = useDeveloperModules();
  const { data: environments } = useSimulationEnvironments();
  const { data: endpoints } = useSimulationEndpoints();
  const { data: mockData } = useSimulationMockData(selectedModule, selectedDataType);
  const testMutation = useTestEndpoint();

  const selectedModuleData = environments?.find((e: any) => e.slug === selectedModule);

  const handleTest = async () => {
    if (!selectedModule || !selectedEndpoint) return;
    let body: any = undefined;
    try {
      body = requestBody ? JSON.parse(requestBody) : undefined;
    } catch (e) { console.error(e); }
    try {
      const res = await testMutation.mutateAsync({
        moduleSlug: selectedModule,
        data: { endpoint: selectedEndpoint, method: selectedMethod, body },
      });
      setTestResult(res.data.data);
    } catch (err: any) {
      setTestResult({ statusCode: 500, response: { success: false, error: err.message }, latency: 0 });
    }
  };

  if (modulesLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (modulesError) return <ErrorState message={(modulesError as any).message} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Simulation"
        description="Testez vos modules en environnement sandbox avant de les publier"
        breadcrumbs={[{ label: 'Simulation' }]}
      />

      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1.5 overflow-x-auto">
        {[
          { key: 'sandbox', label: 'Sandbox', icon: Beaker },
          { key: 'endpoints', label: 'Endpoints', icon: Code },
          { key: 'mock', label: 'Données fictives', icon: Database },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sandbox' && (
        <>
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tester un endpoint</h3>
              <Badge variant="purple" size="sm">Environnement sandbox</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-indigo/20 focus:border-indigo outline-none"
                >
                  <option value="">Sélectionner un module</option>
                  {(modules || []).map((m: any) => (
                    <option key={m.id} value={m.slug}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Endpoint</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-indigo/20 focus:border-indigo outline-none"
                >
                  <option value="">Sélectionner un endpoint</option>
                  {(endpoints || []).map((ep: any) => (
                    <option key={ep.path} value={ep.path}>{ep.method} {ep.path}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Méthode HTTP</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-indigo/20 focus:border-indigo outline-none"
                >
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedEndpoint && (selectedMethod === 'POST' || selectedMethod === 'PUT' || selectedMethod === 'PATCH') && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Corps de la requête (JSON)</label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo/20 focus:border-indigo outline-none"
                />
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleTest}
              isLoading={testMutation.isPending}
              disabled={!selectedModule || !selectedEndpoint}
            >
              <Play className="h-4 w-4" />
              Exécuter le test
            </Button>
          </Card>

          {testResult && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Résultat</h3>
                <div className="flex items-center gap-3">
                  <Badge variant={testResult.statusCode < 400 ? 'success' : 'danger'} size="sm">
                    {testResult.statusCode}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {testResult.latency}ms
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {!selectedModule && (
            <EmptyState
              icon={<Beaker className="h-12 w-12" />}
              title="Sélectionnez un module"
              description="Choisissez un module et un endpoint pour commencer les tests en environnement sandbox"
            />
          )}
        </>
      )}

      {activeTab === 'endpoints' && (
        <div className="space-y-3">
          {(endpoints || []).map((ep: any) => (
            <Card key={ep.path} className="p-5">
              <div className="flex items-start gap-4">
                <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold font-mono', METHOD_COLORS[ep.method] || METHOD_COLORS.GET)}>
                  {ep.method}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">{ep.path}</code>
                  <p className="text-xs text-gray-500 mt-1">{ep.description}</p>
                  {ep.params && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(ep.params).map(([key, val]) => (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                          {key}: {val as string}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="xs" variant="ghost" onClick={() => { setSelectedEndpoint(ep.path); setSelectedMethod(ep.method); setActiveTab('sandbox'); }}>
                  Tester
                </Button>
              </div>
            </Card>
          ))}
          {(!endpoints || endpoints.length === 0) && (
            <EmptyState icon={<Code className="h-12 w-12" />} title="Aucun endpoint" description="Créez d'abord un module pour voir les endpoints disponibles" />
          )}
        </div>
      )}

      {activeTab === 'mock' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-indigo/20 focus:border-indigo outline-none"
            >
              <option value="">Sélectionner un module</option>
              {(modules || []).map((m: any) => (
                <option key={m.id} value={m.slug}>{m.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {MOCK_DATA_TYPES.map((dt) => (
                <button
                  key={dt.key}
                  onClick={() => setSelectedDataType(dt.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                    selectedDataType === dt.key
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <dt.icon className="h-3.5 w-3.5" />
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {selectedModule && mockData && mockData.length > 0 ? (
            <Card className="p-5">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(mockData, null, 2)}
                </pre>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {mockData.length} entrée{mockData.length > 1 ? 's' : ''} générée{mockData.length > 1 ? 's' : ''}
              </div>
            </Card>
          ) : selectedModule ? (
            <EmptyState icon={<Database className="h-12 w-12" />} title="Aucune donnée" description="Sélectionnez un type de données pour voir les données fictives" />
          ) : (
            <EmptyState icon={<Database className="h-12 w-12" />} title="Sélectionnez un module" description="Choisissez un module pour voir les données de test" />
          )}
        </div>
      )}
    </div>
  );
}
