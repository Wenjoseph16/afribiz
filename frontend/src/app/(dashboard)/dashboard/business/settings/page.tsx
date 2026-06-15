'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Users, Shield, Lock, CreditCard, DollarSign,
  UserPlus, CheckCircle, XCircle, Smartphone, Key,
  Plus, Pencil, Trash2, Globe, Bell, Building,
  Clock, MapPin, Phone, Mail, Save, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyEmployees, useEmployeeRoles, useMyBusiness } from '@/features/hooks';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profil Business', icon: Building, desc: 'Informations publiques de votre entreprise' },
  { id: 'hours', label: 'Horaires', icon: Clock, desc: 'Gérer vos heures d\'ouverture' },
  { id: 'team', label: 'Équipe', icon: Users, desc: 'Gérer les membres de votre entreprise' },
  { id: 'permissions', label: 'Permissions', icon: Shield, desc: 'Définir les rôles et accès' },
  { id: 'payments', label: 'Paiements', icon: DollarSign, desc: 'Moyens de paiement acceptés' },
  { id: 'security', label: 'Sécurité', icon: Lock, desc: 'Sécurité du compte' },
];

const DAYS = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' },
];

const PAYMENT_METHODS = [
  { id: 'MOBILE_MONEY', label: 'Mobile Money' },
  { id: 'BANK_TRANSFER', label: 'Virement bancaire' },
  { id: 'CASH', label: 'Espèces' },
  { id: 'CARD', label: 'Carte Bancaire' },
];

export default function BusinessSettingsPage() {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: business, isLoading: bizLoading, refetch: refetchBiz } = useMyBusiness();
  const { data: employeesData, isLoading: empLoading } = useMyEmployees();
  const { data: rolesData, isLoading: rolesLoading } = useEmployeeRoles();

  // Business Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '', slug: '', tagline: '', description: '', shortDescription: '',
    phone: '', email: '', whatsapp: '', address: '', logo: '', coverImage: '',
  });

  // Hours Form
  const [hours, setHours] = useState<any[]>([]);

  // Payment Methods
  const { data: paymentMethodsData, refetch: refetchPM } = useQuery({
    queryKey: ['business-payment-methods'],
    queryFn: async () => { const res = await apiClient.getBusinessPaymentMethods(); return res.data.data; },
  });
  const [showPMForm, setShowPMForm] = useState(false);
  const [pmForm, setPmForm] = useState({ method: 'MOBILE_MONEY', name: '', number: '', nameOnAccount: '' });

  useEffect(() => {
    if (business) {
      setProfileForm({
        name: business.name || '',
        slug: business.slug || '',
        tagline: business.tagline || '',
        description: business.description || '',
        shortDescription: business.shortDescription || '',
        phone: business.phone || '',
        email: business.email || '',
        whatsapp: business.whatsapp || '',
        address: business.address || '',
        logo: business.logo || '',
        coverImage: business.coverImage || '',
      });

      const hData = business.hours || [];
      const dayMap: any = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
      const formattedHours = DAYS.map(d => {
        const found = hData.find((h: any) => dayMap[h.day] === d.id);
        return {
          day: d.id,
          open: found?.open || '09:00',
          close: found?.close || '18:00',
          isClosed: found ? found.isClosed : false,
        };
      });
      setHours(formattedHours);
    }
  }, [business]);

  const handleUpdateProfile = async () => {
    try {
      await apiClient.put('/business/public-page', { ...profileForm, hours });
      addToast('Profil mis à jour avec succès', 'success');
      refetchBiz();
    } catch (e) {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleAddPM = async () => {
    try {
      await apiClient.addBusinessPaymentMethod(pmForm);
      addToast('Moyen de paiement ajouté', 'success');
      setShowPMForm(false);
      setPmForm({ method: 'MOBILE_MONEY', name: '', number: '', nameOnAccount: '' });
      refetchPM();
    } catch (e) { addToast('Erreur lors de l\'ajout', 'error'); }
  };

  const handleDeletePM = async (id: string) => {
    if (!confirm('Supprimer ce moyen de paiement ?')) return;
    try {
      await apiClient.deleteBusinessPaymentMethod(id);
      addToast('Moyen de paiement supprimé', 'success');
      refetchPM();
    } catch (e) { addToast('Erreur lors de la suppression', 'error'); }
  };

  const employees = Array.isArray(employeesData) ? employeesData : employeesData?.employees || employeesData?.data || [];
  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.roles || rolesData?.data || [];
  const pMethods = Array.isArray(paymentMethodsData) ? paymentMethodsData : [];

  if (bizLoading) return <Loader fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl pb-20">
      <PageHeader
        title="Paramètres Business"
        description="Configurez l'identité et le fonctionnement de votre entreprise"
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0">
          <div className="space-y-1 sticky top-24">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                )}
              >
                <tab.icon className={cn('h-4 w-4', activeTab === tab.id ? 'text-white' : 'text-gray-400')} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">

          {/* ============ PROFIL BUSINESS ============ */}
          {activeTab === 'profile' && (
            <Card title="Identité de l'entreprise" padding="lg">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom commercial</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug (URL)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">afribiz.com/</span>
                      <input type="text" value={profileForm.slug} onChange={e => setProfileForm({...profileForm, slug: e.target.value})}
                        className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slogan / Tagline</label>
                  <input type="text" value={profileForm.tagline} onChange={e => setProfileForm({...profileForm, tagline: e.target.value})}
                    placeholder="Ex: Le meilleur de l'artisanat local"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</label>
                    <input type="text" value={profileForm.whatsapp} onChange={e => setProfileForm({...profileForm, whatsapp: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Adresse physique</label>
                  <input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 outline-none" />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateProfile}><Save className="h-4 w-4 mr-2" />Enregistrer les modifications</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ============ HORAIRES ============ */}
          {activeTab === 'hours' && (
            <Card title="Heures d'ouverture" padding="lg">
              <div className="space-y-4">
                {hours.map((h, idx) => (
                  <div key={h.day} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="w-24 font-medium text-sm">{DAYS.find(d => d.id === h.day)?.label}</span>
                    {h.isClosed ? (
                      <span className="text-sm text-red-500 font-medium flex-1 italic">Fermé</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="time" value={h.open} onChange={e => {
                          const newHours = [...hours];
                          newHours[idx].open = e.target.value;
                          setHours(newHours);
                        }} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                        <span className="text-gray-400">à</span>
                        <input type="time" value={h.close} onChange={e => {
                          const newHours = [...hours];
                          newHours[idx].close = e.target.value;
                          setHours(newHours);
                        }} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={h.isClosed} onChange={e => {
                        const newHours = [...hours];
                        newHours[idx].isClosed = e.target.checked;
                        setHours(newHours);
                      }} className="rounded text-brand" />
                      <span className="text-xs text-gray-500">Fermé</span>
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleUpdateProfile}><Save className="h-4 w-4 mr-2" />Enregistrer les horaires</Button>
                </div>
              </div>
            </Card>
          )}

          {/* ============ ÉQUIPE ============ */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <Card title="Membres de l'équipe"
                action={<Link href="/dashboard/employees/new"><Button size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Ajouter</Button></Link>}
              >
                {empLoading ? <Loader /> : (
                  <div className="space-y-2">
                    {employees.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                            {(emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-gray-500">{emp.role?.name || emp.position}</p>
                          </div>
                        </div>
                        <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'warning'}>{emp.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ============ PAIEMENTS ============ */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <Card title="Moyens de paiement acceptés"
                action={<Button size="sm" onClick={() => setShowPMForm(true)}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pMethods.map((pm: any) => (
                    <div key={pm.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="info">{pm.method}</Badge>
                        <button onClick={() => handleDeletePM(pm.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <p className="text-sm font-bold">{pm.name || pm.method}</p>
                      <p className="text-lg font-mono text-brand mt-1">{pm.number}</p>
                      {pm.nameOnAccount && <p className="text-xs text-gray-500 mt-1">{pm.nameOnAccount}</p>}
                    </div>
                  ))}
                </div>
              </Card>

              {showPMForm && (
                <Card title="Ajouter un moyen de paiement">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Type</label>
                        <select value={pmForm.method} onChange={e => setPmForm({...pmForm, method: e.target.value})}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm">
                          {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Nom (ex: Orange Money)</label>
                        <input type="text" value={pmForm.name} onChange={e => setPmForm({...pmForm, name: e.target.value})}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Numéro / Identifiant</label>
                        <input type="text" value={pmForm.number} onChange={e => setPmForm({...pmForm, number: e.target.value})}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Nom du compte</label>
                        <input type="text" value={pmForm.nameOnAccount} onChange={e => setPmForm({...pmForm, nameOnAccount: e.target.value})}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowPMForm(false)}>Annuler</Button>
                      <Button size="sm" onClick={handleAddPM}>Enregistrer</Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ============ SÉCURITÉ ============ */}
          {activeTab === 'security' && (
            <Card title="Sécurité" padding="lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-brand/5 border border-brand/10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-brand/10 text-brand"><Smartphone className="h-6 w-6" /></div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Authentification à deux facteurs (2FA)</p>
                      <p className="text-sm text-gray-500">Protégez votre compte avec un code de vérification.</p>
                    </div>
                  </div>
                  <Link href="/dashboard/security">
                    <Button variant="outline">Gérer</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
