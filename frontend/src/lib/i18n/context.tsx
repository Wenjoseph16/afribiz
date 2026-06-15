'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import fr from './locales/fr.json';
import en from './locales/en.json';

export type Locale = 'fr' | 'en';

const translations: Record<Locale, Record<string, any>> = { fr, en };

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== 'undefined') {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (_, param) => String(params[param] ?? `{${param}}`));
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Hook de traduction - utilise les mêmes clés que les fichiers JSON
 * @example
 * const { t } = useTranslation();
 * <h1>{t('dashboard.welcome', { name: 'Jean' })}</h1>
 */
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
