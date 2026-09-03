// Matches pokemondb.net's base-stat bar color scale exactly (verified
// against their own CSS): 30-point bands from red (weak) to teal (elite).
const BANDS: { max: number; color: string }[] = [
  { max: 29, color: "#f34444" },
  { max: 59, color: "#ff7f0f" },
  { max: 89, color: "#ffdd57" },
  { max: 119, color: "#a0e515" },
  { max: 149, color: "#23cd5e" },
  { max: Infinity, color: "#00c2b8" },
];

export function statBarColor(value: number): string {
  return BANDS.find((b) => value <= b.max)!.color;
}

// The practical max a single base stat reaches in the games (Blissey's HP).
export const STAT_BAR_SCALE_MAX = 255;
