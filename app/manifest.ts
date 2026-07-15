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
    background_color: '#ffffff',
    theme_color: '#05301c',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
