'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/hooks';

interface CartIconProps {
  className?: string;
  linkClassName?: string;
}

export function CartIcon({ className = '', linkClassName = 'relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors' }: CartIconProps) {
  const { data: cartData, isLoading } = useCart();
  
  const cartItems = (cartData as { items?: Array<{ quantity: number }> })?.items || [];
  const itemCount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return (
    <Link href="/dashboard/cart" className={linkClassName}>
      <ShoppingCart className={'h-4 w-4 ' + className} />
      {!isLoading && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand rounded-full ring-2 ring-background">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
