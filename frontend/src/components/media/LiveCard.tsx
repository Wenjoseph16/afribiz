'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Users, Eye } from 'lucide-react';

export function LiveCard({ live }: { live: any }) {
  return (
    <Link
      href={`/live/${live.id}`}
      className="group flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {live.coverImage ? (
          <Image
            src={live.coverImage}
            alt={live.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
            <Play className="w-12 h-12 text-red-500/40" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {live.status === 'LIVE' ? (
            <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" />
              EN DIRECT
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-500/90 text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full" />
              PROGRAMMÉ
            </span>
          )}
          {live.hasEscrow && (
            <span className="px-2 py-1 bg-emerald-600/90 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">
              Escrow
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
          <Eye className="w-3 h-3" />
          {live.viewerCount || 0}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
          <p className="text-white text-sm font-medium truncate">{live.title}</p>
        </div>
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">
            {live.business?.name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {live.business?.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{live._count?.participants || 0} spectateurs</span>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition-all shrink-0">
          Rejoindre
        </div>
      </div>
    </Link>
  );
}
