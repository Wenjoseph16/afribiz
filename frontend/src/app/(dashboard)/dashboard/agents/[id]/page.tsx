'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Phone,
  Mail,
  DollarSign,
  Loader2,
  AlertCircle,
  TrendingUp,
  Wallet,
  FileText,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.getAgent(params.id as string);
      setAgent(res.data?.data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  if (!agent) return null;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={agent.name || 'Agent'}
        description={`${agent.phone || '—'}${agent.email ? ` · ${agent.email}` : ''}${agent.address ? ` · ${agent.address}` : ''}`}
        badge={
          agent.status === 'ACTIVE'
            ? { label: agent.status || 'ACTIF', className: 'bg-green-500/10 text-green-600' }
            : { label: agent.status || 'ACTIF', className: 'bg-gray-500/10 text-gray-500' }
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Agents', href: '/dashboard/agents' },
          { label: agent.name || 'Agent' },
        ]}
      />

      <Card className="p-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Wallet className="w-5 h-5 mx-auto text-brand-500 mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {Number(agent.balance || 0).toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-500">Solde</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {agent.commissionRate || 0}%
            </p>
            <p className="text-xs text-gray-500">Commission</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <DollarSign className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {Number(agent.maxTransactionAmount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Max transaction</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Transactions ({agent.transactions?.length || 0})
          </h3>
        </div>
        {agent.transactions?.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {agent.transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity
                    className={`w-4 h-4 ${tx.type === 'DEPOSIT' ? 'text-green-500' : tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-amber-500'}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tx.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}{' '}
                      {tx.notes ? `· ${tx.notes}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {tx.type === 'DEPOSIT' ? '+' : '-'}
                  {Number(tx.amount).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">Aucune transaction</div>
        )}
      </Card>

      {agent.kycDocuments?.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Documents KYC</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {agent.kycDocuments.map((doc: any) => (
              <div key={doc.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {doc.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <Badge variant={doc.verified ? 'success' : 'warning'}>
                  {doc.verified ? 'Vérifié' : 'En attente'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
