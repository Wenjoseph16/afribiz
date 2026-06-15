'use client';

import Link from 'next/link';
import {
  Camera, Film, Radio, TrendingUp, ArrowRight,
  Play, Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';

export default function DeveloperMediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Hub"
        description="Créez et gérez vos contenus vidéo pour promouvoir vos modules"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/developer/media/stories" className="group">
          <Card padding="lg" variant="default" className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Stories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Contenus éphémères 24h</p>
              </div>
            </div>
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
          </Card>
        </Link>

        <Link href="/dashboard/developer/media/shorts" className="group">
          <Card padding="lg" variant="default" className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Shorts</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vidéos verticales 30s-2min</p>
              </div>
            </div>
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
          </Card>
        </Link>

        <Link href="/dashboard/developer/media/lives" className="group">
          <Card padding="lg" variant="default" className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Lives</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Démos et formations en direct</p>
              </div>
            </div>
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
          </Card>
        </Link>
      </div>

      <Card padding="lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pourquoi publier du contenu vidéo ?</h3>
        <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <Play className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Les stories génèrent 2x plus de clics que les publications statiques</span>
          </li>
          <li className="flex items-start gap-2">
            <Play className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Les shorts permettent de présenter vos modules en action</span>
          </li>
          <li className="flex items-start gap-2">
            <Play className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <span>Les lives augmentent la confiance et les installations de modules</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
