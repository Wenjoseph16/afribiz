'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Copy, ExternalLink, QrCode, Share2, ArrowRight, Sparkles, Download } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  businessSlug: string;
  businessName: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function QRCodeSVG({ value, size = 200 }: { value: string; size?: number }) {
  // Simple QR code placeholder — in production, use a library like qrcode.react
  const url = value;
  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-inner"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* QR Code pattern placeholder — grid of squares */}
        {Array.from({ length: 20 }).map((_, row) =>
          Array.from({ length: 20 }).map((_, col) => {
            // Deterministic pattern based on position
            const seed = (row * 31 + col * 17 + url.length) % 10;
            const isFilled = seed < 4 || (row < 7 && col < 7) || (row < 7 && col > 12) || (row > 12 && col < 7);
            if (!isFilled) return null;
            return (
              <rect
                key={`${row}-${col}`}
                x={col * 10}
                y={row * 10}
                width={9}
                height={9}
                rx={1}
                fill="#111827"
              />
            );
          })
        )}
        {/* Center logo area */}
        <rect x="70" y="70" width="60" height="60" rx="12" fill="white" />
        <text x="100" y="108" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#059669">
          AfriBiz
        </text>
      </svg>
    </div>
  );
}

export function OnboardingSuccess({ businessSlug, businessName }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);
  const publicUrl = `https://afribiz.app/${businessSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      notify({ title: 'Lien copié !', description: 'Partagez-le avec vos clients.', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({ title: 'Erreur', description: 'Impossible de copier le lien.', variant: 'error' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} sur AfriBiz`,
          text: `Découvrez ${businessName} sur AfriBiz !`,
          url: publicUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Félicitations ! 🎉
          </h1>
          <p className="text-gray-500 dark:text-white/40 max-w-sm mx-auto">
            Votre vitrine <strong>{businessName}</strong> est maintenant <span className="text-emerald-500 font-semibold">en ligne</span> et prête à recevoir des clients.
          </p>
        </motion.div>

        {/* QR Code + Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-4"
        >
          {/* QR Code */}
          <div className="flex justify-center">
            <QRCodeSVG value={publicUrl} size={180} />
          </div>
          <p className="text-xs text-gray-400 dark:text-white/30">
            Scannez pour voir votre page publique
          </p>

          {/* Link */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3">
            <span className="flex-1 text-sm text-gray-700 dark:text-white/70 font-medium truncate">
              {publicUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" />
              Partager via WhatsApp
            </button>
            <Link
              href={`/${businessSlug}`}
              target="_blank"
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 font-medium text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Voir
            </Link>
          </div>
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5"
        >
          <p className="text-xs text-gray-400 dark:text-white/30 mb-4 uppercase tracking-wider font-semibold">
            Prochaines étapes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <button
              onClick={() => router.push('/dashboard/business')}
              className="p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Dashboard</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">Configurez votre business</p>
                </div>
              </div>
            </button>
            <Link
              href="/marketplace"
              className="p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Marketplace</p>
                  <p className="text-xs text-gray-400 dark:text-white/30">Explorez la place de marché</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
