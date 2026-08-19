'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Save,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  ArrowLeft,
  Check,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Banknote,
  Package,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyServices, useCreateBooking, useMyRooms, useBookingResources } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';
import { useToast } from '@/components/ui/ToastProvider';
import { SlotPicker } from '@/components/bookings/SlotPicker';
import { formatPrice } from '@/utils/helpers';
import { apiClient } from '@/services/apiClient';

const BOOKING_TYPES = ['APPOINTMENT', 'ROOM', 'TABLE', 'EVENT', 'CONSULTATION', 'SERVICE', 'SPACE', 'EQUIPMENT', 'VEHICLE', 'TRAINING'];
const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT: 'Rendez-vous', ROOM: 'Chambre', TABLE: 'Restaurant', EVENT: 'Événement',
  CONSULTATION: 'Consultation', SERVICE: 'Service', SPACE: 'Espace', EQUIPMENT: 'Équipement',
  VEHICLE: 'Véhicule', TRAINING: 'Formation',
};

const PAYMENT_METHODS = [
  { id: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone },
  { id: 'ESCROW', label: 'Escrow', icon: ShieldCheck },
  { id: 'CASH', label: 'Sur place', icon: Banknote },
];

function GlassInput({ label, icon: Icon, required, ...props }: { label: string; icon: any; required?: boolean; [key: string]: any }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-emerald-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"><Icon className="w-4 h-4" /></div>}
        <input
          className={cn(
            'w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20',
            'focus:border-emerald-500/40 focus:bg-white/[0.06] focus:ring-0 outline-none transition-all duration-200 text-sm',
            Icon ? 'pl-10 pr-4' : 'px-4'
          )}
          {...props}
        />
      </div>
    </div>
  );
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass rounded-2xl glass-hover', className)}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-emerald-400" />
      </div>
      <h2 className="text-sm font-bold text-white">{title}</h2>
    </div>
  );
}

export default function NewBookingPage() {
  const router = useRouter();
  const { data: servicesData } = useMyServices();
  const { data: roomsData } = useMyRooms();
  const { data: resourcesData } = useBookingResources();
  const createBooking = useCreateBooking();
  const { notify } = useToast();
  const notifyError = useNotifyError();

  const services = Array.isArray(servicesData) ? servicesData : servicesData?.items || servicesData?.data || [];
  const rooms = Array.isArray(roomsData) ? roomsData : roomsData?.items || roomsData?.data || [];

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [step, setStep] = useState<'details' | 'slot' | 'payment' | 'confirm'>('details');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('SERVICE');
  const [serviceId, setServiceId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [price, setPrice] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = services.find((s: any) => s.id === serviceId);
  const autoPrice = selectedService ? Number(selectedService.price || 0) : 0;
  const effectivePrice = autoPrice > 0 ? autoPrice : Number(price) || 0;
  const deposit = Number(depositAmount) || 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const startDateTime = selectedDate && selectedTime
        ? new Date(`${selectedDate}T${selectedTime}`).toISOString()
        : undefined;

      await createBooking.mutateAsync({
        title: title || `Réservation ${TYPE_LABELS[type] || type}`,
        type,
        serviceId: serviceId || undefined,
        roomId: roomId || undefined,
        startDate: startDateTime,
        guests,
        customerName: clientName || undefined,
        customerPhone: clientPhone || undefined,
        customerEmail: clientEmail || undefined,
        price: effectivePrice,
        depositAmount: deposit || undefined,
        depositPaid: deposit > 0 && paymentMethod !== 'CASH',
        paymentMethod: deposit > 0 ? paymentMethod : undefined,
        specialRequests: specialRequests || undefined,
      });

      notify({
        title: 'Réservation créée !',
        description: `${title || TYPE_LABELS[type]} — ${selectedDate} à ${selectedTime}`,
        variant: 'success',
      });
      router.push('/dashboard/bookings');
    } catch (err) {
      notifyError(err, 'Erreur', 'Impossible de créer la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 'details') return !!title || !!serviceId;
    if (step === 'slot') return !!selectedTime;
    if (step === 'payment') return true;
    return true;
  };

  const steps = [
    { key: 'details', label: 'Détails', icon: Package },
    { key: 'slot', label: 'Créneau', icon: Clock },
    { key: 'payment', label: 'Paiement', icon: CreditCard },
    { key: 'confirm', label: 'Confirmer', icon: Check },
  ] as const;

  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/bookings" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Nouvelle réservation</h1>
          <p className="text-white/30 text-sm mt-0.5">Créez une réservation en quelques clics</p>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => { if (i <= currentIdx) setStep(s.key); }}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                i <= currentIdx
                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-white/30 border border-white/10'
              )}
            >
              {i < currentIdx ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            {i < steps.length - 1 && (
              <div className={cn('w-8 h-0.5 rounded-full transition-all duration-500', i < currentIdx ? 'bg-emerald-500' : 'bg-white/10')} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            {/* STEP 1: Details */}
            {step === 'details' && (
              <GlassCard>
                <SectionHeader icon={Package} title="Informations" />
                <div className="space-y-4">
                  <GlassInput label="Titre" icon={Package} required placeholder="Ex: Coupe + Barbe, Consultation..." value={title} onChange={(e: any) => setTitle(e.target.value)} />
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BOOKING_TYPES.slice(0, 6).map((t) => (
                        <button
                          key={t}
                          onClick={() => { setType(t); if (t !== 'SERVICE') setServiceId(''); if (t !== 'ROOM') setRoomId(''); }}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-medium transition-all duration-200',
                            type === t
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-white/10 border-white/[0.06] text-white/40 hover:border-white/15'
                          )}
                        >
                          {TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {type === 'SERVICE' && services.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Service</label>
                      <div className="space-y-2">
                        {services.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => { setServiceId(s.id); setPrice(String(s.price || 0)); setTitle(s.name); }}
                            className={cn(
                              'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200',
                              serviceId === s.id
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-white/10 border-white/[0.06] hover:border-white/15'
                            )}
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{s.name}</p>
                              <p className="text-xs text-white/30">{s.duration ? `${s.duration} min` : ''}</p>
                            </div>
                            <span className="text-sm font-bold text-emerald-400">{formatPrice(Number(s.price || 0))}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <GlassInput label="Nom du client" icon={User} placeholder="Nom complet" value={clientName} onChange={(e: any) => setClientName(e.target.value)} />
                    <GlassInput label="Téléphone" icon={Phone} placeholder="+225 XX XX XX XX" value={clientPhone} onChange={(e: any) => setClientPhone(e.target.value)} />
                  </div>
                </div>
              </GlassCard>
            )}

            {/* STEP 2: Slot */}
            {step === 'slot' && (
              <GlassCard>
                <SectionHeader icon={Clock} title="Choisir un créneau" />
                <SlotPicker
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                  resourceId={roomId || undefined}
                />
                {selectedTime && (
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-xs text-emerald-400 font-medium">
                      ✓ Créneau sélectionné : {selectedDate} à {selectedTime}
                    </p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* STEP 3: Payment */}
            {step === 'payment' && (
              <GlassCard>
                <SectionHeader icon={CreditCard} title="Paiement de l'acompte" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <GlassInput label="Prix total" icon={DollarSign} type="number" min={0} placeholder="0" value={price} onChange={(e: any) => setPrice(e.target.value)} />
                    <GlassInput label="Acompte" icon={DollarSign} type="number" min={0} placeholder="0" value={depositAmount} onChange={(e: any) => setDepositAmount(e.target.value)} />
                  </div>
                  {deposit > 0 && (
                    <>
                      <p className="text-xs text-white/40">Mode de paiement de l&apos;acompte</p>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            className={cn(
                              'p-3 rounded-xl border text-center transition-all duration-200',
                              paymentMethod === m.id
                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                                : 'bg-white/10 border-white/[0.06] hover:border-white/15'
                            )}
                          >
                            <m.icon className={cn('w-5 h-5 mx-auto mb-1.5', paymentMethod === m.id ? 'text-emerald-400' : 'text-white/30')} />
                            <p className={cn('text-xs font-medium', paymentMethod === m.id ? 'text-emerald-400' : 'text-white/40')}>{m.label}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {deposit === 0 && (
                    <div className="text-center py-6">
                      <ShieldCheck className="w-10 h-10 text-white/15 mx-auto mb-3" />
                      <p className="text-sm text-white/40">Pas d&apos;acompte requis</p>
                      <p className="text-xs text-white/20 mt-1">Le paiement se fera sur place</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* STEP 4: Confirm */}
            {step === 'confirm' && (
              <GlassCard>
                <SectionHeader icon={Check} title="Récapitulatif" />
                <div className="space-y-3">
                  {[
                    ['Titre', title || TYPE_LABELS[type]],
                    ['Type', TYPE_LABELS[type]],
                    ['Client', clientName || '—'],
                    ['Date', selectedDate],
                    ['Créneau', selectedTime || '—'],
                    ['Personnes', String(guests)],
                    ['Prix', effectivePrice > 0 ? formatPrice(effectivePrice) : '—'],
                    ['Acompte', deposit > 0 ? formatPrice(deposit) : 'Aucun'],
                    ['Paiement', deposit > 0 ? PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label : 'Sur place'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-xs text-white/40">{label}</span>
                      <span className="text-sm font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <GlassCard>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Résumé</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Service</span>
                <span className="text-white font-medium">{title || TYPE_LABELS[type]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Date</span>
                <span className="text-white font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Créneau</span>
                <span className="text-white font-medium">{selectedTime || '—'}</span>
              </div>
              {effectivePrice > 0 && (
                <div className="h-px bg-white/5 my-1" />
              )}
              {effectivePrice > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total</span>
                    <span className="text-white font-bold tabular-nums">{formatPrice(effectivePrice)}</span>
                  </div>
                  {deposit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Acompte</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{formatPrice(deposit)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </GlassCard>

          {/* Navigation */}
          <div className="flex gap-3">
            {step !== 'details' && (
              <button
                onClick={() => {
                  const idx = steps.findIndex((s) => s.key === step);
                  if (idx > 0) setStep(steps[idx - 1].key);
                }}
                className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                Retour
              </button>
            )}
            {step === 'confirm' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-sm disabled:opacity-40 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : <><Check className="w-4 h-4" /> Créer la réservation</>}
              </button>
            ) : (
              <button
                onClick={() => {
                  const idx = steps.findIndex((s) => s.key === step);
                  if (idx < steps.length - 1) setStep(steps[idx + 1].key);
                }}
                disabled={!canProceed()}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-bold text-sm disabled:opacity-40 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98]"
              >
                Continuer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
