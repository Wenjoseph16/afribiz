import { AuthGuard } from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { ImpersonationBanner } from '@/components/dashboard/ImpersonationBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#0a0f1a] dark:bg-[#0a0f1a]">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_50%)] pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.05)_0%,_transparent_50%)] pointer-events-none" />
        <div
          className="fixed inset-0 bg-noise opacity-[0.02] mix-blend-soft-light pointer-events-none"
          aria-hidden="true"
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-lg"
        >
          Aller au contenu principal
        </a>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-full">
            <ImpersonationBanner />
            <Topbar />
            <main id="main-content" className="flex-1 p-4 lg:p-8 overflow-y-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
