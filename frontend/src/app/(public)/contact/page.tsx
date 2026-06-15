'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const contactMethods = [
  { icon: Mail, label: 'Email', value: 'contact@afribiz.com', href: 'mailto:contact@afribiz.com' },
  { icon: MessageSquare, label: 'WhatsApp', value: '+228 90 00 00 00', href: 'https://wa.me/22890000000' },
  { icon: Phone, label: 'Téléphone', value: '+228 90 00 00 00', href: 'tel:+22890000000' },
  { icon: MapPin, label: 'Adresse', value: 'Lomé, Togo', href: null },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* Hero + Form */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(5,150,105,0.08),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-sm font-medium mb-6 border border-brand/10">
              <Sparkles className="h-3.5 w-3.5" />
              Contact
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Contactez-nous
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Une question, une suggestion ? Notre équipe est là pour vous aider.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Contact Info */}
            <motion.div {...fadeInUp} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Nos coordonnées</h2>
              {contactMethods.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-brand dark:hover:text-brand-400 transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              {submitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-8 sm:p-10 text-center border border-emerald-200 dark:border-emerald-800 h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Message envoyé !</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Envoyez-nous un message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom complet</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sujet</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                      <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm resize-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-brand to-emerald-400 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 transition-all duration-200"
                    >
                      Envoyer le message
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
