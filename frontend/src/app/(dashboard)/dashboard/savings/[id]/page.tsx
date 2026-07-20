'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Wallet,
  Users,
  PiggyBank,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  X,
  Edit,
  Ban,
  RefreshCw,
  DollarSign,
  Handshake,
  Lock,
  Unlock,
  Calendar,
  CreditCard,
  Percent,
  Search,
  UserPlus,
  UserMinus,
  BadgeCheck,
  Loader2,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { apiClient } from '@/services/apiClient';

export default function SavingsGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', email: '' });
  const [startCycleModal, setStartCycleModal] = useState(false);
  const [contributionModal, setContributionModal] = useState(false);
  const [newContribution, setNewContribution] = useState({
    memberId: '',
    amount: 0,
    method: 'CASH',
  });
  const [loanModal, setLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    memberId: '',
    amount: 0,
    interestRate: 0,
    purpose: '',
    durationMonths: 1,
  });
  const [removeMemberTarget, setRemoveMemberTarget] = useState<string | null>(null);
  const [closeCycleTarget, setCloseCycleTarget] = useState<string | null>(null);
  const [payoutCycleTarget, setPayoutCycleTarget] = useState<string | null>(null);
  const [validateModal, setValidateModal] = useState({ open: false, cycleId: '' });
  const [repayModal, setRepayModal] = useState({
    open: false,
    loanId: '',
    memberName: '',
    amount: 0,
  });

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSavingsGroup(groupId);
      setGroup(res.data?.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchGroup();
  }, [groupId]);

  // ─── Actions ───

  const handleAddMember = async () => {
    setActionLoading(true);
    try {
      await apiClient.addSavingsMember({ groupId, ...newMember });
      setAddMemberModal(false);
      setNewMember({ name: '', phone: '', email: '' });
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setRemoveMemberTarget(memberId);
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberTarget) return;
    try {
      await apiClient.removeSavingsMember(removeMemberTarget);
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
    setRemoveMemberTarget(null);
  };

  const handleStartCycle = async () => {
    setActionLoading(true);
    try {
      await apiClient.startSavingsCycle(groupId);
      setStartCycleModal(false);
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseCycle = (cycleId: string) => {
    setCloseCycleTarget(cycleId);
  };

  const confirmCloseCycle = async () => {
    if (!closeCycleTarget) return;
    setActionLoading(true);
    try {
      await apiClient.closeSavingsCycle(closeCycleTarget);
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
      setCloseCycleTarget(null);
    }
  };

  const handleValidateCycle = async () => {
    setActionLoading(true);
    try {
      await apiClient.validateSavingsCycle(validateModal.cycleId);
      setValidateModal({ open: false, cycleId: '' });
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const [contribCycleId, setContribCycleId] = useState('');

  const handleRecordContribution = async () => {
    setActionLoading(true);
    try {
      await apiClient.recordContribution({
        cycleId: contribCycleId || group?.cycles?.find((c: any) => c.status === 'ACTIVE')?.id || '',
        memberId: newContribution.memberId,
        amount: newContribution.amount,
        method: newContribution.method,
      });
      setContributionModal(false);
      setNewContribution({ memberId: '', amount: 0, method: 'CASH' });
      setContribCycleId('');
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateLoan = async () => {
    setActionLoading(true);
    try {
      await apiClient.createSavingsLoan({ groupId, ...newLoan });
      setLoanModal(false);
      setNewLoan({ memberId: '', amount: 0, interestRate: 0, purpose: '', durationMonths: 1 });
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      await apiClient.approveSavingsLoan(loanId);
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    }
  };

  const handleRepayLoan = async () => {
    setActionLoading(true);
    try {
      await apiClient.repaySavingsLoan(repayModal.loanId, repayModal.amount);
      setRepayModal({ open: false, loanId: '', memberName: '', amount: 0 });
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessPayout = (cycleId: string) => {
    setPayoutCycleTarget(cycleId);
  };

  const confirmProcessPayout = async () => {
    if (!payoutCycleTarget) return;
    setActionLoading(true);
    try {
      await apiClient.processCyclePayout(payoutCycleTarget);
      fetchGroup();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
      setPayoutCycleTarget(null);
    }
  };

  const typeLabel = (t: string) =>
    ({
      ROTATING: 'Rotative',
      FIXED_CONTRIBUTION: 'Cotisation fixe',
      FREE: 'Libre',
      INVESTMENT: 'Investissement',
    })[t] || t;
  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return m[s] || 'bg-gray-100 text-gray-700';
  };
  const scoreLevel = (s: number) =>
    s >= 80
      ? 'text-green-600'
      : s >= 60
        ? 'text-blue-600'
        : s >= 40
          ? 'text-amber-600'
          : 'text-red-600';

  if (loading)
    return (
      <div className="space-y-4 p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Erreur</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/savings')}
            className="text-brand-500 hover:underline"
          >
            Retour à la liste
          </button>
        </Card>
      </div>
    );
  if (!group) return null;

  return (
    <div className="space-y-6 pb-8">
      {/* Back + Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/savings')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(group.status)}`}
              >
                {group.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {typeLabel(group.type)} ·{' '}
              {group.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'} · {group.currency}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGroup}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-brand-500 mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {group.members?.filter((m: any) => m.isActive).length || 0}
          </p>
          <p className="text-xs text-gray-500">Membres</p>
        </Card>
        <Card className="p-4 text-center">
          <RefreshCw className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {group.cycles?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Cycles</p>
        </Card>
        <Card className="p-4 text-center">
          <PiggyBank className="w-5 h-5 mx-auto text-green-500 mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {group.contributionAmount?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500">{group.currency}/cycle</p>
        </Card>
        <Card className="p-4 text-center">
          <Shield className="w-5 h-5 mx-auto text-purple-500 mb-1" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {group.escrows?.filter((e: any) => e.status === 'HELD').length || 0}
          </p>
          <p className="text-xs text-gray-500">Escrows actifs</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {[
          { key: 'overview', label: 'Aperçu', icon: Wallet },
          { key: 'members', label: 'Membres', icon: Users },
          { key: 'cycles', label: 'Cycles', icon: RefreshCw },
          { key: 'loans', label: 'Prêts', icon: TrendingUp },
          { key: 'escrows', label: 'Escrows', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ OVERVIEW ═══════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card title="Actions rapides" className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setAddMemberModal(true)}
                className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-center"
              >
                <UserPlus className="w-5 h-5 mx-auto text-brand-500 mb-1" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Ajouter membre
                </span>
              </button>
              <button
                onClick={() => setStartCycleModal(true)}
                disabled={group.status !== 'ACTIVE'}
                className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Calendar className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Nouveau cycle
                </span>
              </button>
              <button
                onClick={() => setLoanModal(true)}
                disabled={group.status !== 'ACTIVE'}
                className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <DollarSign className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Nouveau prêt
                </span>
              </button>
              <button
                onClick={() => setContributionModal(true)}
                disabled={!group.cycles?.some((c: any) => c.status === 'ACTIVE')}
                className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all text-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PiggyBank className="w-5 h-5 mx-auto text-green-500 mb-1" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Enregistrer cotisation
                </span>
              </button>
            </div>
          </Card>

          {/* Derniers cycles */}
          <Card title="Cycles récents" className="p-5">
            {group.cycles?.slice(0, 5).map((cycle: any) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Cycle #{cycle.cycleNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cycle.status === 'COMPLETED' ? 'Terminé' : 'Actif'} ·{' '}
                    {new Date(cycle.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(cycle.status)}`}>
                    {cycle.status}
                  </span>
                  {cycle.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCloseCycle(cycle.id)}
                      disabled={actionLoading}
                      className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                    >
                      Clôturer
                    </button>
                  )}
                </div>
              </div>
            )) || <p className="text-sm text-gray-500 py-2">Aucun cycle</p>}
          </Card>

          {/* Prêts en cours */}
          <Card title="Prêts en cours" className="p-5">
            {group.loans?.slice(0, 5).map((loan: any) => (
              <div
                key={loan.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {loan.member?.name || 'Membre'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {loan.status} · {Number(loan.amount).toLocaleString()} FCFA
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
            )) || <p className="text-sm text-gray-500 py-2">Aucun prêt</p>}
          </Card>

          {/* Sécurité */}
          {group.escrows && group.escrows.length > 0 && (
            <Card title="Escrows" className="p-5">
              {group.escrows.slice(0, 5).map((escrow: any) => (
                <div
                  key={escrow.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {escrow.status === 'HELD' ? (
                      <Lock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {Number(escrow.amount).toLocaleString()} {escrow.currency}
                      </p>
                      <p className="text-xs text-gray-500">
                        Frais: {Number(escrow.fee).toLocaleString()} · Net:{' '}
                        {Number(escrow.netAmount || escrow.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(escrow.status)}`}
                  >
                    {escrow.status}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ═══════ MEMBERS ═══════ */}
      {activeTab === 'members' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Membres ({group.members?.filter((m: any) => m.isActive).length || 0})
            </h3>
            <button
              onClick={() => setAddMemberModal(true)}
              className="text-sm px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {group.members?.map((member: any) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {member.name}
                      </p>
                      {member.role === 'admin' && <BadgeCheck className="w-4 h-4 text-brand-500" />}
                      <span
                        className={`text-xs font-semibold ${scoreLevel(member.reliabilityScore || 50)}`}
                      >
                        {member.reliabilityScore || 50}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {member.phone || 'Pas de téléphone'} · Cotisé:{' '}
                      {Number(member.totalContributed || 0).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {member.role !== 'admin' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      title="Retirer"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )) || <p className="p-4 text-sm text-gray-500 text-center">Aucun membre</p>}
          </div>
        </Card>
      )}

      {/* ═══════ CYCLES ═══════ */}
      {activeTab === 'cycles' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setStartCycleModal(true)}
              disabled={group.status !== 'ACTIVE'}
              className="text-sm px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Calendar className="w-3.5 h-3.5" /> Nouveau cycle
            </button>
          </div>
          {group.cycles?.map((cycle: any) => {
            const hasEscrow = group.escrows?.some((e: any) => e.savingsCycleId === cycle.id);
            const escrow = group.escrows?.find((e: any) => e.savingsCycleId === cycle.id);
            return (
              <Card key={cycle.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Cycle #{cycle.cycleNumber}
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(cycle.status)}`}
                      >
                        {cycle.status === 'ACTIVE' ? 'En cours' : 'Terminé'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Début: {new Date(cycle.startDate).toLocaleDateString()}
                    </p>
                    {cycle.totalAmount > 0 && (
                      <p className="text-xs text-gray-500">
                        Total: {Number(cycle.totalAmount).toLocaleString()} FCFA
                      </p>
                    )}
                    {cycle.releaseAt && cycle.status === 'COMPLETED' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        Libération: {new Date(cycle.releaseAt).toLocaleDateString()}{' '}
                        {new Date(cycle.releaseAt) > new Date()
                          ? `(${Math.round((new Date(cycle.releaseAt).getTime() - Date.now()) / (1000 * 60 * 60))}h restantes)`
                          : '✅ Disponible'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cycle.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCloseCycle(cycle.id)}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" /> Clôturer
                      </button>
                    )}
                    {cycle.status === 'COMPLETED' && escrow?.status === 'HELD' && (
                      <>
                        <button
                          onClick={() => setValidateModal({ open: true, cycleId: cycle.id })}
                          className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Valider
                        </button>
                        <button
                          onClick={() => handleProcessPayout(cycle.id)}
                          disabled={actionLoading}
                          className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Payer
                        </button>
                      </>
                    )}
                    {hasEscrow && (
                      <Shield
                        className={`w-4 h-4 ${escrow?.status === 'HELD' ? 'text-amber-500' : 'text-green-500'}`}
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          }) || (
            <Card className="p-8 text-center">
              <p className="text-sm text-gray-500">Aucun cycle</p>
            </Card>
          )}
        </div>
      )}

      {/* ═══════ LOANS ═══════ */}
      {activeTab === 'loans' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setLoanModal(true)}
              disabled={group.status !== 'ACTIVE'}
              className="text-sm px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 flex items-center gap-1.5 disabled:opacity-40"
            >
              <DollarSign className="w-3.5 h-3.5" /> Nouveau prêt
            </button>
          </div>
          {group.loans?.map((loan: any) => (
            <Card key={loan.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {loan.member?.name || 'Membre'}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(loan.status)}`}
                    >
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {Number(loan.amount).toLocaleString()} FCFA · Taux: {Number(loan.interestRate)}%
                    · Total à rembourser: {Number(loan.totalRepay).toLocaleString()} FCFA
                  </p>
                  {loan.purpose && (
                    <p className="text-xs text-gray-400 mt-0.5">Motif: {loan.purpose}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {loan.status === 'PENDING' && (
                    <button
                      onClick={() => handleApproveLoan(loan.id)}
                      className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Approuver
                    </button>
                  )}
                  {loan.status === 'ACTIVE' && (
                    <button
                      onClick={() =>
                        setRepayModal({
                          open: true,
                          loanId: loan.id,
                          memberName: loan.member?.name || 'Membre',
                          amount: 0,
                        })
                      }
                      className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Rembourser
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )) || (
            <Card className="p-8 text-center">
              <p className="text-sm text-gray-500">Aucun prêt</p>
            </Card>
          )}
        </div>
      )}

      {/* ═══════ ESCROWS ═══════ */}
      {activeTab === 'escrows' && (
        <div className="space-y-3">
          {group.escrows?.map((escrow: any) => (
            <Card key={escrow.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {escrow.status === 'HELD' ? (
                    <Lock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Unlock className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {Number(escrow.amount).toLocaleString()} FCFA
                      </h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(escrow.status)}`}
                      >
                        {escrow.status === 'HELD' ? 'Séquestré' : 'Libéré'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Frais: {Number(escrow.fee).toLocaleString()} FCFA · Net:{' '}
                      {Number(escrow.netAmount || escrow.amount).toLocaleString()} FCFA
                      {escrow.releasedAt &&
                        ` · Libéré le ${new Date(escrow.releasedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )) || (
            <Card className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                Aucun escrow. Les escrows sont créés automatiquement à la clôture d&apos;un cycle.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ═══════ MODALS ═══════ */}

      {/* Add Member */}
      <Modal
        open={addMemberModal}
        onClose={() => setAddMemberModal(false)}
        title="Ajouter un membre"
        size="sm"
      >
        <div className="space-y-3">
          <input
            value={newMember.name}
            onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nom du membre"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            value={newMember.phone}
            onChange={(e) => setNewMember((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Téléphone (optionnel)"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            value={newMember.email}
            onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email (optionnel)"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={handleAddMember}
            disabled={actionLoading || !newMember.name}
            className="w-full py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Start Cycle */}
      <Modal
        open={startCycleModal}
        onClose={() => setStartCycleModal(false)}
        title="Démarrer un nouveau cycle"
        description="Un nouveau cycle de cotisation va être créé. Tous les membres actifs pourront cotiser."
        size="sm"
      >
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setStartCycleModal(false)}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleStartCycle}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-brand-500 text-white rounded-xl hover:bg-brand-600 flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Démarrer
          </button>
        </div>
      </Modal>

      {/* Validate Cycle */}
      <Modal
        open={validateModal.open}
        onClose={() => setValidateModal({ open: false, cycleId: '' })}
        title="Valider la clôture du cycle"
        description="Confirmez que vous approuvez la clôture de ce cycle. Si la double validation est requise, un second validateur est nécessaire."
        size="sm"
      >
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setValidateModal({ open: false, cycleId: '' })}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleValidateCycle}
            disabled={actionLoading}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Valider
          </button>
        </div>
      </Modal>

      {/* Record Contribution */}
      <Modal
        open={contributionModal}
        onClose={() => setContributionModal(false)}
        title="Enregistrer une cotisation"
        size="sm"
      >
        <div className="space-y-3">
          <select
            value={contribCycleId}
            onChange={(e) => setContribCycleId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          >
            <option value="">Choisir un cycle</option>
            {group.cycles
              ?.filter((c: any) => c.status === 'ACTIVE')
              .map((c: any) => (
                <option key={c.id} value={c.id}>
                  Cycle #{c.cycleNumber} ({new Date(c.startDate).toLocaleDateString()})
                </option>
              ))}
          </select>
          <select
            value={newContribution.memberId}
            onChange={(e) => setNewContribution((p) => ({ ...p, memberId: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          >
            <option value="">Sélectionner un membre</option>
            {group.members
              ?.filter((m: any) => m.isActive)
              .map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} (score: {m.reliabilityScore || 50})
                </option>
              ))}
          </select>
          <div className="relative">
            <input
              type="number"
              value={newContribution.amount || ''}
              onChange={(e) =>
                setNewContribution((p) => ({ ...p, amount: Number(e.target.value) }))
              }
              placeholder="Montant"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {group.currency}
            </span>
          </div>
          <select
            value={newContribution.method}
            onChange={(e) => setNewContribution((p) => ({ ...p, method: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          >
            <option value="CASH">Espèces</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK_TRANSFER">Virement</option>
            <option value="ESCROW">Escrow</option>
          </select>
          <button
            onClick={handleRecordContribution}
            disabled={
              actionLoading ||
              !contribCycleId ||
              !newContribution.memberId ||
              !newContribution.amount
            }
            className="w-full py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
          </button>
        </div>
      </Modal>

      {/* New Loan */}
      <Modal
        open={loanModal}
        onClose={() => setLoanModal(false)}
        title="Accorder un prêt"
        size="sm"
      >
        <div className="space-y-3">
          <select
            value={newLoan.memberId}
            onChange={(e) => setNewLoan((p) => ({ ...p, memberId: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          >
            <option value="">Sélectionner un membre</option>
            {group.members
              ?.filter((m: any) => m.isActive && m.role !== 'admin')
              .map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} (score: {m.reliabilityScore || 50})
                </option>
              ))}
          </select>
          <input
            type="number"
            value={newLoan.amount || ''}
            onChange={(e) => setNewLoan((p) => ({ ...p, amount: Number(e.target.value) }))}
            placeholder="Montant du prêt"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          />
          <input
            type="number"
            value={newLoan.interestRate || ''}
            onChange={(e) => setNewLoan((p) => ({ ...p, interestRate: Number(e.target.value) }))}
            placeholder="Taux d'intérêt (%)"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          />
          <input
            type="number"
            value={newLoan.durationMonths || ''}
            onChange={(e) => setNewLoan((p) => ({ ...p, durationMonths: Number(e.target.value) }))}
            placeholder="Durée (mois)"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          />
          <input
            value={newLoan.purpose}
            onChange={(e) => setNewLoan((p) => ({ ...p, purpose: e.target.value }))}
            placeholder="Motif du prêt"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          />
          <button
            onClick={handleCreateLoan}
            disabled={actionLoading || !newLoan.memberId || !newLoan.amount}
            className="w-full py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Accorder le prêt
          </button>
        </div>
      </Modal>

      {/* Repay Loan */}
      <Modal
        open={repayModal.open}
        onClose={() => setRepayModal({ open: false, loanId: '', memberName: '', amount: 0 })}
        title={`Remboursement - ${repayModal.memberName}`}
        size="sm"
      >
        <div className="space-y-3">
          <input
            type="number"
            value={repayModal.amount || ''}
            onChange={(e) => setRepayModal((p) => ({ ...p, amount: Number(e.target.value) }))}
            placeholder="Montant du remboursement"
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 outline-none"
          />
          <button
            onClick={handleRepayLoan}
            disabled={actionLoading || !repayModal.amount}
            className="w-full py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Rembourser
          </button>
        </div>
      </Modal>
      <ConfirmationModal
        open={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        onConfirm={confirmRemoveMember}
        title="Retirer ce membre ?"
        description="Le membre sera retiré du groupe d'épargne."
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        variant="warning"
        icon={<AlertTriangle className="h-7 w-7" />}
      />
      <ConfirmationModal
        open={!!closeCycleTarget}
        onClose={() => setCloseCycleTarget(null)}
        onConfirm={confirmCloseCycle}
        title="Clôturer ce cycle ?"
        description="Les cotisations seront bloquées dans un escrow avec délai de rétractation."
        confirmLabel="Clôturer"
        cancelLabel="Annuler"
        variant="warning"
        icon={<Lock className="h-7 w-7" />}
      />
      <ConfirmationModal
        open={!!payoutCycleTarget}
        onClose={() => setPayoutCycleTarget(null)}
        onConfirm={confirmProcessPayout}
        title="Déclencher le paiement ?"
        description="Vérifiez que le délai de rétractation est écoulé avant de procéder."
        confirmLabel="Payer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}
