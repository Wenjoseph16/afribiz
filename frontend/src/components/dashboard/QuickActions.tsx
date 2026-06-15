'use client';

import { Search, ShoppingBag, Calendar, Compass, Heart, Briefcase, Code } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const actions = [
  { label: 'Découvrir des business', href: '/dashboard/explore', icon: Compass, color: 'text-brand bg-brand-50' },
  { label: 'Rechercher un produit', href: '/dashboard/explore?type=product', icon: Search, color: 'text-blue-600 bg-blue-50' },
  { label: 'Rechercher un service', href: '/dashboard/explore?type=service', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50' },
  { label: 'Rechercher un événement', href: '/dashboard/explore?type=event', icon: Calendar, color: 'text-orange-600 bg-orange-50' },
  { label: 'Consulter ses favoris', href: '/dashboard/favorites', icon: Heart, color: 'text-red-600 bg-red-50' },
  { label: 'Devenir Business', href: '/dashboard/become-business', icon: Briefcase, color: 'text-brand bg-brand-50' },
  { label: 'Devenir Développeur', href: '/dashboard/become-developer', icon: Code, color: 'text-indigo-600 bg-indigo-50' },
];

export function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions rapides</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white',
              'hover:border-brand/20 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200',
              'group'
            )}
          >
            <div className={cn('p-2 rounded-lg group-hover:scale-110 transition-transform duration-200', action.color)}>
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
