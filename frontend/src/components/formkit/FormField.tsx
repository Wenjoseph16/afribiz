'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  help?: string;
  required?: boolean;
  hint?: string; // aide contextuelle à droite du label
  className?: string;
  children: ReactNode;
}

/**
 * FormKit — FormField
 * Wrapper accessible : label + contenu + erreur + aide contextuelle.
 * Tous les champs du socle l'utilisent pour une cohérence totale.
 */
export function FormField({
  label,
  htmlFor,
  error,
  help,
  required,
  hint,
  className,
  children,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const helpId = htmlFor && !error ? `${htmlFor}-help` : undefined;

  return (
    <div className={cn('w-full', className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label && (
            <label
              htmlFor={htmlFor}
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
          {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
        </div>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      {help && !error && (
        <p id={helpId} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
}
