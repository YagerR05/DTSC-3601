Homework 4 - Doppelganger (Pokedex Stat-Similarity API)
========================================================

DTSC 3601

**Live API:** https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run
**Docs:** https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run/docs

A fitted scikit-learn Pipeline served with FastAPI on Modal: given a made-up base-stat line
(HP/Attack/Defense/Sp.Attack/Sp.Defense/Speed), it finds the real Pokemon whose stat profile is
closest, using a custom feature-engineering transformer + StandardScaler + k-nearest-neighbors over
all 1211 Pokemon in the same Supabase dataset backing the [Pokedex Web app](../Homework_3_Pokedex_Vercel).

## Why this model

K-nearest-neighbors over engineered stat features fits the "no labels required" framing directly -
there's no target to predict, just a fitted representation of what "close" means in stat-space.
The custom `StatFeatureEngineer` transformer expands the 6 raw stats into bulk/offense/balance
composites (e.g. `physical_bulk = hp + defense`) before scaling and indexing, so two Pokemon with
very different HP/Defense splits but similar overall physical bulk end up closer together than a
naive Euclidean distance on raw stats would put them. sklearn 1.7.2.

## Files

- `pipeline_def.py` - the custom transformer (`StatFeatureEngineer`), its own module so it's
  importable wherever the bundle is unpickled.
- `build_doppelganger.py` - pulls the `pokemon` table from Supabase, fits
  `Pipeline([StatFeatureEngineer, StandardScaler])` + a `NearestNeighbors` index on the transformed
  matrix, and dumps a bundle dict (`pipeline`, `neighbors`, `reference` records, `metadata`) to
  `doppelganger.joblib`.
- `serve.py` - FastAPI app. Loads the `.joblib` once at import (never per-request). `GET /health`,
  `GET /info` (artifact metadata), `POST /doppelganger` (Pydantic-bounded stat query -> nearest
  matches). Missing/unloadable artifact -> 503; bad input -> 422 automatically via Pydantic.
- `modal_serve.py` - Modal deployment. Ships `serve.py` + `pipeline_def.py` + `doppelganger.joblib`
  in the image, pins `scikit-learn==1.7.2` to match the artifact's metadata exactly, imports the
  FastAPI app inside the Modal function.

## Setup

Requires [uv](https://docs.astral.sh/uv/) and the same Supabase project used by the other homeworks.

1. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY` (same values as
   `Homework_2_Pokedex_Cloud_Deploy/.env` or `Homework_3_Pokedex_Vercel/.env.local`).
2. `uv sync`
3. Build the artifact (only needed once, or after the dataset changes):

   ```bash
   uv run python build_doppelganger.py
   ```

4. Run locally:

   ```bash
   uv run uvicorn serve:app --reload
   ```

   Opens docs at http://localhost:8000/docs

## Deploying to Modal

```bash
uv run modal deploy modal_serve.py
```

Prints the public URL. Re-run `build_doppelganger.py` and redeploy any time the underlying Pokemon
data changes - the artifact is a static, fitted snapshot, not something the API re-fits at request
time or at boot.
