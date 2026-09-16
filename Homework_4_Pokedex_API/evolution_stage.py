"""Final-evolution lookup, built from PokeAPI's evolution-chain data.

PokeAPI models regional/mechanical forms (Alolan, Mega, Gigantamax, etc.) as
Pokemon under a shared *species*, not as separate species - so evolution
stage is fundamentally a species-level property, and a species id lines up
with the national Pokedex number our `pokemon` table already stores. That
lets every regional form correctly inherit its base species' stage (Alolan
Vulpix is stage 1, same as Kantonian Vulpix) with no per-form mapping needed.

Two kinds of exceptions need overriding by name, not species:
  - Mega/Primal formes can never evolve further, regardless of their base
    species' own evolution line (handled automatically - see is_mega below).
  - A handful of alternate forms change evolvability vs. their species'
    normal forms (e.g. Eternal Flower Floette cannot evolve into Florges,
    even though ordinary Floette can) - handled via FINAL_EVOLUTION_OVERRIDES.

Run standalone to (re)build the local cache:
    uv run python evolution_stage.py
"""

import json
from pathlib import Path

import requests

CACHE_PATH = Path(__file__).parent / "evolution_stage_cache.json"

# Exact `name` values from the `pokemon` table whose evolvability differs
# from their species' ordinary forms. True = treat as a final evolution.
FINAL_EVOLUTION_OVERRIDES: dict[str, bool] = {
    "Floette Eternal": True,
}


def _walk_chain(node: dict, final_by_species_id: dict[int, bool]) -> None:
    species_id = int(node["species"]["url"].rstrip("/").split("/")[-1])
    evolves_to = node.get("evolves_to") or []
    final_by_species_id[species_id] = len(evolves_to) == 0
    for child in evolves_to:
        _walk_chain(child, final_by_species_id)


def build_cache() -> dict[int, bool]:
    """Fetches every evolution chain from PokeAPI once and returns a
    {species_id: is_final_evolution} map covering every species with a
    documented evolution line."""
    count = requests.get("https://pokeapi.co/api/v2/evolution-chain/?limit=1", timeout=30).json()["count"]

    final_by_species_id: dict[int, bool] = {}
    for chain_id in range(1, count + 1):
        res = requests.get(f"https://pokeapi.co/api/v2/evolution-chain/{chain_id}/", timeout=30)
        if res.status_code != 200:
            continue
        chain = res.json()["chain"]
        _walk_chain(chain, final_by_species_id)
        if chain_id % 100 == 0:
            print(f"  ...fetched {chain_id}/{count} evolution chains")

    return final_by_species_id


def load_or_build_cache() -> dict[int, bool]:
    if CACHE_PATH.exists():
        raw = json.loads(CACHE_PATH.read_text())
        return {int(k): v for k, v in raw.items()}

    print("No local evolution-stage cache found - fetching from PokeAPI (one-time, ~541 requests)...")
    final_by_species_id = build_cache()
    CACHE_PATH.write_text(json.dumps(final_by_species_id, indent=2, sort_keys=True))
    print(f"Cached evolution stage for {len(final_by_species_id)} species to {CACHE_PATH.name}.")
    return final_by_species_id


class EvolutionStageResolver:
    def __init__(self):
        self._final_by_species_id = load_or_build_cache()

    def is_final_evolution(self, name: str, pokedex_number: int, is_mega: bool) -> bool:
        if name in FINAL_EVOLUTION_OVERRIDES:
            return FINAL_EVOLUTION_OVERRIDES[name]
        if is_mega:
            return True
        # Species PokeAPI hasn't documented yet (very new additions) - assume
        # final rather than wrongly excluding a Pokemon we can't classify.
        return self._final_by_species_id.get(pokedex_number, True)


if __name__ == "__main__":
    resolver = EvolutionStageResolver()
    checks = [
        ("Charmander", 4, False),
        ("Charizard", 6, False),
        ("Eevee", 133, False),
        ("Tauros", 128, False),
        ("Floette", 670, False),
        ("Floette Eternal", 670, False),
        ("Florges", 671, False),
        ("Mega Charizard X", 6, True),
    ]
    for name, dex, mega in checks:
        print(f"{name:20s} dex={dex:4d} mega={mega!s:5s} -> final={resolver.is_final_evolution(name, dex, mega)}")
