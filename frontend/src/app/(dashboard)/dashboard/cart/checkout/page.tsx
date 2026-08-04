'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';

// Le checkout unifié est la page publique /checkout (même panier local, même flux).
// Cette route est conservée par compatibilité et redirige automatiquement.
export default function LegacyCheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader className="h-8 w-8 animate-spin text-brand" />
    </div>
  );
}
