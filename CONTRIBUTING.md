# Contributing to PitchPilot

Thanks for your interest! PitchPilot keeps a high quality bar.

## Development

```bash
npm install
npm run dev
```

## Before opening a pull request

Run the full local gate — CI runs the same checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Conventions

- **TypeScript strict**, no `any`. Prefer small, pure, single-responsibility functions.
- Put numeric/business logic in `lib/` (pure, unit-tested); keep React components
  presentational. Never call the AI directly from a component — go through an API route.
- Every new engine function ships with tests and JSDoc.
- Validate all external input with Zod at the API boundary.
- UI must remain keyboard-accessible and meet WCAG AA.
