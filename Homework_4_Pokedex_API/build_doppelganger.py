"""Fits the Doppelganger stat-similarity pipeline and dumps a bundle to
doppelganger.joblib. Run this once, offline, whenever the reference
Pokemon data changes:

    uv run python build_doppelganger.py
"""

import os
from datetime import datetime, timezone

import joblib
import pandas as pd
import requests
import sklearn
from dotenv import load_dotenv
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_def import STAT_COLUMNS, StatFeatureEngineer

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
PAGE_SIZE = 1000
ARTIFACT_PATH = "doppelganger.joblib"

SELECT_COLUMNS = (
    "id,name,pokedex_number,generation,type1,type2,is_legendary,"
    "hp,attack,defense,sp_attack,sp_defense,speed,base_total"
)


def fetch_all_pokemon() -> pd.DataFrame:
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
    return pd.DataFrame(rows)


def main():
    print("Fetching Pokemon data from Supabase...")
    df = fetch_all_pokemon()
    print(f"Fetched {len(df)} rows.")

    stats_df = df[STAT_COLUMNS].astype(float)

    pipeline = Pipeline([
        ("features", StatFeatureEngineer()),
        ("scale", StandardScaler()),
    ])
    transformed = pipeline.fit_transform(stats_df)

    neighbors = NearestNeighbors(n_neighbors=6, metric="euclidean")
    neighbors.fit(transformed)

    reference_df = df[[
        "id", "name", "pokedex_number", "generation", "type1", "type2", "is_legendary", "base_total",
    ] + STAT_COLUMNS].astype(object)
    reference_df = reference_df.where(reference_df.notna(), None)  # NaN -> None (e.g. type2)
    reference = reference_df.to_dict(orient="records")

    bundle = {
        "pipeline": pipeline,
        "neighbors": neighbors,
        "reference": reference,
        "metadata": {
            "name": "doppelganger",
            "description": "K-nearest-neighbors stat-similarity finder over base Pokemon stats.",
            "steps": [name for name, _ in pipeline.steps] + ["neighbors (NearestNeighbors)"],
            "feature_names": pipeline.named_steps["features"].get_feature_names_out().tolist(),
            "n_reference_pokemon": len(df),
            "built_at": datetime.now(timezone.utc).isoformat(),
            "sklearn_version": sklearn.__version__,
        },
    }

    joblib.dump(bundle, ARTIFACT_PATH)
    print(f"Wrote {ARTIFACT_PATH} ({len(df)} reference Pokemon, sklearn {sklearn.__version__}).")


if __name__ == "__main__":
    main()
