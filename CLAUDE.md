# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Straydar (`stray-cat-app`) is a React SPA for tracking and reporting stray/lost cats on a map. Data is shared across all users in a Supabase (Postgres) backend — every cat and sighting is visible to everyone, not just the browser that created it.

## Commands

```bash
npm run dev       # start Vite dev server (HMR)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # run oxlint (see .oxlintrc.json)
```

There is no test suite configured in this repo (no test runner, no `*.test.*`/`*.spec.*` files). Don't assume Jest/Vitest exists — if asked to add tests, a runner needs to be introduced first.

### Backend setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in `supabase/migrations/` in order (`0001_init.sql` creates the schema/RLS policies, `0002_seed.sql` loads the demo cats/sightings).
3. Copy `.env.example` to `.env` and fill in the project's URL and anon public key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Project Settings → API). `.env` is gitignored.

## Architecture

**Stack:** React 19 + Vite + React Router 7, Tailwind CSS v4 (via `@tailwindcss/vite`, config lives in `@theme` block in `src/index.css` — no `tailwind.config.js`), Leaflet/react-leaflet for the map, lucide-react for icons.

**Data flow (single source of truth pattern):**
- `src/services/supabaseClient.js` creates the Supabase client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (throws at import time if either is missing).
- `src/services/db.js` is the persistence layer: thin async wrappers over Supabase queries (`fetchCats`, `fetchSightings`, `insertCat`, `updateCatRow`, `insertSighting`). No client-side ID generation or localStorage writes — the DB assigns UUIDs and timestamps.
- `src/context/DataContext.jsx` (`DataProvider`/`useData()`) is the only place components should touch data. On mount it runs a one-time migration of any pre-Supabase `localStorage` data (see below), fetches `cats`/`sightings` into React state, and subscribes to Supabase Realtime so inserts/updates from other users merge into state live. It exposes `cats`, `sightings`, `loading`, `error`, and the CRUD/query API: `addCat`, `updateCat`, `addSighting` (all `async`), plus `findNearbySightings`, `getCatById`, `getSightingsForCat`.
- Components/pages never call `db.js`/Supabase directly — they go through `useData()`, and must `await` the CRUD calls.
- Auth is not enforced yet (anonymous read/write via permissive RLS policies), but `cats.owner_id`/`sightings.reporter_id` already exist as nullable FKs to `auth.users` so adding real auth later is a policy change, not a schema change — see the comments in `supabase/migrations/0001_init.sql`.
- A browser's old `localStorage` cats/sightings (from before this backend existed) are uploaded once via `migrateLocalData()` in `DataContext.jsx`, gated on a `straydar.migrated.v1` flag; only non-seed (user-added) cats and their sightings are migrated.

**Core domain model:**
- A **cat** is a persistent identity record (`id`, `name`, `status`, `temperament`, `description`, `needs_medical_attention`, `medical_details`, `primary_photo_url`). `status` is one of `lost | stray_resident | sighted_temporary | found` — see `src/services/statusMeta.js` for labels/colors used throughout the UI.
- A **sighting** is a single geo-tagged report (`cat_id`, `latitude`/`longitude`, `sighting_time`, `photo_url`, `last_fed_date`, `notes`) linked to a cat. A cat can have many sightings; the map shows each cat's most recent one (see `latestSightingByCat` in `MapPage.jsx`).

**Duplicate-cat matching pipeline** (this is the trickiest cross-file flow — read all three if touching report submission):
1. `src/services/matching.js` (`findDuplicateCandidates`) finds cats with a sighting within a radius (default 150m, via `DataContext.findNearbySightings`) and scores them against the new report's temperament + description keyword overlap (`attributeMatchScore`), producing a `strong | possible | nearby` `matchStrength`.
2. `src/hooks/useReportSubmission.js` orchestrates the "Add Report" flow: calls `findDuplicateCandidates`; if candidates exist, holds the submission as `pending` instead of writing immediately.
3. `MapPage.jsx` renders `DedupModal` when `pending` is set, letting the user confirm the sighting belongs to an existing cat (`confirmSameCat` → links a new sighting to that cat) or is a genuinely new cat (`confirmNewCat` → creates both cat + sighting).

**AI assistant:** `src/services/aiAssistant.js` wraps `@anthropic-ai/sdk`, called directly from the browser (`dangerouslyAllowBrowser: true`). The user's own Anthropic API key is stored client-side only (`src/hooks/useApiKey.js`, `localStorage`, never bundled/hardcoded) and entered via the key field in `AIChatPanel`. Without a key, `getAssistantReply` falls back to canned keyword-matched responses (`CANNED_RESPONSES`/`mockReply`) covering TNR, approaching skittish cats, kitten feeding, and wound triage — so the assistant UI is fully testable without a key.

**Pages** (`src/pages/`, routed in `App.jsx` under the shared `Layout`):
- `MapPage` — Leaflet map, drop-pin/click-to-report, status legend, dedup flow.
- `FeedPage` — paginated chronological feed of sightings.
- `MissingPage` — report-a-lost-cat form (creates a cat with `status: 'lost'` + owner contact info).
- `EmergencyPage` — nearest vet clinics (`src/services/vetDirectory.js`, static placeholder data with fake NANP-555 phone numbers) plus entry point to `AIChatPanel`.

**Geo utilities:** `src/services/geo.js` has the Haversine `distanceMeters`/`formatDistance` helpers used across matching, the feed, and emergency vet sorting. `src/hooks/useGeolocation.js` wraps `navigator.geolocation.watchPosition`.

## Conventions

- All Tailwind styling uses the custom theme tokens defined in `src/index.css` (`--color-paper`, `--color-ink`, `--color-brand`, `--color-status-*`, etc.) — use these token-based classes (e.g. `bg-brand`, `text-ink`, `border-line`) rather than raw Tailwind palette colors, to stay consistent with the existing UI.
- Status colors/labels are centralized in `statusMeta.js`; don't hardcode status strings/colors elsewhere.
- New cats always default `status` to `sighted_temporary` unless the flow explicitly sets otherwise (e.g. `MissingPage` sets `lost`).

## Git workflow

- Create a new branch for each feature/fix, don't work directly on main.
- Before starting any change, fetch and check whether the branch is behind `master` (`git fetch origin master && git log HEAD..origin/master --oneline`); if it is, merge `master` in first so work builds on the latest code and avoids stale/conflicting docs or dependency versions.
- Ask before committing — show the diff first.
- Ask before pushing.
- Open a PR when the work is ready for review, don't merge automatically.

## Before pushing

- Run the test suite (or linter/build, whatever applies) before pushing any commit.
- If tests fail, fix the issue before proceeding — don't push broken code.
- If there's no test suite yet, at minimum run/build the code to confirm it executes without errors.
- Flag if this step is skipped for any reason.
