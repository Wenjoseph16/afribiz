'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  isImpersonating,
  getImpersonationTarget,
  stopImpersonation,
  type ImpersonationTarget,
} from '@/lib/impersonation';

export function ImpersonationBanner() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [target, setTarget] = useState<ImpersonationTarget | null>(null);

  useEffect(() => {
    const check = () => {
      setActive(isImpersonating());
      setTarget(getImpersonationTarget());
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, []);

  if (!active) return null;

  const handleExit = () => {
    stopImpersonation();
    setActive(false);
    setTarget(null);
    router.push('/dashboard/admin');
    router.refresh();
  };

  return (
    <div className="bg-sky-600 text-gray-900 dark:text-white text-sm px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 shrink-0" />
        <p className="truncate">
          <strong>Mode voir-comme (lecture seule)</strong>
          {target
            ? ` — vous observez le compte de ${target.firstName} ${target.lastName} (${target.email})`
            : ''}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleExit}
        className="text-gray-900 dark:text-white hover:bg-sky-700 shrink-0 border border-white/30"
      >
        <LogOut className="h-4 w-4" />
        Quitter et revenir admin
      </Button>
    </div>
  );
}
