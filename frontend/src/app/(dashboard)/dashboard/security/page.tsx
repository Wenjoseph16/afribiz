'use client';

import { useState, useEffect } from 'react';
import { Shield, Smartphone, Laptop, History, Key, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState((user as any)?.twoFactorEnabled || false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // 2FA Setup states
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSessions();
      setSessions(res.data.data?.sessions || res.data.data || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const start2FASetup = async () => {
    try {
      setSetupError('');
      const res = await apiClient.setup2FA();
      setQrCode(res.data.data.qrCode);
      setSetupSecret(res.data.data.secret);
      setShow2FASetup(true);
    } catch (err: any) {
      setSetupError(err?.response?.data?.error || 'Erreur lors de l\'initialisation 2FA');
    }
  };

  const confirm2FASetup = async () => {
    if (verificationCode.length < 6) return;
    try {
      setSetupError('');
      await apiClient.verify2FA(verificationCode);
      setTwoFactorEnabled(true);
      setSetupSuccess(true);
      setShow2FASetup(false);
      setVerificationCode('');
    } catch (err: any) {
      setSetupError(err?.response?.data?.error || 'Code invalide. Réessayez.');
    }
  };

  const cancel2FASetup = () => {
    setShow2FASetup(false);
    setQrCode('');
    setSetupSecret('');
    setVerificationCode('');
    setSetupError('');
  };

  const disable2FA = async () => {
    try {
      setSetupError('');
      await apiClient.disable2FA(disablePassword);
      setTwoFactorEnabled(false);
      setShowDisableConfirm(false);
      setDisablePassword('');
      setSetupSuccess(false);
    } catch (err: any) {
      setSetupError(err?.response?.data?.error || 'Mot de passe incorrect');
    }
  };

  const updatePassword = async () => {
    setPasswordError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('Les mots de passe ne correspondent pas.'); return; }
    if (passwordData.newPassword.length < 6) { setPasswordError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    try {
      await apiClient.updatePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Erreur lors du changement de mot de passe.';
      setPasswordError(message);
    }
  };

  const disconnectSession = async (sessionId: string) => {
    try {
      await apiClient.revokeSession(sessionId);
      loadSessions();
    } catch (err) {
      console.error('Erreur déconnexion session:', err);
    }
  };

  const disconnectAll = async () => {
    try {
      await apiClient.revokeOtherSessions();
      loadSessions();
    } catch (err) {
      console.error('Erreur déconnexion sessions:', err);
    }
  };

  const loginHistory = sessions.map((s: any) => ({
    action: 'Connexion réussie',
    location: s.location || s.city ? `${s.city || ''}, ${s.country || ''}` : 'Localisation inconnue',
    device: s.device || s.userAgent || 'Appareil inconnu',
    time: s.lastActive ? new Date(s.lastActive).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Récemment',
  }));

  if (loading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Sécurité"
        description="Gérez la sécurité de votre compte"
        breadcrumbs={[{ label: 'Sécurité' }]}
      />

      <div className="space-y-6">
        {/* Mot de passe */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Mot de passe</h3>
                <p className="text-xs text-gray-500">Modifiez votre mot de passe régulièrement</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              Modifier
            </Button>
          </div>
          {showPasswordForm && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{passwordError}</p>
              )}
              <div className="flex justify-end">
                <Button size="sm" onClick={updatePassword}>Mettre à jour</Button>
              </div>
            </div>
          )}
        </div>

        {/* Double authentification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400')}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Double authentification</h3>
                <p className="text-xs text-gray-500">
                  {twoFactorEnabled ? 'Activée - Votre compte est protégé' : 'Protégez votre compte avec une vérification en deux étapes'}
                </p>
              </div>
            </div>
            {!twoFactorEnabled ? (
              <Button variant="primary" size="sm" onClick={start2FASetup}>Activer</Button>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setShowDisableConfirm(true)}>Désactiver</Button>
            )}
          </div>

          {/* 2FA Setup QR Code */}
          {show2FASetup && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <p className="text-sm text-gray-600">
                Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center">
                {qrCode && <Image src={qrCode} alt="QR Code 2FA" width={192} height={192} unoptimized />}
              </div>
              {setupSecret && (
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Ou saisissez manuellement cette clé :</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 select-all">{setupSecret}</code>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code de vérification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000 000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-xl tracking-widest px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>
              {setupError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{setupError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={cancel2FASetup}>Annuler</Button>
                <Button size="sm" onClick={confirm2FASetup} disabled={verificationCode.length !== 6}>Vérifier et activer</Button>
              </div>
            </div>
          )}

          {/* 2FA Disable Confirm */}
          {showDisableConfirm && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <p className="text-sm text-red-600">Saisissez votre mot de passe pour désactiver la double authentification.</p>
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
              {setupError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{setupError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowDisableConfirm(false); setDisablePassword(''); setSetupError(''); }}>Annuler</Button>
                <Button variant="danger" size="sm" onClick={disable2FA} disabled={!disablePassword}>Confirmer la désactivation</Button>
              </div>
            </div>
          )}

          {/* Success state */}
          {setupSuccess && !show2FASetup && twoFactorEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              2FA activée avec succès
            </div>
          )}
        </div>

        {/* Appareils connectés */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Appareils connectés</h3>
                <p className="text-xs text-gray-500">{sessions.length} session(s) active(s)</p>
              </div>
            </div>
            {sessions.length > 1 && (
              <Button variant="danger" size="sm" onClick={disconnectAll}>
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Tout déconnecter
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune session active</p>
            ) : sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    {session.device?.toLowerCase().includes('iphone') || session.device?.toLowerCase().includes('samsung') || session.device?.toLowerCase().includes('mobile') ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{session.device || session.userAgent || 'Appareil inconnu'}</span>
                      {session.isCurrent && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">Actuel</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{session.location || 'Localisation inconnue'} · {session.lastActive ? new Date(session.lastActive).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Actif maintenant'}</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button onClick={() => disconnectSession(session.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                    Déconnecter
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Historique de connexion */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Historique de connexion</h3>
              <p className="text-xs text-gray-500">Dernières activités sur votre compte</p>
            </div>
          </div>
          <div className="space-y-2">
            {loginHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun historique disponible</p>
            ) : loginHistory.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{entry.action}</p>
                  <p className="text-xs text-gray-500">{entry.location} · {entry.device}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
