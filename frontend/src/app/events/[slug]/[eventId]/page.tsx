'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, MapPin, Clock, Users, Ticket, ArrowRight,
  ChevronLeft, AlertCircle, CalendarDays, X, Image as ImageIcon,
  CheckCircle, Handshake, Loader,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return null;

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const units = [
    { value: d, label: 'jours' },
    { value: h, label: 'heures' },
    { value: m, label: 'min' },
    { value: s, label: 's' },
  ];

  return (
    <div className="flex items-center gap-3">
      {units.map((unit, i) => (
        <div key={i} className="text-center">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <span className="text-2xl font-bold">{String(unit.value).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] text-white/70 mt-1 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

function BookingModal({
  eventId,
  slug,
  ticket,
  onClose,
}: {
  eventId: string;
  slug: string;
  ticket: any;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    quantity: 1,
  });
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.registerPublicParticipant(slug, eventId, {
        ...data,
        ticketId: ticket.id,
      }),
    onSuccess: () => setSuccess(true),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Inscription confirmée !</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Votre inscription pour <strong>{ticket.name}</strong> a bien été enregistrée. Vous recevrez un email de confirmation.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Réserver</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {ticket.name} — {ticket.price > 0 ? `${Number(ticket.price).toLocaleString()} FCFA` : 'Gratuit'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prénom</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all outline-none"
              placeholder="jean.dupont@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Téléphone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all outline-none"
              placeholder="+225 01 02 03 04 05"
            />
          </div>

          {(ticket.quantity > 1 || !ticket.quantity) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de places</label>
              <input
                type="number"
                min={1}
                max={ticket.quantity || 10}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Ticket size={18} />
            )}
            {mutation.isPending ? 'Inscription...' : `Réserver${form.quantity > 1 ? ` (${form.quantity} places)` : ''}`}
          </button>

          {mutation.error && (
            <p className="text-sm text-red-600 text-center">
              {mutation.error instanceof Error ? mutation.error.message : "Une erreur est survenue"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams<{ slug: string; eventId: string }>();
  const slug = params?.slug;
  const eventId = params?.eventId;

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['public-event', slug, eventId],
    queryFn: async () => {
      if (!slug || !eventId) throw new Error('Paramètres manquants');
      const res = await apiClient.getPublicEvent(slug, eventId);
      return res.data.data;
    },
    enabled: !!slug && !!eventId,
  });

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const e: any = event;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 space-y-6">
            <div className="h-12 w-96 bg-white dark:bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-white dark:bg-gray-800 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white dark:bg-gray-800 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !e) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Événement introuvable</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Cet événement n&apos;existe pas ou a été retiré.
          </p>
          <Link
            href={slug ? `/events/${slug}` : '/'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft size={18} />
            Retour aux événements
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(e.startDate);
  const endDate = e.endDate ? new Date(e.endDate) : null;
  const isPast = endDate ? endDate < new Date() : false;
  const isUpcoming = !isPast && startDate > new Date();
  const tickets: any[] = Array.isArray(e.tickets) ? e.tickets : [];
  const partners: any[] = Array.isArray(e.partners) ? e.partners : [];
  const gallery: any[] = Array.isArray(e.gallery) ? e.gallery : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="relative">
        {e.image ? (
          <div className="h-72 sm:h-96 relative">
            <Image src={e.image ?? ''} alt={e.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-72 sm:h-96 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        )}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href={slug ? `/events/${slug}` : '/'}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl"
          >
            <ChevronLeft size={16} />
            Retour
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', {
                'text-emerald-200 bg-emerald-500/20 border-emerald-500/30': isUpcoming || e.status === 'PUBLISHED',
                'text-blue-200 bg-blue-500/20 border-blue-500/30': e.status === 'ONGOING',
                'text-gray-300 bg-gray-500/20 border-gray-500/30': isPast,
                'text-red-200 bg-red-500/20 border-red-500/30': e.status === 'CANCELLED',
              })}>
                {e.status === 'CANCELLED' ? 'Annulé' : isPast ? 'Terminé' : e.status === 'ONGOING' ? 'En cours' : 'À venir'}
              </span>
              {e.category && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                  {e.category}
                </span>
              )}
              {e.isFeatured && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  En vedette
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
              {e.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/80 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>{startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {e.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} />
                  <span>{e.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>{e.participantCount || 0} participant{e.participantCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      {isUpcoming && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-white/80 text-sm font-medium mb-3">L&apos;événement commence dans</p>
            <CountdownTimer targetDate={startDate} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {e.description && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Description</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{e.description}</p>
              </div>
            )}

            {/* Organizer Info */}
            {e.organizer && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Organisateur</h2>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {e.organizer.name || e.organizer.companyName || 'Organisateur'}
                    </p>
                    {e.organizer.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{e.organizer.email}</p>
                    )}
                    {e.organizer.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{e.organizer.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Galerie</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {gallery.map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 group relative"
                    >
                      {item.type === 'VIDEO' ? (
                        <video src={item.url} controls className="w-full h-full object-cover" />
                      ) : item.url ? (
                        <Image
                          src={item.url ?? ''}
                          alt={item.caption || `Photo ${i + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partners */}
            {partners.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Partenaires & Sponsors</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {partners.map((partner: any, i: number) => (
                    <div
                      key={partner.id || i}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
                    >
                      <div                       className="w-16 h-16 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                        {partner.logoUrl ? (
                          <Image src={partner.logoUrl ?? ''} alt={partner.name} fill className="object-contain" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                        ) : (
                          <Handshake size={24} className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">
                        {partner.name}
                      </p>
                      {partner.isSponsor && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Sponsor
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Ticket Types */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Billets</h3>
              {tickets.length === 0 ? (
                <div className="text-center py-6">
                  <Ticket size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun billet disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket: any) => {
                    const sold = ticket.soldCount || 0;
                    const total = ticket.quantity || 0;
                    const remaining = total > 0 ? total - sold : -1;
                    const isSoldOut = total > 0 && remaining <= 0;

                    return (
                      <div
                        key={ticket.id}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all',
                          isSoldOut
                            ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                            : 'border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 hover:border-indigo-300 dark:hover:border-indigo-700'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{ticket.name}</h4>
                            {ticket.type && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                {ticket.type}
                              </span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {ticket.price > 0 ? `${Number(ticket.price).toLocaleString()} FCFA` : 'Gratuit'}
                          </span>
                        </div>

                        {total > 0 && (
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className={cn('font-medium', remaining > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                              {isSoldOut ? 'Épuisé' : `${remaining} restante${remaining > 1 ? 's' : ''}`}
                            </span>
                            <span className="text-gray-400">{sold}/{total} vendus</span>
                          </div>
                        )}

                        {ticket.benefits && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{ticket.benefits}</p>
                        )}

                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          disabled={isSoldOut || isPast}
                          className={cn(
                            'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                            isSoldOut || isPast
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                          )}
                        >
                          {isSoldOut ? 'Épuisé' : isPast ? 'Terminé' : 'Réserver'}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Horaire</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {endDate && ` - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                {e.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lieu</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{e.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{e.participantCount || 0}</p>
                  </div>
                </div>
                {e.capacity && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Users size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Capacité</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{e.capacity}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedTicket && slug && eventId && (
        <BookingModal
          eventId={eventId}
          slug={slug}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
