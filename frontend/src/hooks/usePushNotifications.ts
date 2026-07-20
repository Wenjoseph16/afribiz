'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/apiClient';
import { useToast } from '@/components/ui/ToastProvider';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
    checkSubscription();
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      // SW pas encore prêt
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!('Notification' in window)) {
      notify({
        title: 'Non supporté',
        description: 'Les notifications push ne sont pas supportées par votre navigateur.',
        variant: 'error',
      });
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      notify({
        title: 'Non configuré',
        description: 'Clé VAPID manquante. Configurez NEXT_PUBLIC_VAPID_PUBLIC_KEY.',
        variant: 'error',
      });
      return;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        notify({ title: 'Permission refusée', variant: 'error' });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscribed(true);
        notify({ title: 'Notifications déjà activées', variant: 'success' });
        return;
      }
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      setSubscribed(true);
      try {
        await apiClient.post('/notifications/push-subscribe', {
          subscription: subscription.toJSON(),
        });
      } catch {
        // Backend pas nécessaire pour le statut local
      }
      notify({ title: 'Notifications push activées', variant: 'success' });
    } catch (err: any) {
      notify({
        title: 'Erreur',
        description: err.message || "Impossible de s'abonner.",
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        try {
          await apiClient.delete('/notifications/push-subscribe', { data: { endpoint } });
        } catch {
          // Backend pas nécessaire
        }
      }
      setSubscribed(false);
      notify({ title: 'Notifications push désactivées', variant: 'success' });
    } catch (err: any) {
      notify({
        title: 'Erreur',
        description: err.message || 'Impossible de se désabonner.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  return {
    permission,
    subscribed,
    loading,
    isSupported:
      typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
    subscribe,
    unsubscribe,
  };
}
