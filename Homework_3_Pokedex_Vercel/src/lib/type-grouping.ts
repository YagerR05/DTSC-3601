import type { Pokemon } from "./types";

export type TypeCountMode = "both" | "type1" | "type2";

export const TYPE_MODE_LABELS: Record<TypeCountMode, string> = {
  both: "Both",
  type1: "Type 1",
  type2: "Type 2",
};

/** Groups Pokemon by type under the given counting mode; dual-typed Pokemon
 * appear under both buckets in "both" mode. */
export function groupPokemonsByType(pokemons: Pokemon[], mode: TypeCountMode): Map<string, Pokemon[]> {
  const map = new Map<string, Pokemon[]>();
  function add(type: string, p: Pokemon) {
    if (!map.has(type)) map.set(type, []);
    map.get(type)!.push(p);
  }
  for (const p of pokemons) {
    if (mode === "type1" || mode === "both") add(p.type1, p);
    if ((mode === "type2" || mode === "both") && p.type2) add(p.type2, p);
  }
  return map;
}
