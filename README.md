# ⚽ PitchPilot

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Tests](https://img.shields.io/badge/tests-152%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/engine%20coverage-99%25-brightgreen)
![PWA](https://img.shields.io/badge/PWA-installable%20%C2%B7%20works%20offline-5a0fc8)
![License](https://img.shields.io/badge/license-MIT-blue)

**A GenAI-powered smart-stadium platform for the FIFA World Cup 2026 — crowd-flow
intelligence, accessible wayfinding, a multilingual AI concierge and real-time
operational decision support, all in one fast, installable, accessible web app.**

> Built for **PromptWars Challenge 4 — Smart Stadiums & Tournament Operations.**

---

## ✨ What it does

PitchPilot serves two audiences from one codebase:

**For fans** 🎟️

- 🌐 **Multilingual AI concierge** — ask anything (“which gate is fastest?”, “nearest
  step-free restroom?”, “greenest way home?”) in your language; answers are grounded in
  real stadium data.
- 🧭 **Accessible wayfinding** — shortest-path routing to restrooms, food, medical points
  and exits, with a guaranteed **step-free mode** for wheelchair users.
- 🌱 **Sustainable transport** — ranks travel options by CO₂e so fans travel greener.

**For organizers, volunteers & venue staff** 🛠️

- 🚦 **Live crowd-flow intelligence** — gate queues become wait-times and congestion bands.
- 🎛️ **Recommendations you can act on** — the engine says which gate needs lanes; open them
  in one click and watch the wait fall. When a gate is already fully staffed it says so and
  advises redirecting instead.
- 📊 **Real-time AI ops briefing** — telemetry becomes an action-first briefing: which gate
  to reinforce, and evacuation-clearance readiness at a glance.

---

## 🧠 How Generative AI is used

The AI layer (Google **Gemini**) powers two features:

1. **Multilingual concierge** (`/api/concierge`) — Gemini answers fans in their own
   language, **grounded** on a factual context block built from live stadium data so it
   never invents gates or facilities.
2. **Operations briefing** (`/api/briefing`) — Gemini turns computed recommendations into
   a crisp, prioritised shift briefing for staff.

**Key design principle — separation of maths from language.** All numeric logic lives in a
pure, deterministic engine (`lib/`) that is 99% unit-tested and runs in the browser. The AI
sits _on top_ as a language layer. If the API key is missing, the model times out, or the
network fails, **every feature degrades gracefully** to the deterministic engine.

Because the engine is pure, it ships to the browser too: wayfinding computes locally, and
if a concierge request cannot reach the server the same engine answers the fan on-device
rather than showing an error.

A stadium bowl is one of the worst mobile-network environments there is, so this is not a
theoretical edge case. A service worker (`public/sw.js`) precaches the app shell, which
means **PitchPilot cold-starts and answers with the origin completely unreachable** —
verified by killing the server outright and reloading:

| With the server killed       | Result                                         |
| ---------------------------- | ---------------------------------------------- |
| Reload `/fan`, `/ops`        | 200, rendered from cache                       |
| Ask the concierge a question | Answered on-device by the deterministic engine |
| Visit a page never cached    | Redirected to a helpful `/offline` page        |

Live gate telemetry and AI-phrased replies still need a connection — `/api/*` is never
cached, because a stale queue length is worse than no queue length.

---

## 🎯 Problem-statement alignment

| Challenge focus area       | PitchPilot feature                                       |
| -------------------------- | -------------------------------------------------------- |
| Navigation                 | Dijkstra wayfinding to any POI (`lib/wayfinding.ts`)     |
| Crowd management           | Gate congestion + lane recommendations (`lib/crowd.ts`)  |
| Accessibility              | Step-free routing + WCAG-AA UI                           |
| Transportation             | CO₂e-ranked transport options (`lib/sustainability.ts`)  |
| Sustainability             | Greenest-route nudges + crowd footprint model            |
| Multilingual assistance    | AI concierge replies in the fan’s language               |
| Operational intelligence   | Real-time ops dashboard + AI briefing                    |
| Real-time decision support | Lane/evacuation advice operators can apply in one click  |
| Resilience                 | Full offline operation via service worker + local engine |

---

## 🏗️ Architecture

```
app/
  page.tsx            Landing (host venues, feature map)
  fan/                Fan companion  → concierge, wayfinding, transport
  ops/                Operations control → live gates + AI briefing
  offline/            Served by the service worker when a route isn't cached
  api/concierge/      Multilingual AI concierge (Zod + rate-limit + fallback)
  api/briefing/       AI ops briefing (Zod + rate-limit + fallback)
components/           Small, single-responsibility UI
  FanCompanion.tsx    Owns the fan's location + step-free preference, shared
                      by the wayfinding panel and the concierge
public/sw.js          Offline service worker (precached shell, never caches /api)
lib/                  Pure, deterministic, fully-tested engines
  crowd.ts            Wait-times, congestion, lane & evacuation logic
  wayfinding.ts       Dijkstra shortest-path with accessible routing
  sustainability.ts   Transport CO₂e ranking + crowd footprint
  concierge.ts        Intent classification + grounded fallback answers
  gemini.ts           Server-only Gemini wrapper with timeout + fallback
  schema.ts           Zod schemas for every API boundary
  ratelimit.ts        Sliding-window limiter
__tests__/            152 tests across engines, schemas, components & routes
```

---

## 🔒 Security

- **Every** API input is validated with **Zod** (bounded string lengths and array sizes).
- **Rate limiting** on both AI routes (sliding window per client).
- The Gemini **API key is server-only** (`import 'server-only'`) and never reaches the client.
- Strict **Content-Security-Policy** and hardening headers (`next.config.mjs`).
- No secrets in the repo; configuration via `.env` (see `.env.example`).

## ♿ Accessibility

- Audited with **axe-core** against WCAG 2.1 A/AA in a real browser — **0 violations**
  across the landing, fan, ops and offline pages.
- Semantic HTML, ARIA live regions for chat and routing, labelled controls.
- Full keyboard navigation with a visible focus ring and a skip-to-content link.
- Congestion is conveyed by **text + colour**, never colour alone (WCAG 1.4.1).
- Honours `prefers-reduced-motion`. A dedicated **step-free routing** mode for wheelchair users.
- The step-free preference is honoured by the **concierge as well as** the map, so a
  wheelchair user asking the chat for a restroom is never routed via the stairs.

## 🧪 Testing

152 tests (Vitest), **99% statement / 100% function coverage** of the engine layer,
including edge cases, accessibility routing, schema validation, rate-limiting and API
routes with the AI layer mocked.

```bash
npm test            # run the suite
npm run test:coverage
```

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env      # optional — add GEMINI_API_KEY to enable the AI layer
npm run dev               # http://localhost:3000
```

Requires **Node 20.9+** (see `.nvmrc`). Without a key the app runs fully on its
deterministic engine. Add a free [Gemini API key](https://aistudio.google.com/app/apikey)
to enable AI concierge replies and briefings.

### Deploying

The app is a standard Next.js build; `netlify.toml` wires up
`@netlify/plugin-nextjs`. One environment variable matters:

| Variable               | Needed?  | Effect                                                                                                                         |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`       | Optional | Enables the AI layer. Without it the deterministic engine answers everything — the app still works, but nothing is AI-phrased. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical origin for SEO/social tags. Netlify's own `URL` is used automatically; set this only for a custom domain.            |

### Scripts

| Script                  | Purpose                 |
| ----------------------- | ----------------------- |
| `npm run dev`           | Start the dev server    |
| `npm run build`         | Production build        |
| `npm test`              | Run the test suite      |
| `npm run test:coverage` | Coverage report         |
| `npm run lint`          | ESLint                  |
| `npm run typecheck`     | Strict TypeScript check |
| `npm run format`        | Prettier                |

## 🛠️ Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS · Google Gemini · Zod ·
Vitest · Testing Library · PWA.

## 📄 License

MIT — see [LICENSE](./LICENSE).
