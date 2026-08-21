'use client';

import { useState, useCallback, FormEvent } from 'react';

export type FormRule<T = unknown> = (value: T, values: Record<string, unknown>) => string | null;

export interface FormFieldConfig<T = unknown> {
  initial?: T;
  rules?: FormRule<T>[];
}

export interface UseFormKitOptions<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormFieldConfig<T[K]> };
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormKitResult<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  touch: (key: keyof T) => void;
  validateField: (key: keyof T) => string | null;
  validateAll: () => boolean;
  handleSubmit: (e?: FormEvent) => Promise<void>;
  reset: (next?: Partial<T>) => void;
}

/**
 * FormKit — useFormKit
 * Validation par champ, progressive (on ne bloque jamais brutalement) :
 * l'erreur s'affiche sous le champ touché, le submit ne part que si tout est valide.
 * Léger, sans dépendance (pas besoin de react-hook-form pour chaque page).
 */
export function useFormKit<T extends Record<string, unknown>>(
  options: UseFormKitOptions<T>
): UseFormKitResult<T> {
  const { fields, onSubmit } = options;

  const initialValues = useCallback(() => {
    const acc = {} as T;
    (Object.keys(fields) as (keyof T)[]).forEach((key) => {
      acc[key] = (fields[key].initial ?? '') as T[keyof T];
    });
    return acc;
  }, [fields]);

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (key: keyof T): string | null => {
      const config = fields[key];
      if (!config?.rules?.length) return null;
      for (const rule of config.rules) {
        const message = rule(values[key], values as Record<string, unknown>);
        if (message) return message;
      }
      return null;
    },
    [fields, values]
  );

  const validateAll = useCallback(() => {
    const next: Partial<Record<keyof T, string>> = {};
    (Object.keys(fields) as (keyof T)[]).forEach((key) => {
      const message = validateField(key);
      if (message) next[key] = message;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [fields, validateField]);

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      // Re-valider le champ une fois touché (feedback immédiat mais jamais brutal)
      if (touched[key]) {
        const message = fields[key]?.rules?.length
          ? (fields[key].rules as FormRule[]).reduce(
              (acc: string | null, rule: FormRule) =>
                acc ?? rule(value, { ...values, [key]: value } as Record<string, unknown>),
              null
            )
          : null;
        setErrors((prev) => ({ ...prev, [key]: message ?? undefined }));
      }
    },
    [fields, touched, values]
  );

  const touch = useCallback((key: keyof T) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      setTouched(
        Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), {}) as Partial<
          Record<keyof T, boolean>
        >
      );
      if (!validateAll()) return;
      if (!onSubmit) return;
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [fields, validateAll, onSubmit, values]
  );

  const reset = useCallback(
    (next?: Partial<T>) => {
      setValues({ ...initialValues(), ...(next || {}) } as T);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const isValid = (Object.keys(errors) as (keyof T)[]).filter((k) => errors[k]).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    touch,
    validateField,
    validateAll,
    handleSubmit,
    reset,
  };
}
