'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/finance/quotes');
  }, [router]);

  return null;
}
