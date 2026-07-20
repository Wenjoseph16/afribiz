'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  MapPin,
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  Hammer,
  Package,
  ListChecks,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useOpenDemands } from '@/hooks/useDemands';
import { applyToDemand } from '@/services/api/demands';
import { useDeveloperModules } from '@/features/developerHooks';
import type { ModuleDemandStatus, ProposalType } from '@afribiz/shared';

const statusLabels: Record<ModuleDemandStatus, string> = {
  OPEN: 'Ouverte',
  MATCHED: 'Correspondance trouvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export default function DeveloperDemandsPage() {
  const { data: openDemands, status, search, execute: reload } = useOpenDemands();
  const { data: myModules } = useDeveloperModules();
  const [searchText, setSearchText] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<Record<string, string>>({});
  const [proposalType, setProposalType] = useState<Record<string, ProposalType>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (status === 'pending') return <Loader variant="spinner" size="md" fullScreen />;

  const demands = Array.isArray(openDemands) ? openDemands : [];
  const modules = Array.isArray(myModules) ? myModules : [];

  const handleSearch = () => {
    search({ search: searchText || undefined });
  };

  const handleApplyExisting = async (demandId: string) => {
    const moduleId = selectedModule[demandId];
    if (!moduleId) return;
    setApplying(demandId);
    setFeedback(null);
    try {
      await applyToDemand(demandId, { moduleId, proposalType: 'EXISTING' });
      setFeedback({ type: 'success', msg: 'Proposition envoyée avec succès !' });
      reload();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || "Erreur lors de l'envoi" });
    } finally {
      setApplying(null);
    }
  };

  const handleApplyCustom = async (demandId: string) => {
    setApplying(demandId);
    setFeedback(null);
    try {
      await applyToDemand(demandId, { proposalType: 'CUSTOM_BUILD' });
      setFeedback({ type: 'success', msg: 'Proposition de développement sur mesure envoyée !' });
      reload();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || "Erreur lors de l'envoi" });
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demandes de modules</h1>
          <p className="text-gray-500 mt-1">
            Parcourez les besoins des entreprises et proposez vos modules
          </p>
        </div>
        <Link href="/dashboard/developer/demands/my">
          <Button variant="secondary">
            <ListChecks className="w-4 h-4 mr-2" />
            Mes propositions
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          icon={<Search className="h-4 w-4" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher par mot-clé..."
          className="flex-1 max-w-md"
        />
        <Button onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {feedback.msg}
        </div>
      )}

      {demands.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-400" />}
          title="Aucune demande ouverte"
          description="Il n'y a pas de demande de module pour le moment. Revenez plus tard."
        />
      ) : (
        <div className="grid gap-4">
          {demands.map((demand: any) => {
            const pt = proposalType[demand.id] || 'EXISTING';
            return (
              <Card key={demand.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{demand.title}</h3>
                      {demand.isUrgent && (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2">
                      {demand.description || 'Aucune description'}
                    </p>

                    <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                      <Badge variant="info" size="sm">
                        {demand.moduleType}
                      </Badge>
                      {demand.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {Number(demand.budget).toLocaleString()} {demand.currency}
                        </span>
                      )}
                      {demand.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(demand.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {demand.business && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {demand.business.name}
                          {demand.business.city && ` - ${demand.business.city}`}
                        </span>
                      )}
                      <span>{demand._count?.matches || 0} proposition(s)</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {statusLabels[demand.status as ModuleDemandStatus] || demand.status}
                    </span>
                  </div>
                </div>

                {/* Type selector */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setProposalType({ ...proposalType, [demand.id]: 'EXISTING' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pt === 'EXISTING'
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Module existant
                  </button>
                  <button
                    onClick={() =>
                      setProposalType({ ...proposalType, [demand.id]: 'CUSTOM_BUILD' })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pt === 'CUSTOM_BUILD'
                        ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    Sur mesure
                  </button>
                </div>

                {/* Action area */}
                {pt === 'EXISTING' ? (
                  <div className="mt-4 pt-3 border-t flex items-center gap-3">
                    <Select
                      value={selectedModule[demand.id] || ''}
                      onChange={(e) =>
                        setSelectedModule({ ...selectedModule, [demand.id]: e.target.value })
                      }
                      placeholder="Choisir un module..."
                      options={modules.map((m: any) => ({ value: m.id, label: m.name }))}
                    />
                    <Button
                      onClick={() => handleApplyExisting(demand.id)}
                      disabled={!selectedModule[demand.id] || applying === demand.id}
                      size="sm"
                    >
                      {applying === demand.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Proposer
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Proposez de développer un module personnalisé pour ce business
                    </p>
                    <Button
                      onClick={() => handleApplyCustom(demand.id)}
                      disabled={applying === demand.id}
                      size="sm"
                    >
                      {applying === demand.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Hammer className="w-4 h-4 mr-2" />
                      )}
                      Proposer la création
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
