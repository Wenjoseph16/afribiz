'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── Stagger entry observer — partagé par toutes les sections vitrine ─── */
export function useStaggerReveal(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible, itemCount };
}

/** Classes d'entrée stagger pour un item de grille. */
export function revealClasses(visible: boolean, idx: number): string {
  return [
    'biz-reveal',
    'transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
    visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-[2px]',
  ].join(' ');
}

export function revealDelay(idx: number): React.CSSProperties {
  return { transitionDelay: `${Math.min(idx * 80, 400)}ms` };
}
