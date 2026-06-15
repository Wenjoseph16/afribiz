'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Star, Users, TrendingUp, Calendar } from 'lucide-react';
import type { Business } from '@/types/business';

function Counter({ value, suffix = '', label, icon, duration = 2000 }: { value: number; suffix?: string; label: string; icon: React.ReactNode; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="flex items-start gap-3 p-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/10 to-emerald-50 dark:from-brand/20 dark:to-emerald-900/20 flex items-center justify-center text-brand shrink-0">
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{count}</span>
          {suffix && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{suffix}</span>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function BusinessStats({ business, productsCount, servicesCount }: { business: Business; productsCount?: number; servicesCount?: number }) {
  const stats = [
    { value: business.reviewCount || 0, suffix: ' avis', label: 'Avis clients', icon: <Star className="w-5 h-5" /> },
    { value: business.employeeCount || 0, suffix: '', label: 'Employes', icon: <Users className="w-5 h-5" /> },
    { value: business.foundedYear ? new Date().getFullYear() - business.foundedYear : 0, suffix: ' ans', label: "D'experience", icon: <Calendar className="w-5 h-5" /> },
  ].filter(s => s.value > 0);

  if (business.modules.includes('PRODUCTS')) {
    stats.push({ value: productsCount || 0, suffix: '', label: 'Produits disponibles', icon: <ShoppingBag className="w-5 h-5" /> });
  }
  if (business.modules.includes('SERVICES')) {
    stats.push({ value: servicesCount || 0, suffix: '', label: 'Services proposes', icon: <TrendingUp className="w-5 h-5" /> });
  }

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.slice(0, 5).map((stat, i) => (
        <Counter key={i} {...stat} duration={2000 + i * 300} />
      ))}
    </div>
  );
}
