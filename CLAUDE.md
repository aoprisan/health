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

- **Persistence:** localStorage key `health:v1`, shape `{ entries: Entry[], settings: { dailyGoalMl } }` (see `DEFAULT_STATE` in `src/types.ts`). `src/storage.ts` handles load/save and swallows parse/quota errors, falling back to defaults.
- **Styling:** one hand-written `src/styles.css` (no CSS framework). Theming and per-drink accent colors use CSS variables (e.g. `--water`, `--beer-strong`); dark mode keys off the system preference. Visualizations are inline SVG (`GlassProgress`, `HydrationMeter`).

## Domain model (the core concept)

Hydration is **not** the same as volume. Every drink has a `factor` in `DRINKS` (`src/types.ts`); effective hydration is `amountMl * factor`, computed by `hydrationOf(entry)`. The goal meter tracks summed *effective hydration*, while the daily total shows raw volume.

```
water 1.0 · tea 0.9 · coffee 0.7 · na beer 0.95 (≤0.5%) · light beer 0.6 (≤5%) · beer 0.5 (5–7%) · strong beer 0.3 (>7%)
```

When adding a drink type, update `DrinkKind`, the `DRINKS` record (label, factor, `accentVar`), and `DRINK_ORDER` in `src/types.ts`, and add the matching CSS accent variable in `styles.css`. Preset volumes live in `QUICK_SIZES_ML`.
