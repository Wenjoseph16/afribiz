'use client';

import { FormEvent, ReactNode } from 'react';
import { useFormKit } from './useFormKit';

interface ValidatedFormProps<T extends Record<string, unknown>> {
  /** Config des champs : { champ: { initial, rules: [(v, all) => erreur|null] } } */
  fields: { [K in keyof T]: Parameters<typeof useFormKit<T>>[0]['fields'][K] };
  onSubmit?: (values: T) => void | Promise<void>;
  children: (form: ReturnType<typeof useFormKit<T>>) => ReactNode;
  className?: string;
  id?: string;
}

/**
 * FormKit — ValidatedForm
 * Formulaire valide par champ : erreurs progressives sous chaque champ,
 * le submit ne part que si tout est bon. Le rendu est délégué à la fonction enfant
 * qui reçoit le contrôleur du formulaire (values, errors, setValue, handleSubmit…).
 */
export function ValidatedForm<T extends Record<string, unknown>>({
  fields,
  onSubmit,
  children,
  className,
  id,
}: ValidatedFormProps<T>) {
  const form = useFormKit<T>({ fields, onSubmit });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <form id={id} onSubmit={handleSubmit} noValidate className={className}>
      {children(form)}
    </form>
  );
}
