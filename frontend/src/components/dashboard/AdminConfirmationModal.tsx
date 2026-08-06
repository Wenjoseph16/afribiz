'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface ConfirmationRequest {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  requiresOtp?: boolean;
  onConfirm: (creds: { adminPassword: string; otpCode?: string }) => Promise<void>;
  onCancel: () => void;
}

/**
 * Modale de double validation des actions admin sensibles (G2).
 *
 * L'admin doit re-saisir son mot de passe. Si le backend répond `OTP_REQUIRED`
 * (compte avec 2FA activée), le champ du code 2FA est révélé dynamiquement.
 * Les erreurs s'affichent dans la modale (l'action reste annulée tant que la
 * confirmation n'a pas abouti).
 */
export default function AdminConfirmationModal({ request }: { request: ConfirmationRequest }) {
  const [adminPassword, setAdminPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(request.requiresOtp ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur le champ mot de passe
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  // Touche Échap pour fermer (sauf pendant l'envoi)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) request.onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Saisissez votre mot de passe pour confirmer.');
      return;
    }
    if (showOtp && !otpCode.trim()) {
      setError('Saisissez votre code 2FA.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await request.onConfirm({
        adminPassword: adminPassword.trim(),
        otpCode: showOtp ? otpCode.trim() : undefined,
      });
    } catch (err: any) {
      const data = err?.response?.data;
      const code = data?.data?.code;
      if (code === 'OTP_REQUIRED') {
        setShowOtp(true);
        setError('Code 2FA requis pour confirmer cette action.');
      } else {
        setError(data?.error || err?.message || 'Action refusée. Vérifiez vos identifiants.');
      }
      setAdminPassword('');
      setOtpCode('');
      passwordRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={request.title}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !loading && request.onCancel()}
      />
      <Card className="relative w-full max-w-md z-10" padding="lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 mb-4">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                request.danger
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{request.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {request.description}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="admin-confirm-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Mot de passe administrateur
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="admin-confirm-password"
                ref={passwordRef}
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Confirmez votre identité"
                disabled={loading}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus-ring"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Cette action est sensible : une confirmation par mot de passe est requise.
            </p>
          </div>

          {showOtp && (
            <div className="mb-4">
              <label
                htmlFor="admin-confirm-otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Code 2FA (application d'authentification)
              </label>
              <input
                id="admin-confirm-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                placeholder="6 chiffres"
                disabled={loading}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm tracking-[0.3em] font-mono focus-ring"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={request.onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={request.danger ? 'danger' : 'primary'}
              isLoading={loading}
            >
              <ShieldCheck className="h-4 w-4" />
              {request.confirmLabel || 'Confirmer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
