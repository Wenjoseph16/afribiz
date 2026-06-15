'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import type { Business, BusinessHour } from '@/types/business';

interface ContactProps {
  business: Business;
}

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function Contact({ business }: ContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiClient.createSupportTicket({
        subject: `Contact depuis la page publique - ${formData.name}`,
        description: `De: ${formData.name} (${formData.email})\n\n${formData.message}`,
      });
      setSent(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch {
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      setFormData({ name: '', email: '', message: '' });
    } finally {
      setSending(false);
    }
  };

  const sortedHours = [...(business.hours || [])].sort((a, b) => a.day - b.day);

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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Message envoyé !</h3>
              <p className="text-sm text-gray-500 mt-2">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom complet</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="Votre nom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" required value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                <textarea required rows={4} value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                  placeholder="Votre message..." />
              </div>
              <Button type="submit" className="w-full" isLoading={sending}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le message
              </Button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          {business.phone && (
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Téléphone</p>
                <a href={`tel:${business.phone}`} className="text-sm text-brand hover:underline">{business.phone}</a>
              </div>
            </div>
          )}
          {business.email && (
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                <a href={`mailto:${business.email}`} className="text-sm text-brand hover:underline">{business.email}</a>
              </div>
            </div>
          )}
          {business.address && (
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Adresse</p>
                <p className="text-sm text-gray-500">{business.address}, {business.city}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Horaires</p>
              {sortedHours.length > 0 ? (
                <div className="space-y-1">
                  {sortedHours.map((h: BusinessHour) => (
                    <div key={h.day} className="flex justify-between text-sm">
                      <span className="text-gray-500">{DAY_LABELS[h.day]}</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {h.isClosed ? 'Fermé' : `${h.open || '?'} - ${h.close || '?'}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Non renseignés</p>
              )}
            </div>
          </div>
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WhatsApp</p>
                <p className="text-sm text-emerald-600">{business.whatsapp}</p>
              </div>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
