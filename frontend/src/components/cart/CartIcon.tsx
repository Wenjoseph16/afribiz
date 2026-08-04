'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

interface CartIconProps {
  className?: string;
  linkClassName?: string;
}

export function CartIcon({
  className = '',
  linkClassName = 'relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors',
}: CartIconProps) {
  const itemCount = useCartStore((s) => s.totalItems());

  return (
    <Link href="/dashboard/cart" className={linkClassName}>
      <ShoppingCart className={'h-4 w-4 ' + className} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand rounded-full ring-2 ring-background">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
