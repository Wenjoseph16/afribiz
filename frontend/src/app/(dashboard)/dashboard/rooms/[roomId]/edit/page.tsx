'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, BedDouble, Users, Clock, DollarSign, Bath,
  Loader, Eye, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useMyRoom, useUpdateRoom } from '@/features/hooks';

const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' }, { value: 'VIP', label: 'VIP' },
  { value: 'SUITE', label: 'Suite' }, { value: 'STUDIO', label: 'Studio' },
  { value: 'APARTMENT', label: 'Appartement' }, { value: 'VILLA', label: 'Villa' },
  { value: 'DORMITORY', label: 'Dortoir' }, { value: 'FAMILY', label: 'Familiale' },
  { value: 'DOUBLE', label: 'Double' }, { value: 'SINGLE', label: 'Single' },
  { value: 'DELUXE', label: 'Deluxe' }, { value: 'BUNGALOW', label: 'Bungalow' },
];

const AMENITIES_LIST = [
  'WiFi', 'Climatisation', 'Télévision', 'Netflix', 'Parking',
  'Piscine', 'Restaurant', 'Bar', 'Salle de sport', 'Transport',
  'Navette', 'Cuisine', 'Balcon', 'Terrasse', 'Jardin',
  'Petit déjeuner', 'Service chambre', 'Blanchisserie', 'Coffre-fort', 'Minibar',
];

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { data: r, isLoading } = useMyRoom(roomId);
  const updateRoom = useUpdateRoom();
  const [saving, setSaving] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [form, setForm] = useState<any>({});
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (r) {
      setForm(r);
      setSelectedAmenities(r.amenities || []);
      setShowPromo(r.isPromotional || false);
    }
  }, [r]);

  const update = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));
  const toggleAmenity = (a: string) => {
    setSelectedAmenities(prev => {
      const next = prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a];
      update('amenities', next);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRoom.mutateAsync({
        id: roomId,
        data: {
          name: form.name,
          roomNumber: form.roomNumber || undefined,
          type: form.type || 'STANDARD',
          shortDescription: form.shortDescription,
          description: form.description,
          images: form.images || [],
          price: Number(form.price),
          priceWeekend: form.priceWeekend ? Number(form.priceWeekend) : null,
          priceHighSeason: form.priceHighSeason ? Number(form.priceHighSeason) : null,
          priceLowSeason: form.priceLowSeason ? Number(form.priceLowSeason) : null,
          isPromotional: showPromo,
          promotionalPrice: showPromo && form.promotionalPrice ? Number(form.promotionalPrice) : null,
          discountPercent: showPromo ? Number(form.discountPercent || 0) : 0,
          capacity: Number(form.capacity || 1),
          adults: Number(form.adults || 1),
          children: Number(form.children || 0),
          beds: Number(form.beds || 1),
          size: form.size ? Number(form.size) : null,
          bathroom: form.bathroom || 'PRIVATE',
          amenities: selectedAmenities,
          breakfastIncluded: form.breakfastIncluded || false,
          checkInTime: form.checkInTime || '14:00',
          checkOutTime: form.checkOutTime || '12:00',
          quantity: Number(form.quantity || 1),
          featured: form.featured || false,
          isActive: form.isActive !== false,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
        },
      });
      router.push(`/dashboard/rooms/${roomId}`);
    } catch (err) {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/rooms/${roomId}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div><h1 className="text-xl sm:text-2xl font-bold">Modifier la chambre</h1><p className="text-sm text-gray-500 mt-0.5">{r?.name}</p></div>
        </div>
        <Link href={`/dashboard/rooms/${roomId}`}><Button variant="outline">Annuler</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><BedDouble className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Informations principales</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Nom *" value={form.name || ''} onChange={e => update('name', e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Numéro" value={form.roomNumber || ''} onChange={e => update('roomNumber', e.target.value)} />
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select value={form.type || 'STANDARD'} onChange={e => update('type', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                  {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description courte</label>
              <textarea value={form.shortDescription || ''} onChange={e => update('shortDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={300} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description complète</label>
              <textarea value={form.description || ''} onChange={e => update('description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={4} />
            </div>
          </div>
        </Card>

        {/* Tarification */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Tarification</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Prix nuit *" type="number" value={form.price?.toString() || ''} onChange={e => update('price', e.target.value)} required />
            <Input label="Week-end" type="number" value={form.priceWeekend?.toString() || ''} onChange={e => update('priceWeekend', e.target.value)} />
            <Input label="Haute saison" type="number" value={form.priceHighSeason?.toString() || ''} onChange={e => update('priceHighSeason', e.target.value)} />
            <Input label="Basse saison" type="number" value={form.priceLowSeason?.toString() || ''} onChange={e => update('priceLowSeason', e.target.value)} />
            <Input label="Devise" value="FCFA" disabled />
            <Input label="Quantité" type="number" min={1} value={form.quantity || 1} onChange={e => update('quantity', e.target.value)} />
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => setShowPromo(!showPromo)} className={cn('text-sm font-medium', showPromo ? 'text-red-500' : 'text-brand')}>{showPromo ? '— Masquer promo' : '+ Ajouter promo'}</button>
            {showPromo && <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100"><Input label="Prix promo" type="number" value={form.promotionalPrice?.toString() || ''} onChange={e => update('promotionalPrice', e.target.value)} /><Input label="Réduction %" type="number" value={form.discountPercent || 0} onChange={e => update('discountPercent', Number(e.target.value))} /><Input label="Fin" type="date" value={form.promotionEndsAt || ''} onChange={e => update('promotionEndsAt', e.target.value)} /></div>}
          </div>
        </Card>

        {/* Capacité */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Capacité & Configuration</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Capacité max" type="number" min={1} value={form.capacity || 1} onChange={e => update('capacity', e.target.value)} />
            <Input label="Adultes" type="number" min={1} value={form.adults || 1} onChange={e => update('adults', e.target.value)} />
            <Input label="Enfants" type="number" min={0} value={form.children || 0} onChange={e => update('children', e.target.value)} />
            <Input label="Lits" type="number" min={1} value={form.beds || 1} onChange={e => update('beds', e.target.value)} />
            <Input label="Surface (m²)" type="number" step="0.1" value={form.size || ''} onChange={e => update('size', e.target.value)} />
            <div>
              <label className="block text-sm font-medium mb-2"><Bath className="h-3.5 w-3.5 inline mr-1" />Salle de bain</label>
              <select value={form.bathroom || 'PRIVATE'} onChange={e => update('bathroom', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="PRIVATE">Privée</option><option value="SHARED">Partagée</option><option value="COMMUNAL">Commune</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.breakfastIncluded || false} onChange={e => update('breakfastIncluded', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Petit-déjeuner inclus</label>
            </div>
          </div>
        </Card>

        {/* Équipements */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Équipements & Services</h3>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', selectedAmenities.includes(a) ? 'bg-brand text-white border-brand' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 border-gray-200 dark:border-gray-600 hover:border-brand/30')}>
                {a}
              </button>
            ))}
          </div>
        </Card>

        {/* Check-in/Check-out */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Clock className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Check-in / Check-out</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Check-in" type="time" value={form.checkInTime || '14:00'} onChange={e => update('checkInTime', e.target.value)} />
            <Input label="Check-out" type="time" value={form.checkOutTime || '12:00'} onChange={e => update('checkOutTime', e.target.value)} />
          </div>
        </Card>

        {/* Médias */}
        <Card>
          <h3 className="text-sm font-semibold mb-4"><Upload className="h-4 w-4 inline mr-1.5" />Médias</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-brand/40 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">Photos de la chambre</p>
            <Button variant="outline" size="sm" className="mt-3" type="button">Modifier</Button>
          </div>
        </Card>

        {/* Visibilité & SEO */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Eye className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Visibilité & SEO</h3></div>
          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive !== false} onChange={e => update('isActive', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured || false} onChange={e => update('featured', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> En vedette</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Titre SEO" value={form.seoTitle || ''} onChange={e => update('seoTitle', e.target.value)} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description SEO</label>
              <textarea value={form.seoDescription || ''} onChange={e => update('seoDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={160} />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/dashboard/rooms/${roomId}`}><Button variant="outline">Annuler</Button></Link>
          <Button type="submit" isLoading={saving}><Save className="h-4 w-4 mr-1.5" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
