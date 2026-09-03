Homework 3 - Pokedex Web
========================

DTSC 3601

**Live app:** https://pokedex-web-gamma-five.vercel.app

A higher-quality, shadcn/ui-based rebuild of the Homework 1/2 Streamlit Pokedex Explorer, built with
Next.js (App Router) and deployed on Vercel. Reads the same public Supabase `pokemon` table
(1065 Pokemon across all nine generations, including regional/Mega forms) as the Streamlit app.

## Features

- **Overview / Generations / Types / Compare** - direct ports of the Streamlit app's charts, rebuilt
  with shadcn's Recharts-based chart components and the same color system (type colors, generation
  colors, categorical palette).
- **Explore** - search by name or browse a virtualized sprite grid; click a Pokemon to open its
  detail page. A table view (all columns, sortable by clicking column headers via the browser) is
  available as a secondary view.
- **Pokemon detail page** (`/pokemon/[id]`) - an animated sprite (Pokemon Showdown) + stat radar
  chart hero, type effectiveness (weak/resist/immune, read directly from the DB's precomputed
  `against_*` columns), full base stats, details (classification, height/weight, abilities, etc.),
  and available forms (other rows sharing the same Pokedex number - regional forms, etc.).
- Generation / type / legendary filters apply across all tabs and are stored in the URL (shareable,
  bookmarkable).

## Architecture

- **Data**: Supabase Postgres table `pokemon`, read server-side only (Server Components) via the
  REST API with the existing public-read RLS policy and anon key from the `pokemon-streamlit`
  project. Fetched once and cached for an hour (`unstable_cache`, `revalidate: 3600`) - the whole
  dataset is small (~1065 rows) and rarely changes, so there's no per-filter re-querying.
- **Sprites**: Pokemon Showdown's animated GIF sprites (`lib/sprites.ts`) via a name-to-slug
  transform, with a manual override table (`lib/sprite-overrides.ts`, built from
  `scripts/audit-sprites.mjs`) for names the transform doesn't handle, and a runtime fallback chain
  (Showdown animated -> Showdown static -> PokeAPI official artwork -> bundled placeholder) in
  `components/pokemon-sprite.tsx`. The sprite grid in Explore uses static sprites for performance;
  only the detail-page hero is animated.
- **Charts**: shadcn/ui chart components (Recharts), themed with the same fixed type/generation
  color constants as the Streamlit app (`lib/chart-theme.ts`).
- **Filters**: URL search params (`lib/filters.ts`), not a client state library.
- **Theme**: dark-only, matching the original.

## Setup

Requires Node.js and a Supabase project (the existing `pokemon-streamlit` Supabase project works
as-is - no schema changes needed for read access).

1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY` (same
   values as `pokemon-streamlit/Homework_2_Pokedex_Cloud_Deploy/.env`). Never commit `.env.local`.
2. Install dependencies and run locally:

   ```bash
   npm install
   npm run dev
   ```

   The app opens at http://localhost:3000

### Re-running the sprite audit

`scripts/audit-sprites.mjs` HEAD-checks every derived Showdown sprite slug and reports misses. Rerun
it after adding new Pokemon to the dataset:

```bash
node scripts/audit-sprites.mjs
```

Add any new misses to `src/lib/sprite-overrides.ts`.

### Deploying to Vercel

Connect this repo to a Vercel project (root directory: `pokemon-streamlit/Homework_3_Pokedex_Vercel`),
then set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Project Settings -> Environment Variables for
Preview and Production.
