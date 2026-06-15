'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, CheckCircle2, ArrowLeft, Loader, MapPin, ChevronRight, Leaf } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAY_LABELS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Step management
  const [step, setStep] = useState<'info' | 'select' | 'form' | 'confirm'>('info');

  // Form state
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Available dates
  const [weekStart, setWeekStart] = useState(new Date());
  const [selectedDateSlots, setSelectedDateSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/public/businesses/${slug}/booking-info`);
        if (res.data.success) {
          setBusinessData(res.data.data);
          if (!res.data.data.bookingsEnabled) {
            setError("Ce business n'a pas activé les réservations en ligne.");
          }
        } else {
          setError('Business non trouvé');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // Compute available dates
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (!businessData?.slots) return false;
    return businessData.slots.some((s: any) => s.dayOfWeek === dayOfWeek);
  };

  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    if (!businessData?.slots) return [];
    const daySlots = businessData.slots.filter((s: any) => s.dayOfWeek === dayOfWeek);
    return daySlots;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setSelectedDateSlots(getSlotsForDate(date));
  };

  const handleContinueToForm = () => {
    if (!selectedDate || !selectedSlot) return;
    setStep('form');
  };

  const handleSubmit = async () => {
    if (!customerName || !customerPhone) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/public/bookings`, {
        businessSlug: slug,
        title: selectedService ? `${selectedService}` : `Réservation ${businessData?.business?.name}`,
        startDate: `${selectedDate}T${selectedSlot.startTime}`,
        endDate: selectedSlot.endTime ? `${selectedDate}T${selectedSlot.endTime}` : undefined,
        guests,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined,
        serviceId: selectedService || undefined,
        resourceId: selectedResource || undefined,
        price: services.find((s: any) => s.id === selectedService)?.price || 0,
      });
      if (res.data.success) {
        setBookingResult(res.data.data);
        setSubmitted(true);
        setStep('confirm');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Services & resources
  const services = businessData?.services || [];
  const resources = businessData?.resources || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-10 w-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !businessData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Indisponible</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link href="/" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const business = businessData?.business;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">AfriBiz</span>
          </Link>
          {business?.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              <Phone className="w-3.5 h-3.5" />
              {business.phone}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Business Info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 shadow-sm">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600 relative">
            {business?.coverImage && (
              <Image src={business.coverImage ?? ''} alt="" fill className="object-cover opacity-30" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-2xl font-bold text-emerald-600 border-2 border-white dark:border-gray-700">
                  {business?.name?.charAt(0) || 'B'}
                </div>
                <div className="text-white">
                  <h1 className="text-xl font-bold drop-shadow-sm">{business?.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-white/80 mt-0.5">
                    {business?.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{business.city}</span>}
                    {business?.country && <span>• {business.country}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {business?.description && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{business.description}</p>
            </div>
          )}
        </div>

        {/* Steps Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: 'info', label: 'Disponibilités' },
            { key: 'form', label: 'Vos infos' },
            { key: 'confirm', label: 'Confirmation' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                step === s.key ? 'bg-emerald-600 text-white' :
                ['confirm', 'form'].includes(step) && ['form', 'confirm'].includes(s.key) ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 dark:bg-gray-800 text-gray-400'
              )}>
                {['confirm', 'form'].includes(step) && ['form', 'confirm'].includes(s.key) && s.key !== step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block',
                step === s.key ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>{s.label}</span>
              {i < 2 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Date & Time */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Choisissez une date</h2>
              <p className="text-sm text-gray-500 mb-4">Sélectionnez le jour qui vous convient</p>

              <div className="flex items-center justify-between mb-4">
                <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Clock className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {weekDays[0].toLocaleDateString('fr-FR', { month: 'long' })} {weekDays[0].getFullYear()}
                </span>
                <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Clock className="w-4 h-4 text-gray-500 rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((date, i) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const available = isDateAvailable(date);
                  const isSelected = dateStr === selectedDate;
                  const isPast = date < new Date(new Date().toDateString());
                  return (
                    <button key={i} onClick={() => available && !isPast && handleDateSelect(date)}
                      disabled={!available || isPast}
                      className={cn(
                        'p-2 rounded-xl text-center transition-all',
                        isSelected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 scale-105' :
                        available && !isPast ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer' :
                        'bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      )}>
                      <p className="text-[10px] font-medium opacity-70">{DAY_LABELS[i]}</p>
                      <p className="text-base font-bold mt-0.5">{date.getDate()}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm animate-fadeIn">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Créneaux disponibles</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                {/* Service selection */}
                {services.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Service souhaité</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {services.map((s: any) => (
                        <button key={s.id} onClick={() => setSelectedService(selectedService === s.id ? '' : s.id)}
                          className={cn('p-3 rounded-xl border text-left transition-all',
                            selectedService === s.id 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                          )}>
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                          {s.price > 0 && <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{Number(s.price).toLocaleString()} FCFA</p>}
                          {s.duration && <p className="text-[9px] text-gray-400">{s.duration} min</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resource selection */}
                {resources.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Ressource</label>
                    <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}
                      className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                      <option value="">Peu importe</option>
                      {resources.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Guests */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Nombre de personnes</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">-</button>
                    <span className="text-lg font-bold text-gray-900 dark:text-white w-8 text-center">{guests}</span>
                    <button onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
                  </div>
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {selectedDateSlots.map((slot: any, i: number) => (
                    <button key={i} onClick={() => setSelectedSlot(slot)}
                      className={cn('p-2.5 rounded-xl text-center transition-all border text-xs font-medium',
                        selectedSlot === slot
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                      )}>
                      {slot.startTime.slice(0, 5)}-{slot.endTime?.slice(0, 5) || '...'}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div className="mt-6">
                    <button onClick={handleContinueToForm}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                      Continuer →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customer Info */}
        {step === 'form' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Vos informations</h2>
            <p className="text-sm text-gray-500 mb-6">Laissez-nous vos coordonnées pour finaliser la réservation</p>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nom complet *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Votre nom" required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-transparent dark:text-gray-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+228 XX XX XX XX" required
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-transparent dark:text-gray-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email (optionnel)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-transparent dark:text-gray-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Notes (optionnel)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Avez-vous des demandes particulières ?"
                  rows={3}
                  className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-transparent dark:text-gray-100 resize-none" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setStep('info')}
                  className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  ← Retour
                </button>
                <button onClick={handleSubmit} disabled={!customerName || !customerPhone || submitting}
                  className={cn('flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all',
                    submitting || !customerName || !customerPhone
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                  )}>
                  {submitting ? <Loader className="h-4 w-4 animate-spin mx-auto" /> : 'Confirmer la réservation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && submitted && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Réservation envoyée !</h2>
            <p className="text-sm text-gray-500 mb-2">Votre demande a bien été reçue.</p>
            {bookingResult?.bookingNumber && (
              <p className="text-xs text-gray-400 mb-6">
                N° de réservation : <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{bookingResult.bookingNumber}</span>
              </p>
            )}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 text-left text-sm space-y-2">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {selectedSlot && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime?.slice(0, 5) || '...'}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4 text-emerald-600" />
                {customerName}
              </div>
              {customerPhone && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  {customerPhone}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              {business?.phone && (
                <a href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(business.name)}%2C%20je%20viens%20de%20r%C3%A9server%20(${bookingResult?.bookingNumber || ''})`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg">
                  <MessageSquare className="w-4 h-4" />
                  Contacter via WhatsApp
                </a>
              )}
              <Link href="/" className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        )}

        {/* WhatsApp CTA */}
        {step === 'info' && business?.phone && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Vous préférez réserver autrement ?</p>
                <p className="text-xs text-gray-500">Contactez-nous directement sur WhatsApp</p>
              </div>
              <a href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(business.name)}%2C%20je%20souhaite%20r%C3%A9server.`}
                target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-medium transition-all">
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        <p>Propulsé par <span className="font-semibold text-emerald-600">AfriBiz</span> — Réservations professionnelles</p>
      </footer>
    </div>
  );
}
