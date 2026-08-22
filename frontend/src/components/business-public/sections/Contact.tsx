'use client';

import { useState, useCallback } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Star,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import type { Business, BusinessHour } from '@/types/business';
import { cn } from '@/lib/utils';
import { SectionHeader } from '../ui/SectionHeader';

interface ContactProps {
  business: Business;
}

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Réseaux sociaux configurables sur le profil business (vitrine enrichie)
const SOCIALS: {
  key: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  label: string;
  prefix: string;
}[] = [
  { key: 'facebook', label: 'Facebook', prefix: 'https://facebook.com/' },
  { key: 'instagram', label: 'Instagram', prefix: 'https://instagram.com/' },
  { key: 'twitter', label: 'X (Twitter)', prefix: 'https://x.com/' },
  { key: 'linkedin', label: 'LinkedIn', prefix: 'https://linkedin.com/in/' },
  { key: 'tiktok', label: 'TikTok', prefix: 'https://tiktok.com/@' },
];

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

  // Réseaux sociaux renseignés (handle court ou URL complète)
  const socials = SOCIALS.filter((s) => business[s.key as keyof Business]).map((s) => {
    const raw = String(business[s.key as keyof Business]);
    const href = raw.startsWith('http') ? raw : `${s.prefix}${raw.replace(/^@/, '')}`;
    return { ...s, handle: raw.replace(/^@/, ''), href };
  });

  const renderSocialIcon = (key: string) => {
    const cls = 'w-4 h-4 shrink-0';
    switch (key) {
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" className={`${cls} fill-blue-600`} aria-hidden="true">
            <path d="M24 12.07C24 5.44 18.63.07 12 .07S0 5.44 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" className={`${cls} fill-pink-600`} aria-hidden="true">
            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 5.84a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2zm5.1-7.4a.93.93 0 1 1-1.86 0 .93.93 0 0 1 1.86 0zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.7.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.35 2.63 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.63 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.3.27 16.95.07 15.67.01 15.26 0 12 0z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg viewBox="0 0 24 24" className={`${cls} fill-sky-500`} aria-hidden="true">
            <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93L18.9 1.15zm-1.29 19.49h2.04L6.49 3.24H4.3l13.31 17.4z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg viewBox="0 0 24 24" className={`${cls} fill-blue-700`} aria-hidden="true">
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg
            viewBox="0 0 24 24"
            className={`${cls} fill-gray-900 dark:fill-gray-100`}
            aria-hidden="true"
          >
            <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.77a5.76 5.76 0 0 0-.78-.05 5.66 5.66 0 1 0 5.66 5.66V9.9a7.32 7.32 0 0 0 4.28 1.37V8.18a4.28 4.28 0 0 1-3.2-2.36z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section id="section-contact" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader
          eyebrow="Parlons-en"
          title="Nous contacter"
          description="Laissez-nous un message ou retrouvez-nous"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-brand-500" />
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
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-md transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 shrink-0 group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                <p className="text-sm text-gray-500 group-hover:text-brand-600 transition-colors">
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

          {socials.length > 0 && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600">
                  <Share2 className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Nos réseaux sociaux
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand/40 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
                  >
                    {renderSocialIcon(s.key)}
                    <span className="truncate max-w-[110px]">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
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
      </div>
    </section>
  );
}
