'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, Gift, Share2, Copy, Check, Users, TrendingUp, Award, Loader, ExternalLink, Mail, ChevronRight, Star, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useMyReferralCode, useMyReferrals, useMyReferralRewards, useReferralStats, useInviteReferral } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONVERTED: { label: 'Converti', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EXPIRED: { label: 'Expiré', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const REWARD_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  AWARDED: { label: 'Obtenue', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  EXPIRED: { label: 'Expirée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'invite' | 'history'>('overview');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const { data: referralData, isLoading: loadingCode } = useMyReferralCode();
  const { data: referrals = [], isLoading: loadingReferrals } = useMyReferrals();
  const { data: rewards = [], isLoading: loadingRewards } = useMyReferralRewards();
  const { data: stats, isLoading: loadingStats } = useReferralStats();
  const inviteReferral = useInviteReferral();

  const code = referralData?.code || '';
  const shareUrl = referralData?.shareUrl || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins-moi sur AfriBiz',
          text: `Inscris-toi sur AfriBiz avec mon code ${code} et reçois des avantages !`,
          url: shareUrl,
        });
      } catch (e) { console.error(e); }
    } else {
      handleCopy();
    }
  };

  const handleInvite = () => {
    setInviteError('');
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      setInviteError('Email invalide');
      return;
    }
    inviteReferral.mutate(inviteEmail.trim(), {
      onSuccess: () => {
        setInviteEmail('');
      },
      onError: (err: any) => {
        setInviteError(err?.response?.data?.error || 'Erreur lors de l\'invitation');
      },
    });
  };

  const isLoading = loadingCode || loadingReferrals || loadingRewards || loadingStats;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Parrainage</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Invitez vos amis et gagnez des récompenses</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><Users className="w-5 h-5 text-brand" /></div>
            <div>
              <p className="text-[10px] text-gray-500">Total parrainages</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalReferrals || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500">Convertis</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.convertedReferrals || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500">Taux de conversion</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.conversionRate || 0}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><Award className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500">Points gagnés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalPointsEarned || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Votre code de parrainage</h3>
            <p className="text-xs text-gray-500">Partagez ce code pour inviter vos amis</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-mono text-sm font-bold text-brand tracking-wider text-center">
              {code || '---'}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {code && (
          <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl mb-6">
            <p className="text-xs text-gray-500 mb-2">Lien de partage</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-xs text-gray-600 dark:text-gray-300 bg-transparent outline-none truncate"
              />
              <button onClick={handleCopy} className="text-xs text-brand hover:text-brand/80 font-medium shrink-0">
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'overview', label: 'Aperçu' },
            { key: 'invite', label: 'Inviter' },
            { key: 'history', label: 'Historique' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* How it works */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Comment ça marche</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '1', icon: Share2, title: 'Partagez', desc: 'Partagez votre code ou lien avec vos amis' },
                  { step: '2', icon: UserPlus, title: 'Ils s\'inscrivent', desc: 'Vos amis créent un compte avec votre code' },
                  { step: '3', icon: Gift, title: 'Gagnez des points', desc: 'Recevez 100 points de fidélité par filleul' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent referrals */}
            {referrals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Parrainages récents</h4>
                <div className="space-y-2">
                  {referrals.slice(0, 5).map((ref: any) => {
                    const s = STATUS_CONFIG[ref.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {ref.referee ? `${ref.referee.firstName} ${ref.referee.lastName}` : 'En attente d\'inscription'}
                            </p>
                            <p className="text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(ref.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent rewards */}
            {rewards.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Récompenses obtenues</h4>
                <div className="space-y-2">
                  {rewards.slice(0, 5).map((reward: any) => {
                    const s = REWARD_STATUS[reward.status] || REWARD_STATUS.PENDING;
                    return (
                      <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Award className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {reward.points ? `${reward.points} points` : `${formatPrice(Number(reward.amount))}`}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{reward.type.toLowerCase()}</p>
                          </div>
                        </div>
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {referrals.length === 0 && rewards.length === 0 && (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Commencez à parrainer vos amis pour gagner des récompenses</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invite' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Inviter par email</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="email@exemple.com"
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  />
                </div>
                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteReferral.isPending}>
                  {inviteReferral.isPending ? <Loader className="h-4 w-4 animate-spin" /> : 'Inviter'}
                </Button>
              </div>
              {inviteError && <p className="text-xs text-red-500 mt-2">{inviteError}</p>}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Partager sur les réseaux</h4>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleShare} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />Partager le lien
                </Button>
                <Button variant="outline" onClick={handleCopy} className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />Copier le code
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {referrals.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Parrainages ({referrals.length})
                </h4>
                <div className="space-y-2">
                  {referrals.map((ref: any) => {
                    const s = STATUS_CONFIG[ref.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {ref.referee ? `${ref.referee.firstName} ${ref.referee.lastName}` : 'En attente d\'inscription'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Code: <span className="font-mono font-medium">{ref.code}</span>
                              {' · '}
                              {new Date(ref.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rewards.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Récompenses ({rewards.length})
                </h4>
                <div className="space-y-2">
                  {rewards.map((reward: any) => {
                    const s = REWARD_STATUS[reward.status] || REWARD_STATUS.PENDING;
                    return (
                      <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            reward.type === 'POINTS' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                          }`}>
                            {reward.type === 'POINTS' ? (
                              <Award className="h-4 w-4 text-purple-600" />
                            ) : (
                              <Gift className="h-4 w-4 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {reward.points ? `${reward.points} points` : `${formatPrice(Number(reward.amount))}`}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{reward.type.toLowerCase()}</p>
                          </div>
                        </div>
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {referrals.length === 0 && rewards.length === 0 && (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun parrainage pour le moment</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
