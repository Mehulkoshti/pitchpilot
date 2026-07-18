import type { MetadataRoute } from 'next';

/** Web app manifest making PitchPilot an installable PWA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PitchPilot — Smart Stadium Ops',
    short_name: 'PitchPilot',
    description:
      'GenAI-powered crowd-flow intelligence, accessible wayfinding and a multilingual concierge for the FIFA World Cup 2026.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05301c',
    theme_color: '#05301c',
    // Chrome only offers to install (fires `beforeinstallprompt`) when the
    // manifest carries both a 192px and a 512px `any` icon; a lone 512 or the
    // 180px apple-icon is not enough. The 512 is also declared `maskable` — the
    // artwork is full-bleed with its content centred in the safe zone, so it
    // fills an adaptive icon without cropping.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
