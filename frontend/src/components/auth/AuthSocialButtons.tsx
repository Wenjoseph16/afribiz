'use client';

import React from 'react';
import { Globe, Share2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';

export const AuthSocialButtons = () => {
  const { notify } = useToast();

  const handleSocialClick = (provider: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    notify({
      title: 'Connexion sociale',
      description: `La connexion avec ${provider} sera bientôt disponible.`,
      variant: 'success' as const,
    });
  };

  return (
    <div className="grid gap-3">
      <Button type="button" variant="outline" className="justify-center py-3" onClick={handleSocialClick('Google')}>
        <Globe className="w-4 h-4" />
        Continuer avec Google
      </Button>
      <Button type="button" variant="outline" className="justify-center py-3" onClick={handleSocialClick('Facebook')}>
        <Share2 className="w-4 h-4" />
        Continuer avec Facebook
      </Button>
      <Button type="button" variant="outline" className="justify-center py-3" onClick={handleSocialClick('Apple')}>
        <Smartphone className="w-4 h-4" />
        Continuer avec Apple
      </Button>
    </div>
  );
};
