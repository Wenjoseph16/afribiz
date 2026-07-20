'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  UserCheck,
  DollarSign,
  Activity,
  Loader2,
  AlertCircle,
  Phone,
  Search,
  Eye,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import Link from 'next/link';
import { apiClient } from '@/services/apiClient';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    commissionRate: '5',
    maxTransactionAmount: '100000',
  });
  const [txForm, setTxForm] = useState({ agentId: '', type: 'DEPOSIT', amount: '0', notes: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [aRes, tRes, sRes] = await Promise.all([
        apiClient.getAgents().catch(() => ({ data: { data: [] } })),
        apiClient.getAgentTransactions().catch(() => ({ data: { data: [] } })),
        apiClient.getAgentStats().catch(() => ({
          data: {
            data: { totalAgents: 0, activeAgents: 0, totalTransactions: 0, totalCommissions: 0 },
          },
        })),
      ]);
      setAgents(aRes.data?.data || []);
      setTransactions(tRes.data?.data || []);
      setStats(sRes.data?.data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      await apiClient.createAgent({
        ...newAgent,
        commissionRate: Number(newAgent.commissionRate),
        maxTransactionAmount: Number(newAgent.maxTransactionAmount),
      });
      setShowNew(false);
      setNewAgent({
        name: '',
        phone: '',
        email: '',
        address: '',
        commissionRate: '5',
        maxTransactionAmount: '100000',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteAgent(deleteTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setDeleteTarget(null);
  };

  const handleTransaction = async () => {
    if (!txForm.agentId || !txForm.amount) return;
    try {
      await apiClient.recordAgentTransaction({
        agentId: txForm.agentId,
        type: txForm.type,
        amount: Number(txForm.amount),
        notes: txForm.notes,
      });
      setShowTransaction(false);
      setTxForm({ agentId: '', type: 'DEPOSIT', amount: '0', notes: '' });
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

  const filteredAgents = agents.filter(
    (a: any) =>
      !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search)
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Réseau d'Agents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos agents de dépôt/retrait, commissions et KYC
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransaction(true)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Activity className="w-4 h-4" /> Transaction
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nouvel agent
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Agents total',
              value: String(stats.totalAgents),
              icon: Users,
              color: 'text-blue-500',
              desc: 'Inscrits',
            },
            {
              label: 'Actifs',
              value: String(stats.activeAgents),
              icon: UserCheck,
              color: 'text-green-500',
              desc: 'En service',
            },
            {
              label: 'Transactions',
              value: String(stats.totalTransactions),
              icon: TrendingUp,
              color: 'text-purple-500',
              desc: 'Effectuées',
            },
            {
              label: 'Commissions',
              value: `${Number(stats.totalCommissions).toLocaleString()} FCFA`,
              icon: DollarSign,
              color: 'text-amber-500',
              desc: 'Générées',
            },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm"
          placeholder="Rechercher un agent..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((a: any) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {a.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Phone className="w-3 h-3" /> {a.phone || '—'}
                  </div>
                </div>
              </div>
              <Badge
                variant={
                  a.status === 'ACTIVE'
                    ? 'success'
                    : a.status === 'SUSPENDED'
                      ? 'danger'
                      : 'default'
                }
              >
                {a.status || 'ACTIVE'}
              </Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Commission</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {a.commissionRate || 0}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Solde</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {Number(a.balance || 0).toLocaleString()} FCFA
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/dashboard/agents/${a.id}`}
                className="flex-1 py-1.5 text-center text-sm bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" /> Détails
              </Link>
              <button
                onClick={() => handleDelete(a.id)}
                className="py-1.5 px-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {filteredAgents.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {search ? 'Aucun résultat' : 'Aucun agent'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search
                ? 'Essayez un autre terme de recherche.'
                : 'Créez votre premier agent pour commencer.'}
            </p>
          </Card>
        )}
      </div>

      {/* Modal: Nouvel agent */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvel agent">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom complet
              </label>
              <input
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Amadou Diallo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                value={newAgent.phone}
                onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="+225 0102030405"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux commission (%)
              </label>
              <input
                value={newAgent.commissionRate}
                onChange={(e) => setNewAgent({ ...newAgent, commissionRate: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max transaction
              </label>
              <input
                value={newAgent.maxTransactionAmount}
                onChange={(e) => setNewAgent({ ...newAgent, maxTransactionAmount: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newAgent.name || !newAgent.phone}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Créer
          </button>
        </div>
      </Modal>

      {/* Modal: Transaction */}
      <Modal
        open={showTransaction}
        onClose={() => setShowTransaction(false)}
        title="Enregistrer une transaction"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent
            </label>
            <Select
              value={txForm.agentId}
              onChange={(e) => setTxForm({ ...txForm, agentId: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner...' },
                ...agents.map((a: any) => ({ value: a.id, label: `${a.name} (${a.phone})` })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <Select
                value={txForm.type}
                onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                options={[
                  { value: 'DEPOSIT', label: 'Dépôt' },
                  { value: 'WITHDRAWAL', label: 'Retrait' },
                  { value: 'COMMISSION', label: 'Commission' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant
              </label>
              <input
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleTransaction}
            disabled={!txForm.agentId || !txForm.amount}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Enregistrer
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer l'agent"
        description="Êtes-vous sûr de vouloir supprimer cet agent ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
