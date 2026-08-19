'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Share2, ExternalLink, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  businessSlug: string;
  businessName: string;
}

export function OnboardingSuccess({ businessSlug, businessName }: Props) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const publicUrl = `https://afribiz.app/business/${businessSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    addToast({ title: 'Lien copié !', variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Découvrez ${businessName} sur AfriBiz : ${publicUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Félicitations ! 🎉</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Votre vitrine <strong>{businessName}</strong> est prête et live !
          </p>
        </div>

        {/* QR Code placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-white/10 p-6 inline-block">
          <div className="w-40 h-40 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`}
              alt="QR Code"
              className="w-full h-full"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Scannez pour voir votre page</p>
        </div>

        {/* Lien */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium break-all">
            🔗 {publicUrl}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copié ✓' : 'Copier le lien'}
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 rounded-xl text-sm font-medium text-white hover:bg-green-700 transition-all"
            >
              <Share2 className="h-4 w-4" />
              Partager via WhatsApp
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-gray-100 dark:border-white/5">
          <Link
            href={`/business/${businessSlug}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            Voir ma vitrine
          </Link>
          <Link
            href="/dashboard/business"
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            Aller au dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
