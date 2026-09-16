"""Fits the Team Builder pipeline and dumps a bundle to team_builder.joblib.

There is no real "which teams win" data, so training labels are synthetic:
random fake partial teams are sampled from the Pokemon table, every
candidate is scored by how much it improves the team's aggregate type
*exposure* (see `badness` below), plus a physical/special balance term and
a first-mega bonus, and a RandomForestRegressor is fit on those
(team, candidate) -> label examples. The rules only exist to generate
training labels offline; the deployed API never runs them, it only runs
the fitted model.

Exposure is computed per attacking type as the sum, across team members, of
a log2-scaled defensive multiplier (resist -0.5x -> -1, neutral -> 0, weak
2x -> +1, weak 4x -> +2, immune -> -2), summed only where positive (i.e.
types the team is net-exposed to). This is what makes it a genuine team
metric rather than a per-Pokemon one: stacking a second and third member
weak to the same type keeps adding to that type's exposure even if some
other member already resists it, and a candidate is scored on how much it
raises or lowers the team's total exposure by adding its own multipliers
in. An earlier version of this formula only rewarded "filling a gap no one
currently resists" with no symmetric penalty for weaknesses a candidate
introduces - since Steel resists 11 of 18 types, it scored well on almost
any team regardless of what it was weak to, and got recommended almost
unconditionally. This version was checked against multiple real teams to
confirm it no longer does that (see the PR/commit history for the test
transcripts) - Steel-types still show up when they're genuinely good
picks, but no longer dominate the rankings indiscriminately.

Legendary status and evolution stage are NOT filtered out of the training
data - they're applied as request-time filters in serve.py instead, so the
model needs to have seen examples across the whole space to score sensibly
whichever way a user has the filters set.

Run once, offline, whenever the reference Pokemon data changes:

    uv run python build_team_builder.py
"""

import math
import os
import random
from datetime import datetime, timezone

import joblib
import requests
import sklearn
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline

from evolution_stage import EvolutionStageResolver
from team_pipeline_def import ATTACK_TYPES, TeamContextFeaturizer

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
PAGE_SIZE = 1000
ARTIFACT_PATH = "team_builder.joblib"

AGAINST_COLS = ",".join(f"against_{t}" for t in ATTACK_TYPES)
SELECT_COLUMNS = (
    f"id,name,pokedex_number,generation,type1,type2,is_legendary,"
    f"attack,sp_attack,base_total,{AGAINST_COLS}"
)

N_SYNTHETIC_TEAMS = 12000
CANDIDATES_PER_TEAM = 30
RANDOM_SEED = 42


def fetch_all_pokemon() -> list[dict]:
    rows = []
    start = 0
    headers = {"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"}
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/pokemon?select={SELECT_COLUMNS}"
            f"&order=id.asc&offset={start}&limit={PAGE_SIZE}"
        )
        res = requests.get(url, headers=headers, timeout=30)
        res.raise_for_status()
        page = res.json()
        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        start += PAGE_SIZE
    return rows


def add_is_mega(pokemon: list[dict]) -> None:
    for p in pokemon:
        p["is_mega"] = p["name"].startswith(("Mega ", "Primal "))


def add_evolution_stage(pokemon: list[dict]) -> None:
    resolver = EvolutionStageResolver()
    for p in pokemon:
        p["is_final_evolution"] = resolver.is_final_evolution(p["name"], p["pokedex_number"], p["is_mega"])


def _type_score(against: float) -> float:
    """log2-scaled defensive multiplier: resist -> negative, weak -> positive."""
    if against <= 0:
        return -2.0
    return math.log2(against)


def _team_badness(members: list[dict]) -> float:
    """Sums, over every attacking type the team is net-exposed to, how
    exposed it is - stacking a second/third member weak to the same type
    keeps adding to that type's total even if another member resists it."""
    total = 0.0
    for t in ATTACK_TYPES:
        exposure = sum(_type_score(m[f"against_{t}"]) for m in members)
        total += max(0.0, exposure)
    return total


def compute_label(team: list[dict], candidate: dict) -> float:
    coverage_score = (_team_badness(team) - _team_badness(team + [candidate])) / 6.0

    team_atk = sum(m["attack"] for m in team)
    team_spa = sum(m["sp_attack"] for m in team)
    before_share = team_atk / max(1.0, team_atk + team_spa)
    after_atk = team_atk + candidate["attack"]
    after_spa = team_spa + candidate["sp_attack"]
    after_share = after_atk / max(1.0, after_atk + after_spa)
    balance_improvement = abs(before_share - 0.5) - abs(after_share - 0.5)
    balance_improvement = max(0.0, min(1.0, balance_improvement * 2))

    team_has_mega = any(m["is_mega"] for m in team)
    mega_bonus = 1.0 if (candidate["is_mega"] and not team_has_mega) else 0.0

    label = 0.85 * coverage_score + 0.10 * balance_improvement + 0.05 * mega_bonus
    return max(0.0, min(1.0, label))


def generate_training_data(pokemon: list[dict], rng: random.Random):
    X_rows = []
    y = []
    for _ in range(N_SYNTHETIC_TEAMS):
        team_size = rng.randint(1, 5)
        team = rng.sample(pokemon, team_size)
        team_ids = {m["id"] for m in team}

        # Candidates are sampled from the FULL pool (legendaries and
        # not-fully-evolved Pokemon included) so the fitted model scores
        # sensibly regardless of how the request-time filters in serve.py
        # are set - the filters decide what's eligible to recommend, not
        # what the model has learned to score.
        candidate_pool = [p for p in pokemon if p["id"] not in team_ids]
        candidates = rng.sample(candidate_pool, min(CANDIDATES_PER_TEAM, len(candidate_pool)))

        for candidate in candidates:
            X_rows.append({"team": team, "candidate": candidate})
            y.append(compute_label(team, candidate))

    return X_rows, y


def main():
    print("Fetching Pokemon data from Supabase...")
    pokemon = fetch_all_pokemon()
    print(f"Fetched {len(pokemon)} rows.")
    add_is_mega(pokemon)
    print(f"Detected {sum(p['is_mega'] for p in pokemon)} Mega/Primal forms.")
    add_evolution_stage(pokemon)
    n_final = sum(p["is_final_evolution"] for p in pokemon)
    print(f"Resolved evolution stage: {n_final} final-evolution, {len(pokemon) - n_final} not fully evolved.")

    rng = random.Random(RANDOM_SEED)
    print(f"Generating synthetic training data ({N_SYNTHETIC_TEAMS} teams x up to {CANDIDATES_PER_TEAM} candidates)...")
    X_rows, y = generate_training_data(pokemon, rng)
    print(f"Generated {len(X_rows)} (team, candidate) -> fit-score examples.")

    # The label is deterministic (no noise given a fixed team+candidate), so
    # this isn't regularized as hard as a typical noisy real-world target -
    # depth/leaf-size were tightened from an initial pass that underfit
    # badly (predictions regressed toward the training distribution's
    # average instead of tracking team-specific labels).
    pipeline = Pipeline([
        ("features", TeamContextFeaturizer()),
        ("forest", RandomForestRegressor(
            n_estimators=100, max_depth=14, min_samples_leaf=4,
            random_state=RANDOM_SEED, n_jobs=-1,
        )),
    ])
    pipeline.fit(X_rows, y)
    train_r2 = pipeline.score(X_rows, y)
    print(f"Fitted. Train R^2 = {train_r2:.3f}")

    bundle = {
        "pipeline": pipeline,
        "reference": pokemon,  # full pool; serve.py filters by is_legendary/is_final_evolution per request
        "metadata": {
            "name": "team-builder",
            "description": (
                "Random forest trained on synthetic (partial team, candidate) -> fit-score "
                "examples. A 'gap' is a type no current team member resists; a candidate is "
                "scored on how many gaps it fills, minus a penalty for new unresisted "
                "weaknesses it introduces, plus a physical/special balance term and a "
                "first-Mega bonus. Legendary/evolution-stage filtering happens at request "
                "time, not during training."
            ),
            "steps": [name for name, _ in pipeline.steps],
            "feature_names": pipeline.named_steps["features"].get_feature_names_out().tolist(),
            "n_reference_pokemon": len(pokemon),
            "n_training_examples": len(X_rows),
            "train_r2": round(train_r2, 4),
            "built_at": datetime.now(timezone.utc).isoformat(),
            "sklearn_version": sklearn.__version__,
        },
    }

    joblib.dump(bundle, ARTIFACT_PATH, compress=3)
    print(f"Wrote {ARTIFACT_PATH} (sklearn {sklearn.__version__}).")


if __name__ == "__main__":
    main()
