Homework 4 - Pokedex ML API (Doppelganger + Team Builder)
===========================================================

DTSC 3601

**Live API:** https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run
**Docs:** https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run/docs

Two fitted scikit-learn pipelines served together with FastAPI on Modal, both built from the same
Supabase `pokemon` dataset backing the [Pokedex Web app](../Homework_3_Pokedex_Vercel):

1. **Doppelganger** - given a made-up base-stat line, finds the real Pokemon whose stat profile is
   closest.
2. **Team Builder** - given a partial team (1-5 Pokemon), recommends non-legendary teammates that
   improve type coverage and physical/special balance.

## 1. Doppelganger (KNN stat-similarity)

K-nearest-neighbors over engineered stat features fits the "no labels required" framing directly -
there's no target to predict, just a fitted representation of what "close" means in stat-space.
The custom `StatFeatureEngineer` transformer (`pipeline_def.py`) expands the 6 raw stats into
bulk/offense/balance composites (e.g. `physical_bulk = hp + defense`) before scaling and indexing,
so two Pokemon with very different HP/Defense splits but similar overall physical bulk end up
closer together than a naive Euclidean distance on raw stats would put them. sklearn 1.7.2.

- `pipeline_def.py` - custom transformer `StatFeatureEngineer`.
- `build_doppelganger.py` - pulls the `pokemon` table, fits
  `Pipeline([StatFeatureEngineer, StandardScaler])` + a `NearestNeighbors` index on the transformed
  matrix, dumps `{pipeline, neighbors, reference, metadata}` to `doppelganger.joblib`.
- `GET /info` (artifact metadata), `POST /doppelganger` (Pydantic-bounded stat query -> nearest
  matches).

## 2. Team Builder (Random Forest recommender)

There's no real "which teams win" data, so training labels are synthetic: thousands of random
partial teams are sampled from the Pokemon table, every candidate teammate is scored against a
hand-written rule (type-coverage improvement + physical/special balance improvement + a bonus for
suggesting a first Mega), and a `RandomForestRegressor` is fit on those `(team, candidate) ->
fit-score` examples. The rules only exist to generate offline training labels - the deployed API
never runs them, it only runs the already-fitted model. Random forest was chosen because it
captures non-linear, diminishing-returns interactions (a team that already resists Water gets
little marginal value from another Water-resist) that a linear model would miss, while still
outputting a continuous score suited to ranking. Legendaries are excluded from the recommendation
pool by a hard filter, not learned. sklearn 1.7.2. Train R^2 = 0.77 on the synthetic data (a
sanity check that the forest fits its own labels, not a claim about real competitive quality).

- `team_pipeline_def.py` - custom transformer `TeamContextFeaturizer`, which is the real work:
  it aggregates a variable-length team (1-5 Pokemon) plus one candidate into a fixed-size feature
  vector (mean type-weakness across the team, physical/special share, mega-bonus flags, etc.)
  regardless of team size.
- `build_team_builder.py` - generates ~80,000 synthetic `(team, candidate)` examples, fits
  `Pipeline([TeamContextFeaturizer, RandomForestRegressor])`, dumps
  `{pipeline, reference, candidate_pool_ids, metadata}` to `team_builder.joblib`.
- `GET /team/info` (artifact metadata), `POST /team/recommend` (1-5 team Pokemon ids -> ranked
  non-legendary recommendations). Unknown/duplicate ids -> 422.

## Shared serving layer

- `serve.py` - one FastAPI app for both pipelines. Both `.joblib` bundles are loaded once at
  import (never per-request). `GET /health`, plus the routes above. A missing/unloadable artifact
  -> 503; bad input -> 422 automatically via Pydantic bounds (and manual 422s for semantic checks
  like unknown Pokemon ids).
- `modal_serve.py` - Modal deployment. Ships `serve.py` + `pipeline_def.py` +
  `team_pipeline_def.py` + `doppelganger.joblib` + `team_builder.joblib` in the image, pins
  `scikit-learn==1.7.2` to match both artifacts' metadata exactly, imports the FastAPI app inside
  the Modal function.

## Setup

Requires [uv](https://docs.astral.sh/uv/) and the same Supabase project used by the other homeworks.

1. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` / `SUPABASE_ANON_KEY` (same values as
   `Homework_2_Pokedex_Cloud_Deploy/.env` or `Homework_3_Pokedex_Vercel/.env.local`).
2. `uv sync`
3. Build the artifacts (only needed once, or after the dataset changes):

   ```bash
   uv run python build_doppelganger.py
   uv run python build_team_builder.py
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

Prints the public URL. Re-run the `build_*.py` scripts and redeploy any time the underlying
Pokemon data changes - the artifacts are static, fitted snapshots, not something the API re-fits
at request time or at boot.
