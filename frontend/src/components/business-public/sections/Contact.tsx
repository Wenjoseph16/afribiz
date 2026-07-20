'use client';

import { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import type { Business, BusinessHour } from '@/types/business';
import { cn } from '@/lib/utils';

interface ContactProps {
  business: Business;
}

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export function Contact({ business }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = 'Veuillez saisir votre nom';
    else if (formData.name.trim().length < 2) errs.name = 'Nom trop court (2 caractères minimum)';

    if (!formData.email.trim()) errs.email = 'Veuillez saisir votre email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';

    if (!formData.message.trim()) errs.message = 'Veuillez saisir votre message';
    else if (formData.message.trim().length < 10)
      errs.message = 'Message trop court (10 caractères minimum)';
    else if (formData.message.trim().length > 2000)
      errs.message = 'Message trop long (2000 caractères maximum)';

    return errs;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSending(true);
    try {
      await apiClient.createSupportTicket({
        subject: `Contact depuis la page publique - ${formData.name}`,
        description: `De: ${formData.name} (${formData.email}${formData.phone ? ` - ${formData.phone}` : ''})\n\n${formData.message}`,
      });
      setSent(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      setErrors({
        message: err?.response?.data?.error || "Erreur lors de l'envoi. Veuillez réessayer.",
      });
    } finally {
      setSending(false);
    }
  };

  const sortedHours = [...(business.hours || [])].sort((a, b) => a.day - b.day);
  const displayHours = showAllHours ? sortedHours : sortedHours.slice(0, 4);

  const today = new Date().getDay();
  const todayHours = sortedHours.find((h) => h.day === today);

  const getTodayStatus = () => {
    if (!todayHours || todayHours.isClosed)
      return { label: 'Fermé aujourd\u0027hui', color: 'text-red-500' };
    if (!todayHours.open || !todayHours.close)
      return { label: 'Fermé aujourd\u0027hui', color: 'text-red-500' };
    const now = new Date();
    const [oh, om] = todayHours.open.split(':').map(Number);
    const [ch, cm] = todayHours.close.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    if (nowMin >= openMin && nowMin <= closeMin) {
      if (closeMin - nowMin <= 60) return { label: 'Ferme bientôt', color: 'text-orange-500' };
      return { label: 'Ouvert aujourd\u0027hui', color: 'text-green-500' };
    }
    return { label: 'Fermé maintenant', color: 'text-red-500' };
  };

  const todayStatus = getTodayStatus();

  return (
    <section id="section-contact" className="scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Nous contacter
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Laissez-nous un message ou retrouvez-nous
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Message envoyé avec succès !
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Merci {formData.name} ! {business.name} vous répondra dans les plus brefs délais.
              </p>
              <Button variant="outline" size="sm" className="mt-6" onClick={() => setSent(false)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Envoyez-nous un message
              </h3>
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:border-brand outline-none transition-all',
                    errors.name
                      ? 'border-red-300 focus:ring-red-20'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-brand/20'
                  )}
                  placeholder="Votre nom"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:border-brand outline-none transition-all',
                      errors.email
                        ? 'border-red-300 focus:ring-red-20'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-brand/20'
                    )}
                    placeholder="votre@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Téléphone
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                    placeholder="+229 XX XX XX XX"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, message: e.target.value }));
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:border-brand outline-none transition-all resize-none',
                    errors.message
                      ? 'border-red-300 focus:ring-red-20'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-brand/20'
                  )}
                  placeholder="Votre message..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.message ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={cn(
                      'text-[10px]',
                      formData.message.length > 2000 ? 'text-red-500' : 'text-gray-400'
                    )}
                  >
                    {formData.message.length}/2000
                  </span>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {sending ? 'Envoi en cours...' : 'Envoyer le message'}
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-md transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Téléphone</p>
                <p className="text-sm text-gray-500 group-hover:text-brand transition-colors">
                  {business.phone}
                </p>
              </div>
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                <p className="text-sm text-gray-500 group-hover:text-emerald-600 transition-colors">
                  {business.email}
                </p>
              </div>
            </a>
          )}
          {business.address && (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(business.address + ' ' + (business.city || ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Adresse</p>
                <p className="text-sm text-gray-500">
                  {business.address}
                  {business.city ? `, ${business.city}` : ''}
                </p>
              </div>
            </a>
          )}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Horaires</p>
              </div>
              {todayStatus && (
                <span className={cn('text-xs font-medium', todayStatus.color)}>
                  {todayStatus.label}
                </span>
              )}
            </div>
            {sortedHours.length > 0 ? (
              <>
                <div className="space-y-1">
                  {displayHours.map((h: BusinessHour) => (
                    <div
                      key={h.day}
                      className={cn(
                        'flex justify-between text-sm py-0.5',
                        h.day === today
                          ? 'font-medium text-brand'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      <span>{DAY_LABELS[h.day]}</span>
                      <span>{h.isClosed ? 'Fermé' : `${h.open || '?'} - ${h.close || '?'}`}</span>
                    </div>
                  ))}
                </div>
                {sortedHours.length > 4 && (
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    className="flex items-center gap-1 text-xs text-brand font-medium mt-2 hover:underline"
                  >
                    {showAllHours ? (
                      <>
                        <ChevronUp className="w-3 h-3" /> Voir moins
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" /> Voir tout ({sortedHours.length} jours)
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Non renseignés</p>
            )}
          </div>
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Bonjour, je vous contacte depuis votre page AfriBiz.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 group-hover:scale-110 transition-transform shadow-sm shadow-emerald-500/30">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Nous écrire sur WhatsApp
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Réponse rapide garantie
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-emerald-500 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
