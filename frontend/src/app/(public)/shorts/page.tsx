'use client';

import { Flame } from 'lucide-react';
import { ShortsFeed } from '@/components/stories/ShortsFeed';

export default function ShortsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-500/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Shorts — Pour toi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Découvre les commerces en vidéo. Swipe, like, et commande directement.
          </p>
        </div>
      </div>

      {/* Player TikTok commerce */}
      <ShortsFeed />
    </div>
  );
}
