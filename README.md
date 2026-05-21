# Health — Water Tracker

A small, mobile-friendly SPA to log how much water you drink each day. Tap a glass-sized button to log a sip, watch a progress bar fill toward your daily goal, and review past days. All data stays on your device (`localStorage`); no backend, no login.

It's an installable PWA: add it to your home screen and it works offline — the app shell, icons, and web fonts are cached by a service worker, and it updates itself in the background when you reload.

Live: <https://aoprisan.github.io/health/>

## Stack

- Vite + React + TypeScript
- `vite-plugin-pwa` (Workbox) for the manifest, service worker, and offline precaching
- No CSS framework (single hand-written `styles.css`, mobile-first, supports dark mode)
- Deployed to GitHub Pages via the official `actions/deploy-pages` workflow

PWA icons live in `public/` and are generated from the water-drop mark by `scripts/gen-icons.mjs` (run `npm i -D sharp` first if you need to regenerate them).

## Develop

```bash
npm install
npm run dev   # http://localhost:5173/health/
```

Build and preview the production bundle locally:

```bash
npm run build
npm run preview
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.

**One-time setup in the GitHub repo:** Settings → Pages → **Source: GitHub Actions**. Without this, the workflow's deploy step has nowhere to publish to.

## Data

Everything is stored under the `localStorage` key `health:v1`:

```json
{
  "entries": [{ "id": "…", "ts": 1715760000000, "amountMl": 330 }],
  "settings": { "dailyGoalMl": 2000 }
}
```

Clearing site data resets the app.
