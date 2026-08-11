'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Link2, Check, Share2, Store } from 'lucide-react';
import { getSiteUrl } from '@/lib/config';

interface ShareBusinessModalProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
  slug: string;
  logo?: string | null;
}

export function ShareBusinessModal({
  open,
  onClose,
  businessName,
  slug,
  logo,
}: ShareBusinessModalProps) {
  const [copied, setCopied] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const url = `${getSiteUrl()}/business/${slug}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard non disponible (http) — fallback
      window.prompt('Copiez le lien :', url);
    }
  }, [url]);

  if (!open) return null;

  const waText = encodeURIComponent(
    `Découvrez ${businessName} sur AfriBiz 👉 ${url}`
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Partager ${businessName}`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {businessName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Share2 className="w-3 h-3" /> Partagez la vitrine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col items-center gap-4">
          <div className="p-3 rounded-2xl bg-white border border-gray-200 dark:border-gray-700 shadow-sm">
            <QRCodeSVG
              value={url}
              size={168}
              level="M"
              marginSize={1}
              fgColor="#111827"
              bgColor="#FFFFFF"
              imageSettings={
                logo
                  ? {
                      src: logo,
                      height: 36,
                      width: 36,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          <div className="w-full text-center space-y-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Scannez pour découvrir {businessName}
            </p>
            <p className="text-[11px] text-gray-400">
              Chaque business AfriBiz a son lien &amp; QR code unique
            </p>
          </div>

          {/* Lien public */}
          <div className="w-full flex items-center gap-2 p-2 pl-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
              {url}
            </span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-brand text-white hover:bg-brand-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          {/* WhatsApp */}
          <div className="w-full">
            {showWhatsApp ? (
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4-.1.6.4l.9 2.2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1.1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.2 1c.3.2.5.3.6.4.1.2.1.7-.2 1.3z" />
                </svg>
                Envoyer sur WhatsApp
              </a>
            ) : (
              <button
                onClick={() => setShowWhatsApp(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager le lien
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
