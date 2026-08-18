'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateShareButtonProps {
  /** Code d'affiliation du produit */
  affiliateCode?: string;
  /** Nom du produit (pour le message WhatsApp) */
  productName: string;
  /** Prix du produit */
  price?: number;
  /** Devise */
  currency?: string;
  /** Slug du produit (pour l'URL de la fiche) */
  productSlug?: string;
  /** Classe CSS */
  className?: string;
}

/**
 * Chantier 10 — AffiliateShareButton
 *
 * Bouton de partage affiliation pour les fiches produit.
 * Le client peut partager le produit via WhatsApp ou copier le lien.
 * Chaque clic via le lien d'affiliation est tracké.
 *
 * Réalité africaine : WhatsApp est le canal #1 de partage.
 */
export function AffiliateShareButton({
  affiliateCode,
  productName,
  price,
  currency = 'FCFA',
  productSlug,
  className,
}: AffiliateShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!affiliateCode) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${affiliateCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const priceText = price ? ` pour ${price.toLocaleString()} ${currency}` : '';
    const text = `Découvre "${productName}"${priceText} ! 🛍️\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Partager
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <LinkIcon className="w-4 h-4 text-gray-400" />
            )}
            {copied ? 'Copié !' : 'Copier le lien'}
          </button>
        </div>
      )}
    </div>
  );
}
