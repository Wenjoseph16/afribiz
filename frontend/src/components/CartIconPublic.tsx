'use client';

import Link from 'next/link';
import { ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { useCart } from '@/features/hooks';

export function CartIconPublic() {
  const { data: cartData, isLoading } = useCart();
  const cartItems = (cartData as { items?: Array<{ quantity: number }> })?.items || [];
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return (
    <Link href="/dashboard/cart" className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
      <ShoppingCartIcon className="h-5 w-5" />
      {!isLoading && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand rounded-full ring-2 ring-background">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
