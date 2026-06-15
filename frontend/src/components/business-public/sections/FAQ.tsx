'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  faqs?: FAQItem[];
}

const DEFAULT_FAQS: FAQItem[] = [
  { question: 'Quels sont vos horaires d\'ouverture ?', answer: 'Consultez nos horaires dans la section contact ou sur la page d\'accueil.' },
  { question: 'Comment puis-je passer une commande ?', answer: 'Vous pouvez parcourir nos produits et services directement sur cette page, puis cliquer sur "Commander" ou nous contacter.' },
  { question: 'Quels moyens de paiement acceptez-vous ?', answer: 'Nous acceptons TMoney, Flooz, Wave, carte bancaire, virement et espèces selon la configuration de notre entreprise.' },
  { question: 'Proposez-vous la livraison ?', answer: 'Si la livraison est activée, vous pouvez choisir cette option lors de votre commande. Les frais dépendent de votre zone.' },
  { question: 'Comment puis-vous contacter pour une réclamation ?', answer: 'Utilisez notre formulaire de contact ou envoyez-nous un message directement depuis la plateforme.' },
];

export function FAQ({ faqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = faqs?.length ? faqs : DEFAULT_FAQS;

  return (
    <section id="section-faq" className="scroll-mt-24">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Questions fréquentes
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Tout ce que vous devez savoir
        </p>
      </div>

      <div className="space-y-3 max-w-3xl">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ml-4',
                  openIndex === index && 'rotate-180'
                )}
              />
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
