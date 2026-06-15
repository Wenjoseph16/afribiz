'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, BedDouble, Users, Clock, DollarSign, Bath } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCreateRoom } from '@/features/hooks';

const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'VIP', label: 'VIP' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'DORMITORY', label: 'Dortoir' },
  { value: 'FAMILY', label: 'Familiale' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'BUNGALOW', label: 'Bungalow' },
];

const BATHROOM_TYPES = [
  { value: 'PRIVATE', label: 'Privée' },
  { value: 'SHARED', label: 'Partagée' },
  { value: 'COMMUNAL', label: 'Commune' },
];

const AMENITIES_LIST = [
  'WiFi', 'Climatisation', 'Télévision', 'Netflix', 'Parking',
  'Piscine', 'Restaurant', 'Bar', 'Salle de sport', 'Transport',
  'Navette', 'Cuisine', 'Balcon', 'Terrasse', 'Jardin',
  'Petit déjeuner', 'Service chambre', 'Blanchisserie', 'Coffre-fort', 'Minibar',
];

export default function NewRoomPage() {
  const router = useRouter();
  const createRoom = useCreateRoom();
  const [showPromo, setShowPromo] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [form, setForm] = useState<any>({
    name: '', roomNumber: '', type: 'STANDARD',
    shortDescription: '', description: '',
    price: '', priceWeekend: '', priceHighSeason: '', priceLowSeason: '',
    isPromotional: false, promotionalPrice: '', discountPercent: 0, promotionEndsAt: '',
    capacity: 2, adults: 2, children: 0, beds: 1, size: '',
    bathroom: 'PRIVATE', breakfastIncluded: false,
    checkInTime: '14:00', checkOutTime: '12:00', quantity: 1,
    featured: false, isActive: true,
    seoTitle: '', seoDescription: '',
  });

  const update = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));

  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoom.mutateAsync({
        name: form.name,
        roomNumber: form.roomNumber || undefined,
        type: form.type,
        shortDescription: form.shortDescription,
        description: form.description,
        price: Number(form.price),
        priceWeekend: form.priceWeekend ? Number(form.priceWeekend) : undefined,
        priceHighSeason: form.priceHighSeason ? Number(form.priceHighSeason) : undefined,
        priceLowSeason: form.priceLowSeason ? Number(form.priceLowSeason) : undefined,
        isPromotional: showPromo,
        promotionalPrice: showPromo && form.promotionalPrice ? Number(form.promotionalPrice) : undefined,
        discountPercent: showPromo ? Number(form.discountPercent || 0) : 0,
        capacity: Number(form.capacity || 1),
        adults: Number(form.adults || 1),
        children: Number(form.children || 0),
        beds: Number(form.beds || 1),
        size: form.size ? Number(form.size) : undefined,
        bathroom: form.bathroom,
        amenities: selectedAmenities,
        breakfastIncluded: form.breakfastIncluded,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        quantity: Number(form.quantity || 1),
        featured: form.featured,
        isActive: form.isActive,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
      });
      router.push('/dashboard/rooms');
    } catch (err) {
      // handled by hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rooms" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Nouvelle chambre</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ajoutez un logement à votre établissement</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms"><Button variant="outline">Annuler</Button></Link>
          <Button type="submit" isLoading={createRoom.isPending}><Save className="h-4 w-4 mr-1.5" />Enregistrer</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><BedDouble className="h-4 w-4 inline mr-1.5" />Informations principales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Nom de la chambre *" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Chambre Deluxe Océan, Suite Présidentielle..." required /></div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Numéro de chambre" value={form.roomNumber} onChange={e => update('roomNumber', e.target.value)} placeholder="Ex: 101, A1, V2" />
              <div>
                <label className="block text-sm font-medium mb-2">Type de chambre *</label>
                <select value={form.type} onChange={e => update('type', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                  {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description courte</label>
              <textarea value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={300} placeholder="Courte description..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description complète</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={4} placeholder="Description détaillée de la chambre, équipements, vue, etc." />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><DollarSign className="h-4 w-4 inline mr-1.5" />Tarification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="Prix par nuit *" type="number" min={0} value={form.price} onChange={e => update('price', e.target.value)} placeholder="35000" required />
            <Input label="Prix week-end" type="number" min={0} value={form.priceWeekend} onChange={e => update('priceWeekend', e.target.value)} placeholder="45000" />
            <Input label="Haute saison" type="number" min={0} value={form.priceHighSeason} onChange={e => update('priceHighSeason', e.target.value)} placeholder="55000" />
            <Input label="Basse saison" type="number" min={0} value={form.priceLowSeason} onChange={e => update('priceLowSeason', e.target.value)} placeholder="25000" />
            <Input label="Devise" value="FCFA" disabled />
            <Input label="Quantité (chambres identiques)" type="number" min={1} value={form.quantity} onChange={e => update('quantity', e.target.value)} />
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => setShowPromo(!showPromo)} className="text-sm text-brand hover:text-brand-700 font-medium flex items-center gap-1"><span className="text-lg leading-none">+</span> Ajouter une promotion</button>
            {showPromo && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <Input label="Prix promo" type="number" min={0} value={form.promotionalPrice} onChange={e => update('promotionalPrice', e.target.value)} placeholder="28000" />
                <Input label="Réduction (%)" type="number" min={0} max={100} value={form.discountPercent} onChange={e => update('discountPercent', Number(e.target.value))} placeholder="20" />
                <Input label="Fin de promo" type="date" value={form.promotionEndsAt} onChange={e => update('promotionEndsAt', e.target.value)} />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><Users className="h-4 w-4 inline mr-1.5" />Capacité & Configuration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Capacité max" type="number" min={1} value={form.capacity} onChange={e => update('capacity', e.target.value)} />
            <Input label="Adultes" type="number" min={1} value={form.adults} onChange={e => update('adults', e.target.value)} />
            <Input label="Enfants" type="number" min={0} value={form.children} onChange={e => update('children', e.target.value)} />
            <Input label="Lits" type="number" min={1} value={form.beds} onChange={e => update('beds', e.target.value)} />
            <Input label="Surface (m²)" type="number" min={0} step="0.1" value={form.size} onChange={e => update('size', e.target.value)} placeholder="25" />
            <div>
              <label className="block text-sm font-medium mb-2"><Bath className="h-3.5 w-3.5 inline mr-1" />Salle de bain</label>
              <select value={form.bathroom} onChange={e => update('bathroom', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                {BATHROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={form.breakfastIncluded} onChange={e => update('breakfastIncluded', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Petit déjeuner inclus</label>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Équipements & Services</h3>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', selectedAmenities.includes(a) ? 'bg-brand text-white border-brand' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand/30')}>
                {a}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><Clock className="h-4 w-4 inline mr-1.5" />Check-in / Check-out</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Heure d'arrivée (check-in)" type="time" value={form.checkInTime} onChange={e => update('checkInTime', e.target.value)} />
            <Input label="Heure de départ (check-out)" type="time" value={form.checkOutTime} onChange={e => update('checkOutTime', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4"><Upload className="h-4 w-4 inline mr-1.5" />Médias</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Glissez-déposez vos photos ici</p>
            <Button variant="outline" size="sm" className="mt-3">Parcourir</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Visibilité</h3>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={form.isActive} onChange={e => update('isActive', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Chambre active</label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><input type="checkbox" checked={form.featured} onChange={e => update('featured', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Mettre en vedette</label>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Titre SEO" value={form.seoTitle} onChange={e => update('seoTitle', e.target.value)} placeholder="Titre pour les moteurs de recherche" />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description SEO</label>
              <textarea value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} placeholder="Description pour le référencement..." />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/dashboard/rooms"><Button variant="outline" type="button">Annuler</Button></Link>
          <Button type="submit" isLoading={createRoom.isPending} disabled={!form.name || !form.price}><Save className="h-4 w-4 mr-1.5" />Enregistrer la chambre</Button>
        </div>
      </form>
    </div>
  );
}
