'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import Link from 'next/link';
import { FileText, Plus, Clock, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useMyDemands } from '@/hooks/useDemands';
import { createDemand } from '@/services/api/demands';
import type { ModuleDemandStatus } from '@afribiz/shared';

const statusLabels: Record<ModuleDemandStatus, string> = {
  OPEN: 'Ouverte',
  MATCHED: 'Correspondance trouvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const statusColors: Record<ModuleDemandStatus, string> = {
  OPEN: 'bg-green-100 text-green-800',
  MATCHED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function BusinessDemandsPage() {
  const { data: demands, status, execute } = useMyDemands();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    moduleType: '',
    title: '',
    description: '',
    budget: '',
    currency: 'FCFA',
    deadline: '',
    isUrgent: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (status === 'pending') return <Loader variant="spinner" size="md" fullScreen />;

  const list = Array.isArray(demands) ? demands : [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createDemand({
        moduleType: form.moduleType,
        title: form.title,
        description: form.description || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: form.currency,
        deadline: form.deadline || undefined,
        isUrgent: form.isUrgent,
      });
      setShowForm(false);
      setForm({
        moduleType: '',
        title: '',
        description: '',
        budget: '',
        currency: 'FCFA',
        deadline: '',
        isUrgent: false,
      });
      execute();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes demandes de modules"
        description="Exprimez vos besoins et recevez des propositions de développeurs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Modules', href: '/dashboard/business/modules' },
          { label: 'Demandes' },
        ]}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle demande
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Créer une demande</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de module *
                </label>
                <select
                  value={form.moduleType}
                  onChange={(e) => setForm({ ...form, moduleType: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Sélectionnez...</option>
                  <option value="ECOMMERCE">E-commerce</option>
                  <option value="CRM">CRM</option>
                  <option value="BOOKING">Booking</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="ANALYTICS">Analytique</option>
                  <option value="FINANCE">Finance</option>
                  <option value="HR">RH</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="Montant"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-24 border rounded-lg px-3 py-2"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Ex: Module de gestion de stock"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez vos besoins fonctionnels..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isUrgent}
                    onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Urgent</span>
                </label>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Publier la demande
              </Button>
            </div>
          </form>
        </Card>
      )}

      {list.length === 0 && !showForm ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-gray-400" />}
          title="Aucune demande"
          description="Publiez votre premier besoin pour recevoir des propositions de développeurs."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une demande
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {list.map((demand: any) => (
            <Link key={demand.id} href={`/dashboard/business/modules/demands/${demand.id}`}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 mr-4">
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
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Badge variant="info" size="sm">
                        {demand.moduleType}
                      </Badge>
                      {demand.budget && (
                        <span>
                          Budget : {Number(demand.budget).toLocaleString()} {demand.currency}
                        </span>
                      )}
                      {demand.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(demand.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span>{demand._count?.matches || 0} proposition(s)</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[demand.status as ModuleDemandStatus] || ''}`}
                  >
                    {statusLabels[demand.status as ModuleDemandStatus] || demand.status}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
