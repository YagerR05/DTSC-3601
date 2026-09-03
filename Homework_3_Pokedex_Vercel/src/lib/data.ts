import { unstable_cache } from "next/cache";
import { fetchAllPokemonRows, type PokemonRow } from "./supabase";
import { ATTACK_TYPES, type Pokemon } from "./types";

/** Parses the DB's stringified-Python-list `abilities` column, e.g. "['Overgrow', 'Chlorophyll']". */
function parseAbilities(raw: string): string[] {
  const match = raw.match(/'([^']*)'|"([^"]*)"/g);
  if (!match) return [];
  // The source dataset occasionally lists the same ability twice for one row.
  return [...new Set(match.map((s) => s.slice(1, -1)))];
}

function mapRow(row: PokemonRow): Pokemon {
  return {
    id: row.id,
    name: row.name,
    japaneseName: row.japanese_name,
    pokedexNumber: row.pokedex_number,
    generation: row.generation,
    type1: row.type1,
    type2: row.type2,
    isLegendary: row.is_legendary,
    classification: row.classfication,
    abilities: parseAbilities(row.abilities),
    hp: row.hp,
    attack: row.attack,
    defense: row.defense,
    spAttack: row.sp_attack,
    spDefense: row.sp_defense,
    speed: row.speed,
    baseTotal: row.base_total,
    heightM: row.height_m,
    weightKg: row.weight_kg,
    captureRate: row.capture_rate,
    baseHappiness: row.base_happiness,
    baseEggSteps: row.base_egg_steps,
    experienceGrowth: row.experience_growth,
    percentageMale: row.percentage_male,
    against: Object.fromEntries(
      ATTACK_TYPES.map((t) => [t, row[`against_${t}`]])
    ) as Pokemon["against"],
  };
}

export const getAllPokemon = unstable_cache(
  async (): Promise<Pokemon[]> => {
    const rows = await fetchAllPokemonRows();
    return rows.map(mapRow);
  },
  ["pokemon-all"],
  { revalidate: 3600, tags: ["pokemon"] }
);

export async function getPokemonById(id: number): Promise<Pokemon | undefined> {
  const all = await getAllPokemon();
  return all.find((p) => p.id === id);
}
