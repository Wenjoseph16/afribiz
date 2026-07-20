'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CampaignsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/marketing');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-sm text-gray-500">Redirection vers les campagnes...</p>
    </div>
  );
}
