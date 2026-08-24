# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A mobile-first, client-only hydration journal ("Hydrology"). Vite + React 18 + TypeScript. No backend, no login — all data lives in `localStorage`. Deployed to GitHub Pages at https://aoprisan.github.io/health/.

## Commands

```bash
npm install        # install deps
npm run dev        # dev server — open http://localhost:5173/health/ (note the /health/ path)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build locally
```

There is **no test framework and no linter/formatter** configured. The only correctness gate is the TypeScript build.

## Gotchas

- **`base: '/health/'`** in `vite.config.ts` (for the GitHub Pages subpath) means the dev server is served at `/health/`, not `/`. Don't hardcode absolute asset paths.
- **`tsc -b` runs before `vite build`** with `strict`, `noUnusedLocals`, and `noUnusedParameters` on (`tsconfig.app.json`). An unused import or variable **fails the build**, not just warns. Run `npm run build` to catch this — `npm run dev` won't.
- Deploy is automatic: pushing to `main` triggers `.github/workflows/deploy.yml`. (One-time repo setup: Settings → Pages → Source: GitHub Actions.)

## Architecture

State flows through a single source of truth: the **`useWaterLog()`** hook (`src/hooks/useWaterLog.ts`). It loads from / persists to `localStorage` and exposes mutations (`addEntry`, `undoEntry`, `setGoal`) plus derived values (`todayTotal`, `todayHydrationMl`, `todayEntries`, `historyByDay`). `App.tsx` calls the hook once and passes slices down to presentational components in `src/components/`. Components don't own persisted state.

- **Persistence:** localStorage key `health:v1`, shape `{ entries: Entry[], settings: { dailyGoalMl, body } }` (see `DEFAULT_STATE` in `src/types.ts`). `body` is `{ heightCm, weightKg, sex }`, where the two measures are `null` until the user fills them in. `src/storage.ts` handles load/save and swallows parse/quota errors, falling back to defaults — it coerces each field, so payloads written by older versions still load.
- **Metabolism:** `src/metabolism.ts` is pure functions over `Entry[]` — no React, no state. Caffeine decays first-order (5 h half-life), alcohol follows Widmark (linear absorption, then a constant 0.15 g/L per hour), so caffeine's zero crossing is closed-form while blood alcohol has to be simulated minute by minute. `useNow()` (`src/hooks/useNow.ts`) re-renders every 30 s to keep both live; `LoadPanel` clamps that clock to the newest entry so a drink logged between ticks isn't read as being in the future.
- **Styling:** one hand-written `src/styles.css` (no CSS framework). Theming and per-drink accent colors use CSS variables (e.g. `--water`, `--beer-strong`); dark mode keys off the system preference. Visualizations are inline SVG (`GlassProgress`, `HydrationMeter`).

## Domain model (the core concept)

Hydration is **not** the same as volume. Every drink has a `factor` in `DRINKS` (`src/types.ts`); effective hydration is `amountMl * factor`, computed by `hydrationOf(entry)`. The goal meter tracks summed *effective hydration*, while the daily total shows raw volume.

```
water 1.0 · tea 0.9 · coffee 0.7 · na beer 0.95 (≤0.5%) · light beer 0.6 (≤5%) · beer 0.5 (5–7%) · strong beer 0.3 (>7%)
```

Each drink also carries `caffeineMgPerMl` and `abv` (percent alcohol by volume). Those feed the "what's still in you" panel: caffeine on board in mg, blood alcohol in g/L, and the projected time each reaches zero. Blood alcohol additionally needs height and weight (Widmark's *r*, via the Seidl coefficients) — without them the alcohol card asks for them instead of guessing.

When adding a drink type, update `DrinkKind`, the `DRINKS` record (label, factor, `accentVar`, `caffeineMgPerMl`, `abv`), and `DRINK_ORDER` in `src/types.ts`, and add the matching CSS accent variable in `styles.css`. Preset volumes live in `QUICK_SIZES_ML`.
