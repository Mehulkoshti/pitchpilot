'use client';

import { useEffect, useState } from 'react';

/**
 * A live banner telling fans the network has dropped — and, importantly, that
 * the app still works.
 *
 * A stadium bowl on matchday is one of the worst mobile-network environments
 * there is, so "you are offline" is a normal state here, not an error. The
 * message names what still works so fans do not give up on the app.
 */
export function OfflineIndicator(): React.JSX.Element | null {
  // Starts optimistic: `navigator.onLine` cannot be read while server-rendering,
  // and assuming online avoids a hydration mismatch. The effect corrects it.
  const [isOffline, setOffline] = useState(false);

  useEffect(() => {
    const sync = (): void => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="bg-flood-400 px-4 py-2 text-center text-sm font-medium text-ink-900"
    >
      <span aria-hidden="true">📶 </span>
      Offline — routes and stadium answers still work on your device.
    </div>
  );
}
