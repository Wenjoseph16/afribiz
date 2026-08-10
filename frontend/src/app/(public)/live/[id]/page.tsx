'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LiveViewer } from '@/components/media/LiveViewer';

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link
        href="/lives"
        className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Tous les lives
      </Link>
      <LiveViewer liveId={params.id} />
    </div>
  );
}
