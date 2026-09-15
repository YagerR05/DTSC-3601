"""Fits the Team Builder pipeline and dumps a bundle to team_builder.joblib.

There is no real "which teams win" data, so training labels are synthetic:
random fake partial teams are sampled from the Pokemon table, every
candidate is scored against a hand-written rule (type-coverage improvement
+ physical/special balance improvement + a first-mega bonus), and a
RandomForestRegressor is fit on those (team, candidate) -> label examples.
The rules only exist to generate training labels offline; the deployed API
never runs them, it only runs the fitted model.

Run once, offline, whenever the reference Pokemon data changes:

    uv run python build_team_builder.py
"""

import os
import random
from datetime import datetime, timezone

import joblib
import requests
import sklearn
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline

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

N_SYNTHETIC_TEAMS = 4000
CANDIDATES_PER_TEAM = 20
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


def compute_label(team: list[dict], candidate: dict) -> float:
    weak_types = [t for t in ATTACK_TYPES if any(m[f"against_{t}"] >= 2 for m in team)]
    if weak_types:
        resisted = sum(1 for t in weak_types if candidate[f"against_{t}"] <= 0.5)
        resist_fraction = resisted / len(weak_types)
    else:
        resist_fraction = 0.0

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

    return 0.5 * resist_fraction + 0.3 * balance_improvement + 0.2 * mega_bonus


def generate_training_data(pokemon: list[dict], rng: random.Random):
    non_legendary = [p for p in pokemon if not p["is_legendary"]]

    X_rows = []
    y = []
    for _ in range(N_SYNTHETIC_TEAMS):
        team_size = rng.randint(1, 5)
        team = rng.sample(pokemon, team_size)  # teams may include a legendary the user already caught
        team_ids = {m["id"] for m in team}

        candidate_pool = [p for p in non_legendary if p["id"] not in team_ids]
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

    rng = random.Random(RANDOM_SEED)
    print(f"Generating synthetic training data ({N_SYNTHETIC_TEAMS} teams x up to {CANDIDATES_PER_TEAM} candidates)...")
    X_rows, y = generate_training_data(pokemon, rng)
    print(f"Generated {len(X_rows)} (team, candidate) -> fit-score examples.")

    pipeline = Pipeline([
        ("features", TeamContextFeaturizer()),
        ("forest", RandomForestRegressor(
            n_estimators=200, max_depth=10, min_samples_leaf=5,
            random_state=RANDOM_SEED, n_jobs=-1,
        )),
    ])
    pipeline.fit(X_rows, y)
    train_r2 = pipeline.score(X_rows, y)
    print(f"Fitted. Train R^2 = {train_r2:.3f}")

    reference = pokemon  # full pool, so a user's team can reference a legendary they already have
    candidate_pool_ids = [p["id"] for p in pokemon if not p["is_legendary"]]

    bundle = {
        "pipeline": pipeline,
        "reference": reference,
        "candidate_pool_ids": candidate_pool_ids,
        "metadata": {
            "name": "team-builder",
            "description": (
                "Random forest trained on synthetic (partial team, candidate) -> "
                "fit-score examples; recommends non-legendary teammates that improve "
                "type coverage and physical/special balance, with a bonus for a first Mega."
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

    joblib.dump(bundle, ARTIFACT_PATH)
    print(f"Wrote {ARTIFACT_PATH} (sklearn {sklearn.__version__}).")


if __name__ == "__main__":
    main()
