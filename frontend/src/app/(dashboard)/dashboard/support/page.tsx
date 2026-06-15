'use client';

import { useState } from 'react';
import {
  HelpCircle, FileText, MessageCircle, Ticket, ChevronDown,
  Search, Mail, BookOpen, Headphones, Send,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

const FAQS = [
  {
    question: 'Comment créer un nouveau produit ?',
    answer: 'Allez dans le module Produits depuis la sidebar, puis cliquez sur "Ajouter un produit". Remplissez les informations et publiez.',
  },
  {
    question: 'Comment configurer les paiements ?',
    answer: 'Rendez-vous dans Paramètres > Paiements pour connecter vos moyens de paiement (Orange Money, MTN, Wave, etc.).',
  },
  {
    question: 'Comment inviter un collaborateur ?',
    answer: 'Dans Paramètres > Utilisateurs, cliquez sur "Inviter un utilisateur" et entrez son email.',
  },
  {
    question: 'Comment personnaliser ma page publique ?',
    answer: 'Allez dans Page publique depuis le menu principal. Vous pouvez modifier le logo, la couverture, la description, les horaires et plus.',
  },
  {
    question: 'Comment gérer les commandes ?',
    answer: 'Le module Commandes vous permet de voir, traiter et suivre toutes les commandes de vos clients.',
  },
  {
    question: 'Comment exporter mes données ?',
    answer: 'Dans Statistiques, cliquez sur "Exporter les données" pour télécharger un rapport au format CSV ou Excel.',
  },
];

export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const filteredFaqs = FAQS.filter(
    (faq) => !search || faq.question.toLowerCase().includes(search.toLowerCase())
  );

  const quickLinks = [
    { label: 'Centre d\'aide', icon: BookOpen, href: '#' },
    { label: 'Documentation API', icon: FileText, href: '#' },
    { label: 'Guide de démarrage', icon: HelpCircle, href: '#' },
    { label: 'Communauté', icon: MessageCircle, href: '#' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Support"
        description="Comment pouvons-nous vous aider ?"
        gradient
      />

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher dans l'aide..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-12 pr-4 py-3.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-brand/30 hover:shadow-card-hover transition-all group"
          >
            <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand group-hover:scale-110 transition-transform">
              <link.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.label}</span>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ */}
        <Card title="Questions fréquentes" className="lg:col-span-1">
          {filteredFaqs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aucun résultat pour &quot;{search}&quot;</p>
          ) : (
            <div className="space-y-1">
              {filteredFaqs.map((faq) => (
                <div key={faq.question} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                    className="w-full flex items-center justify-between py-3.5 text-left"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-4">{faq.question}</span>
                    <ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', openFaq === faq.question && 'rotate-180')} />
                  </button>
                  {openFaq === faq.question && (
                    <div className="pb-3.5">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ticket & Contact */}
        <div className="space-y-6">
          <Card title="Contacter le support">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Notre équipe vous répond sous 24h ouvrées.
            </p>
            <div className="space-y-3">
              <a href="mailto:support@afribiz.ci" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <Mail className="h-4 w-4 text-brand" />
                <span className="text-sm text-gray-700 dark:text-gray-300">support@afribiz.ci</span>
              </a>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <Headphones className="h-4 w-4 text-brand" />
                <span className="text-sm text-gray-700 dark:text-gray-300">+225 01 XX XX XX XX</span>
              </div>
            </div>
          </Card>

          {showTicketForm ? (
            <Card title="Nouveau ticket">
              <div className="space-y-3">
                <Input label="Sujet" placeholder="Résumé du problème" value={ticketSubject} onChange={(e: any) => setTicketSubject(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Décrivez votre problème en détail..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                  />
                </div>
                {ticketSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    Votre ticket a été envoyé avec succès ! Notre équipe vous répondra sous 24h.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="gradient"
                    onClick={async () => {
                      if (!ticketSubject.trim() || !ticketDescription.trim() || ticketLoading) return;
                      setTicketLoading(true);
                      try {
                        await apiClient.createSupportTicket({ subject: ticketSubject, description: ticketDescription });
                        setTicketSuccess(true);
                        setTicketSubject('');
                        setTicketDescription('');
                      } catch (e) { console.error(e); }
                      setTicketLoading(false);
                    }}
                    isLoading={ticketLoading}
                    disabled={!ticketSubject.trim() || !ticketDescription.trim()}
                  >
                    <Send className="h-4 w-4 mr-1.5" />Envoyer
                  </Button>
                  <Button variant="outline" onClick={() => { setShowTicketForm(false); setTicketSuccess(false); }}>Annuler</Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button fullWidth variant="secondary" onClick={() => setShowTicketForm(true)}>
              <Ticket className="h-4 w-4" />
              Ouvrir un ticket
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
