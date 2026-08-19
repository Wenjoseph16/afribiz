'use client';

import { useState, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Link2, Check, Download, QrCode, Store } from 'lucide-react';
import { getSiteUrl } from '@/lib/config';

interface BusinessQrModalProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
  slug: string;
  logo?: string | null;
}

/**
 * QR code de la vitrine publique, depuis le dashboard business.
 * Téléchargement du QR en PNG (à imprimer / afficher en boutique).
 */
export function BusinessQrModal({ open, onClose, businessName, slug, logo }: BusinessQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [dlError, setDlError] = useState(false);

  const url = `${getSiteUrl()}/business/${slug}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copiez le lien :', url);
    }
  }, [url]);

  const downloadPng = useCallback(() => {
    try {
      const canvas = document.querySelector<HTMLCanvasElement>('#afribiz-dash-qr');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `afribiz-qr-${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDlError(false);
    } catch {
      // Canvas « tainted » (logo cross-origin sans CORS) → impossible d'exporter le PNG.
      // Fallback : ouvrir la vitrine pour que le client copie / imprime le QR affiché.
      setDlError(true);
      window.open(url, '_blank');
    }
  }, [slug, url]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`QR code ${businessName}`}
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
              <img src={logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
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
                <QrCode className="w-3 h-3" /> QR de la vitrine publique
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
            <QRCodeCanvas
              id="afribiz-dash-qr"
              value={url}
              size={180}
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
              Affichez-le en boutique, sur vos flyers ou vos réseaux sociaux
            </p>
          </div>

          {/* Lien public */}
          <div className="w-full flex items-center gap-2 p-2 pl-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">{url}</span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-brand text-gray-900 dark:text-white hover:bg-brand-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          {/* Téléchargement PNG */}
          <button
            onClick={downloadPng}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Download className="w-4 h-4" />
            Télécharger le QR (PNG)
          </button>
          {dlError && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center">
              Export impossible avec le logo — utilisez le QR affiché ou copiez le lien.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
