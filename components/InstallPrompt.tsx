'use client';

import { useEffect, useState } from 'react';

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
 * How the app can be installed on this device.
 *
 * - `installable`: Chromium handed us a prompt — one tap installs it.
 * - `ios`: Safari never fires the prompt; installation is manual via Share.
 * - `installed`: already running as an installed app, so nothing to offer.
 * - `unknown`: no signal yet — fall back to the browser-menu hint.
 */
type InstallState = 'unknown' | 'installable' | 'ios' | 'installed';

/** What installing gives the fan — the "features" of the PWA. */
const BENEFITS: ReadonlyArray<{ icon: string; label: string }> = [
  { icon: '📶', label: 'Works offline — routes and answers with no signal' },
  { icon: '⚡', label: 'Opens instantly from your home screen' },
  { icon: '🚫', label: 'No app store, no download — it is just the web' },
];

/**
 * A small install affordance for the landing page.
 *
 * The heading and benefits always render (they describe the app); only the
 * action adapts to the device, so there is no layout shift and no hydration
 * mismatch — the button state is filled in after mount.
 */
export function InstallPrompt(): React.JSX.Element {
  const [state, setState] = useState<InstallState>('unknown');
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Detect the device's install path once on mount. Wrapped in a function
    // (rather than a bare setState in the effect body) to keep the state update
    // out of the synchronous render path — the same pattern as OfflineIndicator.
    const detect = (): void => {
      const standalone =
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(display-mode: standalone)').matches) ||
        // iOS Safari exposes its own standalone flag off navigator.
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (standalone) setState('installed');
      else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setState('ios');
    };
    detect();

    const onPrompt = (event: Event): void => {
      // Stop the browser's own mini-infobar; we present our own button instead.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setState('installable');
    };
    const onInstalled = (): void => {
      setState('installed');
      setDeferred(null);
    };

    // An installed app never fires beforeinstallprompt, so registering
    // unconditionally is harmless and keeps the effect's flow simple.
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install(): Promise<void> {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    // The prompt can only be used once; drop it whatever the fan chose.
    setDeferred(null);
  }

  return (
    <section
      aria-labelledby="install-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="container-page grid items-center gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2
            id="install-heading"
            className="text-2xl font-bold tracking-tight text-ink-900"
          >
            Take PitchPilot with you
          </h2>
          <p className="mt-2 max-w-xl text-ink-700">
            Install it as an app on your phone — the same fast, offline-ready companion,
            one tap from your home screen on matchday.
          </p>

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit.label}
                className="flex items-start gap-2 text-sm text-ink-700"
              >
                <span aria-hidden="true" className="text-base leading-6">
                  {benefit.icon}
                </span>
                {benefit.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:justify-self-end">
          <InstallAction state={state} onInstall={() => void install()} />
        </div>
      </div>
    </section>
  );
}

/** The device-specific call to action. */
function InstallAction({
  state,
  onInstall,
}: {
  state: InstallState;
  onInstall: () => void;
}): React.JSX.Element {
  if (state === 'installed') {
    return (
      <p className="rounded-xl bg-pitch-50 px-5 py-4 text-sm font-medium text-pitch-700">
        <span aria-hidden="true">✓ </span>
        Installed — open PitchPilot from your home screen.
      </p>
    );
  }

  if (state === 'installable') {
    return (
      <button
        type="button"
        onClick={onInstall}
        className="inline-flex items-center gap-2 rounded-xl bg-pitch-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-pitch-600"
      >
        <span aria-hidden="true">📲</span>
        Install app
      </button>
    );
  }

  if (state === 'ios') {
    return (
      <p className="rounded-xl border border-slate-200 px-5 py-4 text-sm text-ink-700">
        On iPhone or iPad, tap <strong>Share</strong> then{' '}
        <strong>Add to Home Screen</strong>.
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-slate-200 px-5 py-4 text-sm text-ink-700">
      Install from your browser menu — look for <strong>Install</strong> or{' '}
      <strong>Add to Home Screen</strong>.
    </p>
  );
}
