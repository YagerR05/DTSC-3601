import type { Pokemon } from "./types";

const VARIANT_PREFIXES = ["Mega", "Primal", "Alolan", "Galarian", "Hisuian", "Paldean"];

/** True if this row's name marks it as a form/variant rather than a species' base entry. */
export function isFormVariant(name: string): boolean {
  const trimmed = name.trim();
  if (VARIANT_PREFIXES.some((p) => new RegExp(`^${p}\\s+`, "i").test(trimmed))) return true;
  if (/\(.+\)/.test(trimmed)) return true; // e.g. "Paldean Tauros (Combat Breed)"
  return false;
}

export type SpeciesGroup = {
  pokedexNumber: number;
  canonical: Pokemon;
  /** All rows for this species, canonical entry first. */
  forms: Pokemon[];
};

export function groupBySpecies(all: Pokemon[]): Map<number, SpeciesGroup> {
  const rowsByDex = new Map<number, Pokemon[]>();
  for (const p of all) {
    if (!rowsByDex.has(p.pokedexNumber)) rowsByDex.set(p.pokedexNumber, []);
    rowsByDex.get(p.pokedexNumber)!.push(p);
  }

  const result = new Map<number, SpeciesGroup>();
  for (const [dexNum, rows] of rowsByDex) {
    const nonVariants = rows.filter((r) => !isFormVariant(r.name));
    const canonical = nonVariants[0] ?? [...rows].sort((a, b) => a.id - b.id)[0];
    const forms = [canonical, ...rows.filter((r) => r.id !== canonical.id)];
    result.set(dexNum, { pokedexNumber: dexNum, canonical, forms });
  }
  return result;
}

/** One row per species (the canonical/base form), sorted by Pokedex number. */
export function getCanonicalPokemon(all: Pokemon[]): Pokemon[] {
  return [...groupBySpecies(all).values()]
    .map((g) => g.canonical)
    .sort((a, b) => a.pokedexNumber - b.pokedexNumber);
}

export function getSpeciesForms(all: Pokemon[], pokedexNumber: number): Pokemon[] {
  return groupBySpecies(all).get(pokedexNumber)?.forms ?? [];
}
