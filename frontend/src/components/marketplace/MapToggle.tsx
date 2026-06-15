'use client';

import { MapPin, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapToggleProps {
  showMap: boolean;
  onToggle: () => void;
}

export default function MapToggle({ showMap, onToggle }: MapToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        showMap
          ? 'bg-brand text-white shadow-sm'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      )}
      title={showMap ? 'Voir la liste' : 'Voir la carte'}
    >
      {showMap ? <List className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
    </button>
  );
}
