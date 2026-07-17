'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that gives PitchPilot a working offline cold
 * start. Renders nothing.
 *
 * Registration is skipped in development, where a caching worker would serve
 * stale bundles and fight hot reload.
 */
export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = (): void => {
      // A failed registration must never break the page — the app works without
      // the worker, it just loses its offline cold start.
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    };

    // Registering after load keeps the worker off the critical path.
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
