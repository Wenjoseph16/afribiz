'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, Send, CheckCircle, Users, Phone, Mail, MessageCircle, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/services/apiClient';

interface BookingsProps {
  whatsapp?: string;
  businessName?: string;
  slug: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const WEEKDAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function Bookings({ whatsapp, businessName, slug }: BookingsProps) {
  const [step, setStep] = useState<'service' | 'datetime' | 'contact' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [form, setForm] = useState({ name: '', email: '', phone: '', guests: '1', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/public/businesses/${slug}/booking-info`);
        const json = await res.json();
        if (json.success && json.data) {
          setServices(json.data.services || []);
          setSlots(json.data.slots || []);
        }
      } catch (e) {
        console.error('Failed to load booking info', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
    const daySlots = slots.filter((s: any) => s.dayOfWeek === dayOfWeek);
    if (daySlots.length === 0) {
      const hours = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];
      return hours.map((h) => ({ time: h, available: true }));
    }
    const result: TimeSlot[] = [];
    daySlots.forEach((slot: any) => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      let h = sh, m = sm;
      while (h < eh || (h === eh && m < em)) {
        const time = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        result.push({ time, available: true });
        m += 30;
        if (m >= 60) { h++; m = 0; }
      }
    });
    return result;
  }, [selectedDate, slots]);

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const selectedServiceData = selectedService ? services.find((s: any) => s.id === selectedService) : null;

  const steps = ['service', 'datetime', 'contact'];
  const stepsLabels = ['Service', 'Date & Heure', 'Contact'];

  function goPrevMonth(): void {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }

  function goNextMonth(): void {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  function isPast(day: number): boolean {
    const d = new Date(currentYear, currentMonth, day);
    d.setHours(23, 59, 59, 999);
    return d < today;
  }

  async function doSubmit(): Promise<void> {
    try {
      setSubmitError('');
      const body = {
        businessSlug: slug,
        title: `Réservation ${businessName || ''}`,
        type: 'SERVICE',
        serviceId: selectedService,
        startDate: selectedDate + 'T' + selectedTime + ':00',
        guests: parseInt(form.guests) || 1,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email || undefined,
        notes: form.notes || undefined,
      };
      await apiClient.post('/public/bookings', body);
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.error || "Erreur lors de l'envoi de la réservation");
    }
  }

  function resetForm(): void {
    setStep('service');
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setForm({ name: '', email: '', phone: '', guests: '1', notes: '' });
    setSubmitted(false);
    setSubmitError('');
  }

  if (isLoading) {
    return (
      <section id="section-bookings" className="scroll-mt-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-brand" />
            <span className="ml-2 text-sm text-gray-500">Chargement...</span>
          </div>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section id="section-bookings" className="scroll-mt-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Réservation envoyée !</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Votre demande de réservation a bien été reçue. {businessName ? businessName + ' vous contactera sous peu.' : 'Nous vous contacterons sous peu.'}
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-2">
              {selectedServiceData && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Service :</span> {selectedServiceData.name}
                </p>
              )}
              {selectedDate && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Date :</span> {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {selectedTime && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Horaire :</span> {selectedTime}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Personnes :</span> {form.guests}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Client :</span> {form.name} ({form.phone})
              </p>
            </div>
            <Button onClick={resetForm} variant="secondary">Nouvelle réservation</Button>
          </div>
        </div>
      </section>
    );
  }

  // --- Step indicator ---
  function renderStepIndicator(): React.ReactNode {
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => {
          const currentIdx = steps.indexOf(step);
          const isDone = currentIdx > i;
          const isCur = step === s;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                isCur ? 'bg-brand text-white' : isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
              )}>{i + 1}</div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                isCur ? 'text-brand' : isDone ? 'text-emerald-500' : 'text-gray-400',
              )}>{stepsLabels[i]}</span>
              {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />}
            </div>
          );
        })}
      </div>
    );
  }

  // --- Step 1: Service selection ---
  function renderServiceStep(): React.ReactNode {
    return (
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choisissez un service</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((service: any) => {
            const isSelected = selectedService === service.id;
            return (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service.id); setStep('datetime'); }}
                className={cn(
                  'text-left p-4 rounded-xl border transition-all',
                  isSelected
                    ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-2 ring-brand/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                )}
              >
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{service.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{service.duration} min</p>
                <p className="text-sm font-bold text-brand mt-2">{service.price.toLocaleString()} FCFA</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Step 2: Date & Time ---
  function renderDateTimeStep(): React.ReactNode {
    const todayDate = new Date();
    return (
      <div className="p-6 sm:p-8">
        <button onClick={() => setStep('service')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-4 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Retour aux services
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Choisissez la date et l&apos;horaire</h3>
        {selectedServiceData && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            {selectedServiceData.name} &mdash; {selectedServiceData.duration} min
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={goPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</span>
              <button onClick={goNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-[10px] font-medium text-gray-400 py-1.5">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={'e' + i} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
                const isPastDate = isPast(day);
                const isSel = selectedDate === dateStr;
                const isToday = todayDate.getDate() === day && todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear;
                return (
                  <button
                    key={day}
                    disabled={isPastDate}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'text-xs w-8 h-8 rounded-lg transition-all mx-auto',
                      isPastDate && 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
                      !isPastDate && 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                      isSel && 'bg-brand text-white hover:bg-brand-600 font-bold',
                      isToday && !isSel && 'ring-1 ring-brand/40',
                    )}
                  >{day}</button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          <div>
            {selectedDate ? (
              <>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Créneaux disponibles</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                  {timeSlots.length > 0 ? timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        'text-xs py-2 px-3 rounded-lg border transition-all text-center',
                        !slot.available && 'bg-gray-50 dark:bg-gray-700/30 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-700 cursor-not-allowed line-through',
                        slot.available && selectedTime === slot.time && 'bg-brand text-white border-brand font-medium',
                        slot.available && selectedTime !== slot.time && 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand/30 hover:bg-brand/5',
                      )}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />{slot.time}
                    </button>
                  )) : (
                    <p className="text-xs text-gray-400 col-span-2 text-center py-4">Aucun créneau disponible</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <CalendarDays className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs">Sélectionnez une date<br />pour voir les créneaux</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled={!selectedDate || !selectedTime} onClick={() => setStep('contact')}>
            Continuer <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- Step 3: Contact form ---
  function renderContactStep(): React.ReactNode {
    return (
      <div className="p-6 sm:p-8">
        <button onClick={() => setStep('datetime')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-4 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Retour aux horaires
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Vos informations</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Complétez votre réservation</p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet *</label>
            <div className="relative">
              <Input
                placeholder="Votre nom"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="pl-9"
              />
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
            <div className="relative">
              <Input
                placeholder="+225 XX XX XX XX"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="pl-9"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="pl-9"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de personnes</label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="20"
                value={form.guests}
                onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                className="pl-9"
              />
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Demandes spéciales</label>
            <textarea
              placeholder="Allergies, préférences, ..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Récapitulatif</p>
          {selectedServiceData && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Service :</span> {selectedServiceData.name}
            </p>
          )}
          {selectedDate && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Date :</span> {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {selectedTime && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Horaire :</span> {selectedTime}
            </p>
          )}
          <p className="text-xs text-gray-500">
            <span className="font-medium">Personnes :</span> {form.guests}
          </p>
        </div>

        {submitError && (
          <p className="mt-4 text-xs text-red-500">{submitError}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          {whatsapp && (
            <a
              href={'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent('Bonjour, je souhaite réserver un créneau.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Réserver via WhatsApp
            </a>
          )}
          <Button disabled={!form.name || !form.phone} onClick={doSubmit}>
            <Send className="w-4 h-4 mr-1" /> Envoyer la réservation
          </Button>
        </div>
      </div>
    );
  }

  // --- Main render ---
  return (
    <section id="section-bookings" className="scroll-mt-32 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Réservation en ligne</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Réservez votre créneau en quelques clics</p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {step === 'service' && renderServiceStep()}
          {step === 'datetime' && renderDateTimeStep()}
          {step === 'contact' && renderContactStep()}
        </div>
      </div>
    </section>
  );
}
