# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Straydar (`stray-cat-app`) is a client-only React SPA for tracking and reporting stray/lost cats on a map. There is no backend: all data lives in the browser via `localStorage`, seeded with demo data on first load.

## Commands

```bash
npm run dev       # start Vite dev server (HMR)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run oxlint (see .oxlintrc.json)
```

There is no test suite configured in this repo (no test runner, no `*.test.*`/`*.spec.*` files). Don't assume Jest/Vitest exists — if asked to add tests, a runner needs to be introduced first.

## Architecture

**Stack:** React 19 + Vite + React Router 7, Tailwind CSS v4 (via `@tailwindcss/vite`, config lives in `@theme` block in `src/index.css` — no `tailwind.config.js`), Leaflet/react-leaflet for the map, lucide-react for icons.

**Data flow (single source of truth pattern):**
- `src/services/db.js` is the persistence layer: reads/writes two `localStorage` keys (`straydar.cats.v1`, `straydar.sightings.v1`), seeding from `src/services/seedData.js` on first run.
- `src/context/DataContext.jsx` (`DataProvider`/`useData()`) is the only place components should touch data. It holds `cats` and `sightings` in React state, mirrors every mutation to `localStorage` via `db.js`, and exposes the CRUD/query API: `addCat`, `updateCat`, `addSighting`, `findNearbySightings`, `getCatById`, `getSightingsForCat`, `reset`.
- Components/pages never call `db.js` directly — they go through `useData()`.

**Core domain model:**
- A **cat** is a persistent identity record (`id`, `name`, `status`, `temperament`, `description`, `needs_medical_attention`, `medical_details`, `primary_photo_url`). `status` is one of `lost | stray_resident | sighted_temporary | found` — see `src/services/statusMeta.js` for labels/colors used throughout the UI. The six seed cats carry `is_seed: true` (see `seedData.js`); user-added cats omit it. `CatPopupContent` and `FeedPage` use this to show a "Demo" badge, so real reports stay visually distinguishable from placeholder data.
- A **sighting** is a single geo-tagged report (`cat_id`, `latitude`/`longitude`, `sighting_time`, `photo_url`, `last_fed_date`, `notes`) linked to a cat. A cat can have many sightings; the map shows each cat's most recent one (see `latestSightingByCat` in `MapPage.jsx`).

**Duplicate-cat matching pipeline** (this is the trickiest cross-file flow — read all three if touching report submission):
1. `src/services/matching.js` (`findDuplicateCandidates`) finds cats with a sighting within a radius (default 150m, via `DataContext.findNearbySightings`) and scores them against the new report's temperament + description keyword overlap (`attributeMatchScore`), producing a `strong | possible | nearby` `matchStrength`.
2. `src/hooks/useReportSubmission.js` orchestrates the "Add Report" flow: calls `findDuplicateCandidates`; if candidates exist, holds the submission as `pending` instead of writing immediately.
3. `MapPage.jsx` renders `DedupModal` when `pending` is set, letting the user confirm the sighting belongs to an existing cat (`confirmSameCat` → links a new sighting to that cat) or is a genuinely new cat (`confirmNewCat` → creates both cat + sighting).

**AI assistant:** `src/services/aiAssistant.js` wraps `@anthropic-ai/sdk`, called directly from the browser (`dangerouslyAllowBrowser: true`). The user's own Anthropic API key is stored client-side only (`src/hooks/useApiKey.js`, `localStorage`, never bundled/hardcoded) and entered via the key field in `AIChatPanel`. Without a key, `getAssistantReply` falls back to canned keyword-matched responses (`CANNED_RESPONSES`/`mockReply`) covering TNR, approaching skittish cats, kitten feeding, and wound triage — so the assistant UI is fully testable without a key.

**Pages** (`src/pages/`, routed in `App.jsx` under the shared `Layout`):
- `MapPage` — Leaflet map, drop-pin/click-to-report, status legend, dedup flow. `AutoLocate` (defined in this file, uses `useMap()`) recenters the map on the user's real geolocation the first time it resolves, without fighting later pans — falls back to `seedData.CENTER` (SF Mission District) until then or if geolocation is unavailable.
- `FeedPage` — paginated chronological feed of sightings.
- `MissingPage` — report-a-lost-cat form (creates a cat with `status: 'lost'` + owner contact info).
- `EmergencyPage` — nearest vets. Primary source is `src/services/vetLookup.js` (`findNearbyVets`), which live-queries OpenStreetMap's Overpass API (no key required) for real `amenity=veterinary` clinics within 25km, refetching only when the origin moves >1km to avoid spamming Overpass on GPS jitter. Falls back to `src/services/vetDirectory.js` (static placeholder clinics, fake NANP-555 phone numbers) if the live lookup fails or returns nothing — the UI shows a "Live results unavailable" note in that case. Also the entry point to `AIChatPanel`.

**Geo utilities:** `src/services/geo.js` has the Haversine `distanceMeters`/`formatDistance` helpers used across matching, the feed, and emergency vet sorting. `src/hooks/useGeolocation.js` wraps `navigator.geolocation.watchPosition`.

## Deployment

Static build (`npm run build` → `dist/`), no backend to deploy. `vercel.json` sets the build/output commands and rewrites all paths to `index.html` so `BrowserRouter` routes work on direct load/refresh — needed for any static host that doesn't already do SPA fallback by default.

## Conventions

- All Tailwind styling uses the custom theme tokens defined in `src/index.css` (`--color-paper`, `--color-ink`, `--color-brand`, `--color-status-*`, etc.) — use these token-based classes (e.g. `bg-brand`, `text-ink`, `border-line`) rather than raw Tailwind palette colors, to stay consistent with the existing UI.
- Status colors/labels are centralized in `statusMeta.js`; don't hardcode status strings/colors elsewhere.
- New cats always default `status` to `sighted_temporary` unless the flow explicitly sets otherwise (e.g. `MissingPage` sets `lost`).

## Git workflow

- Create a new branch for each feature/fix, don't work directly on main.
- Ask before committing — show the diff first.
- Ask before pushing.
- Open a PR when the work is ready for review, don't merge automatically.

## Before pushing

- Run the test suite (or linter/build, whatever applies) before pushing any commit.
- If tests fail, fix the issue before proceeding — don't push broken code.
- If there's no test suite yet, at minimum run/build the code to confirm it executes without errors.
- Flag if this step is skipped for any reason.
