# Pokedex Explorer

A Streamlit app for exploring Pokemon base stats, types, and legendary status across all 9 generations, merged from three Kaggle datasets:

- [The Complete Pokemon Dataset](https://www.kaggle.com/datasets/rounakbanik/pokemon) (Gen 1–7)
- [Generation 8 Pokemon](https://www.kaggle.com/datasets/edgaro/pokedex-gen8) (Gen 8)
- [Pokemon Generation 9 (Scarlet & Violet) Datasets](https://www.kaggle.com/datasets/timbuck/pokemon-generation-9-scarlet-violet-datasets) (Gen 9)

The Gen 8 and Gen 9 sources include some Pokemon that already appear in the Gen 1–7 dataset (e.g. regional forms sharing a base name); only genuinely new species were merged in, and missing fields (type effectiveness, Japanese name, capture rate, etc.) were backfilled from [PokeAPI](https://pokeapi.co) for schema consistency.

Regional forms (Alolan, Galarian, Hisuian, Paldean) are included as separate rows — e.g. "Alolan Rattata" is a distinct entry from "Rattata" — and are assigned the generation of their base species (Alolan Rattata is Gen 1, even though the Alolan form debuted in Gen 7), matching their shared National Dex number.

A handful of Pokemon in the original Gen 1–7 source had stats from an alternate form (Mega Evolution, Primal Reversion, regional form, battle form, etc.) instead of their standard base stats — these were audited against PokeAPI and corrected.

## Setup

Requires [uv](https://docs.astral.sh/uv/).

```bash
uv sync
uv run streamlit run app.py
```

The dataset (`data/pokemon.csv`) is bundled in this repo.

## Features

- **Overview** — headline metrics, base-stat-total distribution, top Pokemon by base total
- **Generations** — Pokemon counts, average stats, and legendary share per generation
- **Types** — type frequency and average base total by primary type
- **Compare** — radar chart comparing base stats across up to 5 Pokemon
- **Explorer** — searchable, filterable Pokedex table

Filter by generation, type, and legendary status from the sidebar; filters apply across all tabs.
