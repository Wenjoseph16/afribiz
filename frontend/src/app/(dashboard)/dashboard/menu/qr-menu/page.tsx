'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Smartphone, Copy, Check, Share2, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function QrMenuPage() {
  const [copied, setCopied] = useState(false);
  const menuUrl = 'https://afribiz.app/mon-business/menu';

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Menu digital</h1><p className="text-sm text-gray-500 dark:text-gray-400">Partagez votre menu avec vos clients</p></div>
      </div>

      {/* QR Code */}
      <Card className="p-8 text-center">
        <div className="max-w-[220px] mx-auto mb-4 p-4 bg-white rounded-xl border-2 border-gray-200">
          <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-white rounded flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={cn('w-2 h-2', Math.random() > 0.5 ? 'bg-black' : 'bg-transparent')} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Scannez pour voir le menu</h3>
        <p className="text-sm text-gray-500 mb-4">Vos clients scannent ce QR code pour accéder à votre menu digital</p>
        <div className="flex items-center justify-center gap-2">
          <Button size="sm"><Download className="w-4 h-4 mr-1.5" />Télécharger le QR</Button>
          <Button variant="secondary" size="sm"><Share2 className="w-4 h-4 mr-1.5" />Partager</Button>
        </div>
      </Card>

      {/* Menu URL */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Smartphone className="w-4 h-4 text-brand" /> URL du menu</h3>
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <code className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">{menuUrl}</code>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-400">Ce lien dirige vers votre menu digital responsive. Partagez-le sur vos réseaux sociaux, WhatsApp ou imprimez-le sur vos flyers.</p>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Comment utiliser le QR Menu</h3>
        <div className="space-y-3">
          {[
            { step: 1, text: 'Imprimez le QR code et placez-le sur chaque table' },
            { step: 2, text: 'Les clients scannent avec leur téléphone' },
            { step: 3, text: 'Ils voient votre menu complet directement sur leur mobile' },
            { step: 4, text: 'Ils peuvent commander, réserver ou vous contacter par WhatsApp' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center shrink-0">{item.step}</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


