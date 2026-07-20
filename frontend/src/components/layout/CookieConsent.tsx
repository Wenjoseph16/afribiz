'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePrefs = { necessary: true, analytics: false, marketing: false };
const STORAGE_KEY = 'afribiz_cookie_prefs';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    } else {
      try {
        setPrefs(JSON.parse(stored));
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const acceptAll = () => {
    const prefs = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPrefs(prefs);
    setVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS));
    setPrefs(DEFAULT_PREFS);
    setVisible(false);
  };

  const savePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, necessary: true }));
    setPrefs({ ...prefs, necessary: true });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-brand/10 shrink-0">
            <Cookie className="h-5 w-5 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">🍪 Cookies</p>
              <button
                onClick={() => setVisible(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Nous utilisons des cookies pour améliorer votre expérience. En cliquant &quot;Accepter
              tout&quot;, vous consentez à l&apos;utilisation de tous les cookies.
            </p>

            {showDetails && (
              <div className="space-y-3 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={prefs.necessary} disabled className="rounded" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Nécessaires
                    </span>
                    <p className="text-xs text-gray-400">Authentification, sécurité, session</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Analytiques
                    </span>
                    <p className="text-xs text-gray-400">
                      Statistiques d&apos;utilisation, performance
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Marketing</span>
                    <p className="text-xs text-gray-400">
                      Publicités personnalisées, réseaux sociaux
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" onClick={acceptAll}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Accepter tout
              </Button>
              <Button variant="outline" size="sm" onClick={acceptNecessary}>
                Refuser tout
              </Button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Personnaliser
              </button>
              {showDetails && (
                <Button variant="secondary" size="sm" onClick={savePreferences}>
                  Enregistrer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
