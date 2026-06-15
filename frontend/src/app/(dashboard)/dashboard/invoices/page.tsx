'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/finance/invoices');
  }, [router]);

  return null;
}
