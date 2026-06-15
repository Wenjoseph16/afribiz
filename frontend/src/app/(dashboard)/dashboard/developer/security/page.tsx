'use client';

import { Shield, Smartphone, Laptop, Globe, AlertTriangle, Key, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LOGIN_LOG = [
  { date: '2026-06-05 08:32', device: 'Chrome / Windows', location: 'Abidjan, CI', success: true },
  { date: '2026-06-04 19:15', device: 'Safari / iPhone', location: 'Abidjan, CI', success: true },
  { date: '2026-06-04 14:02', device: 'Firefox / MacOS', location: 'Dakar, SN', success: true },
  { date: '2026-06-03 22:45', device: 'Edge / Android', location: 'Lomé, TG', success: false },
];

export default function SecurityPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sécurité"
        description="Paramètres de sécurité de votre compte développeur"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Sécurité' },
        ]}
      />

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Key className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mot de passe</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Modifiez votre mot de passe régulièrement</p>
          </div>
        </div>
        <Button variant="secondary" size="sm">Changer le mot de passe</Button>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Shield className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Authentification à deux facteurs (2FA)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ajoutez une couche de sécurité supplémentaire</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
          </label>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><Laptop className="h-5 w-5" /></div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sessions actives</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Appareils connectés à votre compte</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-red-500">
            <LogOut className="h-4 w-4" />
            Tout déconnecter
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { device: 'Chrome / Windows', ip: '197.148.56.23', location: 'Abidjan, CI', time: 'Actif maintenant', current: true, icon: Laptop },
            { device: 'Safari / iPhone 15', ip: '197.148.56.23', location: 'Abidjan, CI', time: 'Il y a 2h', current: false, icon: Smartphone },
            { device: 'Firefox / MacOS', ip: '102.36.89.12', location: 'Dakar, SN', time: 'Il y a 1j', current: false, icon: Laptop },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <s.icon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.device}</p>
                  {s.current && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">Actuelle</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">IP {s.ip} · {s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-600">Déconnecter</Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Shield className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Journal de connexion</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Historique des connexions récentes</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Date</th>
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Appareil</th>
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Localisation</th>
                <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {LOGIN_LOG.map((h, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{h.date}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{h.device}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{h.location}</td>
                  <td className="py-3 px-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      h.success ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    )}>
                      {h.success ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {h.success ? 'Succès' : 'Échec'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
