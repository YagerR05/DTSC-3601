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

<img width="1505" height="814" alt="Screenshot 2026-08-22 135300" src="https://github.com/user-attachments/assets/56241249-593f-404e-ba9d-782fe31bc4b0" />

    Overview tab - headline metrics (1065 Pokemon, 9 generations, 95
    legendary, average base stat total) and the base-stat-total
    distribution histogram.

<img width="1509" height="812" alt="02_overview_strongest_pokemon" src="https://github.com/user-attachments/assets/49f3f9b1-d721-4e70-80c3-a589559e01b1" />

    Overview tab, scrolled down - "Strongest Pokemon (by Base Total)" chart,
    ranked highest to lowest across all generations, with each bar colored
    by its own generation.

<img width="1509" height="812" alt="03_generations" src="https://github.com/user-attachments/assets/ed20727b-f2cf-41ad-81cc-fd4205fc84a3" />

    Generations tab - Pokemon count per generation, one distinct color per
    generation (Gen 1-9).

<img width="1509" height="812" alt="04_types" src="https://github.com/user-attachments/assets/9ba5e911-75c8-4ef7-9abb-a92bbd790755" />

    Types tab - Type1 frequency chart, colored by official Pokemon type
    colors.

<img width="1510" height="812" alt="05_compare" src="https://github.com/user-attachments/assets/67d13d7d-f5d0-4fc8-886e-8836d8b661c5" />

    Compare tab - radar chart and stat table comparing base stats for
    Charizard vs. Mewtwo, showing two clearly different stat profiles.

<img width="1509" height="812" alt="06_explorer" src="https://github.com/user-attachments/assets/a3d185a8-3e28-47fc-976e-5bab71868200" />

    Explorer tab - searchable Pokedex table, showing "Rattata" search
    results with both the base Kanto form and the Alolan regional form,
    sharing National Dex #19.
