'use client';

import { useEffect } from 'react';

/**
 * Registra o Service Worker em produção.
 * Separado do NotificationInit para permitir atualização independente.
 * Segue o padrão canônico estabelecido no l4-comunica.
 */
export default function ServiceWorkerRegistry() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Registra apenas em produção (evita conflitos com HMR do Next.js em dev)
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Registrado com sucesso. Scope:', registration.scope);

          // Verifica se há uma atualização disponível e notifica
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Nova versão disponível. Recarregue para atualizar.');
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Falha no registro:', error);
        });
    }
  }, []);

  return null;
}
