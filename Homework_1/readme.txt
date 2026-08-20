Homework_1 - Pokedex Explorer
=============================

DTSC 3601

A Streamlit app for exploring Pokemon base stats, types, and legendary status
across all 9 generations, including regional forms (Alolan, Galarian, Hisuian,
Paldean). Data is merged from three Kaggle datasets and cross-checked /
backfilled against PokeAPI (see README.md for full source details and setup
instructions).

HOW TO RUN
----------
Requires uv (https://docs.astral.sh/uv/).

    cd Homework_1
    uv sync
    uv run streamlit run app.py

The app opens at http://localhost:8501

SCREENSHOTS (app working)
--------------------------
All screenshots are in the screenshots/ folder.

01_overview.jpg
    Overview tab - headline metrics (1065 Pokemon, 9 generations, 95
    legendary, average base stat total) and the base-stat-total
    distribution histogram.

02_overview_strongest_pokemon.jpg
    Overview tab, scrolled down - "Strongest Pokemon (by Base Total)" chart,
    ranked highest to lowest across all generations, with each bar colored
    by its own generation.

03_generations.jpg
    Generations tab - Pokemon count per generation, one distinct color per
    generation (Gen 1-9).

04_types.jpg
    Types tab - Type1 frequency chart, colored by official Pokemon type
    colors.

05_compare.jpg
    Compare tab - radar chart and stat table comparing base stats for
    Charizard vs. Mewtwo, showing two clearly different stat profiles.

06_explorer.jpg
    Explorer tab - searchable Pokedex table, showing "Rattata" search
    results with both the base Kanto form and the Alolan regional form,
    sharing National Dex #19.
