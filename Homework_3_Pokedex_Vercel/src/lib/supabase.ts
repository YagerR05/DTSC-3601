const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const PAGE_SIZE = 1000;

/** Raw row shape as returned by the `pokemon` table (snake_case, as in Postgres). */
export type PokemonRow = {
  id: number;
  abilities: string;
  attack: number;
  base_egg_steps: number;
  base_happiness: number;
  base_total: number;
  capture_rate: number;
  classfication: string;
  defense: number;
  experience_growth: number;
  height_m: number;
  hp: number;
  japanese_name: string;
  name: string;
  percentage_male: number | null;
  pokedex_number: number;
  sp_attack: number;
  sp_defense: number;
  speed: number;
  type1: string;
  type2: string | null;
  weight_kg: number;
  generation: number;
  is_legendary: boolean;
} & Record<`against_${string}`, number>;

export async function fetchAllPokemonRows(): Promise<PokemonRow[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  }

  const rows: PokemonRow[] = [];
  let start = 0;

  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=*&order=id.asc&offset=${start}&limit=${PAGE_SIZE}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 3600, tags: ["pokemon"] },
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`);
    }

    const page = (await res.json()) as PokemonRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }

  return rows;
}
