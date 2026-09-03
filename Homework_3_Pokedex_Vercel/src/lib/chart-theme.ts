import type { AttackType } from "./types";

// Ported verbatim from the Streamlit app's dataviz-skill-derived palette.
export const CATEGORICAL = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#39c239",
  "#9085e9",
  "#e66767",
];

export const SEQUENTIAL_BLUE = [
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b",
];

// Keyed by the full display type name (matches the `type1`/`type2` columns).
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

// The `against_*` column suffix uses "fight" while the type1/type2 columns
// (and TYPE_COLORS) use the full name "fighting" — normalize here.
export function attackTypeToDisplayType(t: AttackType): string {
  return t === "fight" ? "fighting" : t;
}

export const N_GENERATIONS = 9;
export const GEN_PALETTE = [...CATEGORICAL, "#a97442"]; // 9th hue for Gen 9
export const GEN_COLORS: Record<number, string> = Object.fromEntries(
  Array.from({ length: N_GENERATIONS }, (_, i) => [i + 1, GEN_PALETTE[i]])
);
export const GEN_LABELS: Record<number, string> = Object.fromEntries(
  Array.from({ length: N_GENERATIONS }, (_, i) => [i + 1, `Gen ${i + 1}`])
);
