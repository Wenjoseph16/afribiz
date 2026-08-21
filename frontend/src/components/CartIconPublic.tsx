'use client';

import { ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export function CartIconPublic() {
  const itemCount = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);

  return (
    <button
      onClick={openDrawer}
      className="relative p-2.5 rounded-xl hover:bg-emerald-500/10 text-white/50 hover:text-emerald-400 transition-all duration-200 group"
      aria-label="Voir le panier"
    >
      <ShoppingCartIcon className="h-5 w-5 group-hover:scale-105 transition-transform duration-200" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-slate-950 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
