"""One-off script to upload data/pokemon.csv into the Supabase 'pokemon' table.

Usage: uv run python scripts/upload_to_supabase.py
"""

import json
import os

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
BATCH_SIZE = 250


def main() -> None:
    df = pd.read_csv("data/pokemon.csv")
    df["is_legendary"] = df["is_legendary"].astype(bool)
    records = json.loads(df.to_json(orient="records"))

    client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

    client.table("pokemon").delete().neq("id", 0).execute()

    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        client.table("pokemon").insert(batch).execute()
        print(f"Inserted {i + len(batch)}/{len(records)}")


if __name__ == "__main__":
    main()
