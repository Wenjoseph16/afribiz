'use client';

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            logger.info('PWA: Service Worker registered with scope:', registration.scope);
          },
          (err) => {
            logger.warn('PWA: Service Worker registration failed:', err);
          }
        );
      });
    }

    if ('PushManager' in window) {
      let deferredPrompt: Event | null = null;

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        logger.info('PWA: beforeinstallprompt fired — app can be installed');

        setTimeout(() => {
          if (deferredPrompt) {
            (deferredPrompt as any).prompt();
            deferredPrompt = null;
          }
        }, 30000);
      });

      window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        logger.info('PWA: App was installed');
      });
    }
  }, []);

  return null;
}
