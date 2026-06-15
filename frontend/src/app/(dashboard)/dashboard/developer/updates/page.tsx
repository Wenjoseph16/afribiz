'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UpdatesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/developer/versions');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <p className="text-sm text-gray-400">Redirection vers la page Versions...</p>
    </div>
  );
}
