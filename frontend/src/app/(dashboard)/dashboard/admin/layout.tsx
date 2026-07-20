'use client';

import { Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette section."
        />
      </div>
    );
  }

  return <>{children}</>;
}
