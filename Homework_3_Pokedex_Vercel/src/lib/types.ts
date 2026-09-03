export type Pokemon = {
  id: number;
  name: string;
  japaneseName: string;
  pokedexNumber: number;
  generation: number;
  type1: string;
  type2: string | null;
  isLegendary: boolean;
  classification: string;
  abilities: string[];
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  baseTotal: number;
  heightM: number;
  weightKg: number;
  captureRate: number;
  baseHappiness: number;
  baseEggSteps: number;
  experienceGrowth: number;
  percentageMale: number | null;
  against: Record<AttackType, number>;
};

export const STAT_COLS = [
  "hp",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
] as const;

export type StatCol = (typeof STAT_COLS)[number];

export const STAT_LABELS: Record<StatCol, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  spAttack: "Sp. Attack",
  spDefense: "Sp. Defense",
  speed: "Speed",
};

export const ATTACK_TYPES = [
  "bug",
  "dark",
  "dragon",
  "electric",
  "fairy",
  "fight",
  "fire",
  "flying",
  "ghost",
  "grass",
  "ground",
  "ice",
  "normal",
  "poison",
  "psychic",
  "rock",
  "steel",
  "water",
] as const;

export type AttackType = (typeof ATTACK_TYPES)[number];

export const N_GENERATIONS = 9;

export type LegendaryFilter = "all" | "legendary" | "non-legendary";
