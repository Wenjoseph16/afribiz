'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  icon: ReactNode;
  color: string;
  title: string;
  description: string;
  time: string;
  status?: { label: string; variant: string };
}

interface ActivityFeedProps {
  activities: Activity[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Clock className="h-8 w-8 mb-2" />
        <p className="text-sm">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className={cn('flow-root', className)}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Fil d&apos;activité
      </h3>
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {index < activities.length - 1 && (
                <span
                  className="absolute left-5 top-10 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start gap-4">
                <div className={cn('p-2 rounded-lg', activity.color)}>
                  {activity.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
