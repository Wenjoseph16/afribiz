'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Clock, User, Phone, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useMyServices, useCreateBooking, useMyRooms, useBookingResources } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';

const BOOKING_TYPES = ['APPOINTMENT','ROOM','TABLE','EVENT','CONSULTATION','SERVICE','SPACE','EQUIPMENT','VEHICLE','TRAINING'];
const BOOKING_SOURCES = ['AFRIBIZ_SITE','DASHBOARD','QR_CODE','WHATSAPP','PHONE','PHYSICAL','MANUAL'];
const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Rendez-vous', ROOM: 'Chambre', TABLE: 'Restaurant',
  EVENT: 'Événement', CONSULTATION: 'Consultation', SERVICE: 'Service',
  SPACE: 'Espace', EQUIPMENT: 'Équipement', VEHICLE: 'Véhicule', TRAINING: 'Formation',
};

export default function NewBookingPage() {
  const router = useRouter();
  const { data: servicesData } = useMyServices();
  const { data: roomsData } = useMyRooms();
  const { data: resourcesData } = useBookingResources();
  const createBooking = useCreateBooking();

  const services = Array.isArray(servicesData) ? servicesData : (servicesData?.items || servicesData?.data || []);
  const rooms = Array.isArray(roomsData) ? roomsData : (roomsData?.items || roomsData?.data || []);
  const resources = Array.isArray(resourcesData) ? resourcesData : (resourcesData?.items || resourcesData?.data || []);

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('APPOINTMENT');
  const [source, setSource] = useState('MANUAL');
  const [serviceId, setServiceId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState(defaultTime);
  const [endTime, setEndTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [price, setPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaid, setDepositPaid] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [notes, setNotes] = useState('');
  const notifyError = useNotifyError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDateTime = startDate && startTime ? new Date(`${startDate}T${startTime}`).toISOString() : undefined;
      const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : undefined;
      await createBooking.mutateAsync({
        title, description, type, source,
        serviceId: serviceId || undefined,
        roomId: roomId || undefined,
        resourceId: resourceId || undefined,
        startDate: startDateTime, endDate: endDateTime,
        guests, adults: guests, children: 0,
        customerName: clientName || undefined,
        customerPhone: clientPhone || undefined,
        customerEmail: clientEmail || undefined,
        price: Number(price) || 0,
        depositAmount: Number(depositAmount) || undefined,
        depositPaid,
        specialRequests: specialRequests || undefined,
        notes: notes || undefined,
      });
      router.push('/dashboard/bookings');
    } catch (err) {
      notifyError(err, 'Erreur', "Impossible de créer la réservation");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle réservation</h1><p className="text-sm text-gray-500 dark:text-gray-400">Créez une réservation manuelle</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-brand" /> Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Coupe + Barbe, Consultation médicale..." required /></div>
              <div><label className="block text-sm font-medium mb-1">Type</label>
                <select value={type} onChange={e => { setType(e.target.value); if (e.target.value !== 'SERVICE') setServiceId(''); if (e.target.value !== 'ROOM') setRoomId(''); }}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  {BOOKING_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  {BOOKING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {type === 'SERVICE' && services.length > 0 && (
                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Service</label>
                  <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                    <option value="">— Sélectionner un service —</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {Number(s.price || 0).toLocaleString()} FCFA</option>)}
                  </select>
                </div>
              )}
              {type === 'ROOM' && rooms.length > 0 && (
                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Chambre</label>
                  <select value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                    <option value="">— Sélectionner une chambre —</option>
                    {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name} - {Number(r.price || 0).toLocaleString()} FCFA</option>)}
                  </select>
                </div>
              )}
              {resources.length > 0 && (
                <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Ressource</label>
                  <select value={resourceId} onChange={e => setResourceId(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                    <option value="">— Aucune —</option>
                    {resources.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </Card>

          {/* Date & heure */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="w-4 h-4 text-brand" /> Date & heure</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Date début *</label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
              <div><label className="block text-sm font-medium mb-1">Date fin</label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              <Input label="Heure début" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <Input label="Heure fin" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              <Input label="Nombre de personnes" type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))} />
            </div>
          </Card>

          {/* Client */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><User className="w-4 h-4 text-brand" /> Client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1">Nom complet</label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nom du client" /></div>
              <Input label="Téléphone" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+228 XX XX XX XX" />
              <Input label="Email" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" />
            </div>
          </Card>

          {/* Tarification */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand" /> Tarification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Prix" type="number" min={0} value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
              <Input label="Acompte" type="number" min={0} value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0" />
              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={depositPaid} onChange={e => setDepositPaid(e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /><span className="text-sm text-gray-600 dark:text-gray-300">Acompte payé</span></label>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Notes</h2>
            <div><label className="block text-sm font-medium mb-1">Demandes spéciales</label>
              <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100" rows={2} placeholder="Allergies, préférences..." />
            </div>
            <div><label className="block text-sm font-medium mb-1">Notes internes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100" rows={2} placeholder="Info pour le staff..." />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Réservation manuelle</p>
            <p className="text-xs text-gray-500">Les dates sont pré-remplies avec la date et l'heure actuelles.</p>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Résumé</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{TYPE_LABELS[type] || type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{startDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Horaire</span><span className="font-medium">{startTime}{endTime ? `-${endTime}` : ''}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Personnes</span><span className="font-medium">{guests}</span></div>
              {price && <div className="flex justify-between"><span className="text-gray-500">Prix</span><span className="font-bold text-brand">{Number(price).toLocaleString()} FCFA</span></div>}
            </div>
          </Card>
          <Button type="submit" className="w-full" isLoading={createBooking.isPending}><Save className="w-4 h-4 mr-1.5" />Créer la réservation</Button>
          <Link href="/dashboard/bookings"><Button variant="secondary" type="button" className="w-full">Annuler</Button></Link>
        </div>
      </div>
    </form>
  );
}
