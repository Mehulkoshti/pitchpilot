'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * The `beforeinstallprompt` event, which the standard TS lib does not type.
 * Chromium fires it when the app meets the installability criteria (valid
 * manifest + service worker + engagement); calling `prompt()` shows the native
 * install dialog.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Which affordance the toast is showing.
 *
 * - `hidden`: nothing to offer (installed, dismissed, or no signal yet).
 * - `chrome`: Chromium handed us a prompt — one tap installs it.
 * - `ios`: Safari never fires the prompt, so we show the manual Share steps.
 */
type Mode = 'hidden' | 'chrome' | 'ios';

/** Persist a dismissal so the nudge does not return on every visit. */
const DISMISS_KEY = 'pitchpilot:install-dismissed';

/** Delay before offering the iOS hint, so it doesn't jump in on first paint. */
const IOS_HINT_DELAY_MS = 2000;

/**
 * A small, dismissible "install app" toast that slides up from the bottom-left.
 *
 * It appears only when the app is genuinely installable — on Chromium once the
 * browser offers a prompt, on iOS as a manual hint — and never after it has been
 * installed or dismissed. Rendered once at the app root, so it is available on
 * every page. The slide-in is a Tailwind animation, so `prefers-reduced-motion`
 * neutralises it via the global reduced-motion rule.
 */
export function InstallPrompt(): React.JSX.Element | null {
  const [mode, setMode] = useState<Mode>('hidden');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  // Once dismissed, ignore a later beforeinstallprompt without re-reading storage.
  const dismissedRef = useRef(false);

  useEffect(() => {
    const standalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    try {
      dismissedRef.current = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissedRef.current = false;
    }
    if (dismissedRef.current) return;

    const onPrompt = (event: Event): void => {
      if (dismissedRef.current) return;
      // Stop the browser's own mini-infobar; we present our own toast instead.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode('chrome');
    };
    const onInstalled = (): void => {
      dismissedRef.current = true;
      setMode('hidden');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // Safari never fires the prompt, so surface the manual hint after a beat.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      iosTimer = setTimeout(() => {
        if (!dismissedRef.current) setMode('ios');
      }, IOS_HINT_DELAY_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss(): void {
    dismissedRef.current = true;
    setMode('hidden');
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // A private-mode storage failure just means the nudge may return later.
    }
  }

  async function install(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (mode === 'hidden') return null;

  return (
    <aside
      aria-label="Install PitchPilot"
      className="animate-toast-in fixed bottom-4 left-4 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900">Install PitchPilot</p>
          <p className="mt-0.5 text-sm text-ink-700">
            Add it to your home screen — fast, and it works offline on matchday.
          </p>

          {mode === 'chrome' ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-pitch-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-pitch-600"
              >
                <span aria-hidden="true">📲</span>
                Install
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-slate-100"
              >
                Not now
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-700">
              Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink-900"
        >
          <span aria-hidden="true" className="block text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </aside>
  );
}
