# PitchPilot — LinkedIn Build-in-Public Post

> Copy the text below and paste it into LinkedIn. Replace `<DEPLOYED_LINK>` with
> your live deployment URL before posting.

---

🏟️ Build-in-Public | PromptWars Challenge 4 — Smart Stadiums & Tournament Operations

For the FIFA World Cup 2026, I built **PitchPilot** ⚽ — a GenAI-powered smart-stadium platform that helps BOTH fans and venue operators, in one app.

The problem: millions of fans from dozens of countries, all needing to navigate huge stadiums — while staff make real-time crowd decisions. Language, accessibility and congestion all become friction.

What PitchPilot does 👇

**For fans** 🎟️
🌐 Multilingual AI concierge — ask anything in your own language, grounded in real stadium data
🧭 Accessible wayfinding — shortest routes to restrooms, food, exits… with a guaranteed step-free mode for wheelchair users
🌱 Greenest-way-home — ranks transport by CO₂e

**For organizers & volunteers** 🛠️
🚦 Live crowd-flow intelligence — gate queues → wait-times & congestion
📊 Real-time AI ops briefing — telemetry → "open 4 lanes at Gate B, evac clearance ~83 min"

How I built it 🧠
The core design idea: separate the MATHS from the LANGUAGE. All logic (crowd flow, Dijkstra pathfinding, sustainability) lives in pure, deterministic engines that are 99% unit-tested. Google Gemini sits on top as a language layer — and if the AI is ever unavailable, everything degrades gracefully to the engine. The app is always usable.

The numbers 📈
✅ 122 tests passing · 99% engine coverage
✅ TypeScript strict, zero warnings
✅ Zod-validated APIs, rate-limiting, server-only keys
✅ WCAG-AA accessible + installable PWA

Tech: Next.js 14 · TypeScript · Tailwind · Google Gemini · Zod · Vitest

🔗 Code: https://github.com/Mehulkoshti/pitchpilot
🔗 Live: <DEPLOYED_LINK>

Grateful to Hack2skill & Google for Developers for the PromptWars arena 🙌

\#PromptWars #BuildWithAI #GenAI #FIFAWorldCup2026 #NextJS #GoogleGemini #Accessibility #VibeCoding #Hackathon
