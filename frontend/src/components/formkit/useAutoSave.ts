'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const PREFIX = 'afribiz:draft:';

function isBrowser() {
  return typeof window !== 'undefined';
}

function safeGet<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Stockage plein ou indisponible : on ignore, le brouillon reste en mémoire.
  }
}

function safeRemove(key: string) {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}

export interface AutoSaveState<T extends object> {
  value: T;
  setValue: <K extends keyof T>(key: K, v: T[K]) => void;
  patch: (partial: Partial<T>) => void;
  reset: (initial?: T) => void;
  savedAt: Date | null;
  isDirty: boolean;
  hasDraft: boolean;
}

/**
 * FormKit — useAutoSave
 * Brouillon multi-appareils (localStorage) avec sauvegarde différée :
 * le gérant qui remplit un formulaire de 15 min ne perd JAMAIS son travail
 * (réalité africaine : coupure réseau, téléphone qui s'éteint…).
 *
 * @param storageKey  Clé unique du brouillon (ex: "checkout:v1")
 * @param initial     Valeurs initiales (fusionnées avec le brouillon existant)
 * @param delay       Délai de sauvegarde (ms), défaut 600
 */
export function useAutoSave<T extends object>(
  storageKey: string,
  initial: T,
  delay = 600
): AutoSaveState<T> {
  const draft = useRef<Record<string, unknown> | null>(safeGet<Record<string, unknown>>(storageKey));

  const [value, setValueState] = useState<T>(() => ({
    ...initial,
    ...(draft.current || {}),
  }) as T);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Réinitialise si les valeurs initiales changent (ex: user connecté) et qu'il n'y a pas de brouillon
    if (!draft.current) {
      setValueState(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (next: T) => {
      safeSet(storageKey, next);
      setSavedAt(new Date());
      setIsDirty(false);
    },
    [storageKey]
  );

  const setValue = useCallback(
    <K extends keyof T>(key: K, v: T[K]) => {
      setValueState((prev) => {
        const next = { ...prev, [key]: v };
        setIsDirty(true);
        return next as T;
      });
    },
    []
  );

  const patch = useCallback((partial: Partial<T>) => {
    setValueState((prev) => {
      const next = { ...prev, ...partial };
      setIsDirty(true);
      return next as T;
    });
  }, []);

  // Sauvegarde différée
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => persist(value), delay);
    return () => clearTimeout(t);
  }, [value, isDirty, delay, persist]);

  const reset = useCallback(
    (nextInitial?: T) => {
      safeRemove(storageKey);
      const base = nextInitial || initial;
      setValueState(base);
      setSavedAt(null);
      setIsDirty(false);
      draft.current = null;
    },
    [initial]
  );

  return {
    value,
    setValue,
    patch,
    reset,
    savedAt,
    isDirty,
    hasDraft: !!draft.current,
  };
}
