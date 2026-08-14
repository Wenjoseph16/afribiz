'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

const REF_KEY = 'afribiz_ref_code';

/**
 * Lien d'affiliation : /r/:code
 * 1. Résout le lien (public) → article pointé
 * 2. Mémorise le code du parrain (localStorage) → crédité à la prochaine commande payée
 * 3. Redirige vers l'article (le prix affiché est celui du moteur de prix)
 */
export default function AffiliateRedirectPage() {
  const params = useParams<{ code: string }>();
  const code = String(params?.code || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    let alive = true;
    (async () => {
      try {
        const res = await apiClient.resolveAffiliateLink(code);
        const link = res?.data?.data;
        if (!link?.itemType || !link?.itemId) {
          if (alive) setError("Ce lien d'affiliation est invalide ou inactif.");
          return;
        }
        // Mémoriser le parrain pour la prochaine commande payée
        try {
          localStorage.setItem(REF_KEY, code);
        } catch {
          /* stockage indisponible */
        }
        // Résoudre le prix + la page cible via le moteur
        const priceRes = await apiClient.resolveCatalogAttachments([
          { itemType: link.itemType, itemId: link.itemId, quantity: 1 },
        ]);
        const item =
          priceRes?.data?.data?.items?.[`${link.itemType}:${link.itemId}`];
        const path = item?.target?.path;
        if (alive) {
          if (path) {
            window.location.assign(path);
          } else {
            setError("Impossible de résoudre la page de l'article.");
          }
        }
      } catch {
        if (alive) setError("Ce lien d'affiliation est invalide ou inactif.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {error ? error : 'Redirection vers l\'article...'}
      </p>
      {error && (
        <a href="/" className="text-sm text-brand font-medium hover:underline">
          Retour à l'accueil
        </a>
      )}
    </div>
  );
}
