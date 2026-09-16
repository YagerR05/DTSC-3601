"""One-time script: populates the `is_final_evolution` column on the shared
Supabase `pokemon` table (used by both Homework_3_Pokedex_Vercel and this
project) from the PokeAPI-derived evolution-stage cache.

Requires the column to already exist - run this once in the Supabase SQL
Editor first:

    ALTER TABLE pokemon ADD COLUMN is_final_evolution boolean DEFAULT true;

Then, from this directory:

    uv run python populate_final_evolution_column.py

Uses the SECRET (service-role) key, read live from
Homework_2_Pokedex_Cloud_Deploy/.env - same pattern as the historical
abilities-fix script. The secret is never written to this project's files,
logged, or committed.
"""

import os
from pathlib import Path

import requests
from dotenv import load_dotenv

from evolution_stage import EvolutionStageResolver

load_dotenv()  # this project's own .env: SUPABASE_URL + anon key

SECRET_ENV_PATH = Path(__file__).parent.parent / "Homework_2_Pokedex_Cloud_Deploy" / ".env"

SUPABASE_URL = os.environ["SUPABASE_URL"]
PAGE_SIZE = 1000


def load_secret_key() -> str:
    if not SECRET_ENV_PATH.exists():
        raise SystemExit(f"Expected secret key in {SECRET_ENV_PATH}, but that file doesn't exist.")
    for line in SECRET_ENV_PATH.read_text().splitlines():
        if line.startswith("SUPABASE_SECRET_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"SUPABASE_SECRET_KEY not found in {SECRET_ENV_PATH}.")


def fetch_all_pokemon(headers: dict) -> list[dict]:
    rows = []
    start = 0
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/pokemon?select=id,name,pokedex_number"
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


def main():
    secret_key = load_secret_key()
    headers = {
        "apikey": secret_key,
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
    }

    print("Fetching Pokemon rows...")
    rows = fetch_all_pokemon(headers)
    print(f"Fetched {len(rows)} rows.")

    resolver = EvolutionStageResolver()

    updated = 0
    for row in rows:
        is_mega = row["name"].startswith(("Mega ", "Primal "))
        is_final = resolver.is_final_evolution(row["name"], row["pokedex_number"], is_mega)

        res = requests.patch(
            f"{SUPABASE_URL}/rest/v1/pokemon?id=eq.{row['id']}",
            headers=headers,
            json={"is_final_evolution": is_final},
            timeout=30,
        )
        res.raise_for_status()
        updated += 1
        if updated % 200 == 0:
            print(f"  ...updated {updated}/{len(rows)}")

    print(f"Done. Updated is_final_evolution on {updated} rows.")


if __name__ == "__main__":
    main()
