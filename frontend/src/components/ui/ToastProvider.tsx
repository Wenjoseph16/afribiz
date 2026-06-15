'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastMessage {
  title: string;
  description?: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  notify: (message: ToastMessage) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastMessage | null>(null);

  const notify = React.useCallback((message: ToastMessage) => {
    setToast(message);
    setOpen(false);
    window.requestAnimationFrame(() => setOpen(true));
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Viewport className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 p-2 outline-none" />
        {toast && (
          <ToastPrimitive.Root
            open={open}
            onOpenChange={setOpen}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 w-[320px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {toast.variant === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <ToastPrimitive.Title className="font-semibold text-slate-900">{toast.title}</ToastPrimitive.Title>
                {toast.description && (
                  <ToastPrimitive.Description className="text-slate-600">
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
            </div>
            <ToastPrimitive.Close className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:text-slate-600 transition" aria-label="Close">
              ×
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
