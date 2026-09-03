import { ATTACK_TYPES, type Pokemon } from "./types";
import { attackTypeToDisplayType } from "./chart-theme";

export type EffectivenessGroups = {
  weak4x: string[];
  weak2x: string[];
  resist2x: string[];
  resist4x: string[];
  immune: string[];
};

/**
 * The `against_*` columns are the pre-computed COMBINED effectiveness of
 * each attack type against this Pokemon's full type1+type2 combo (Kaggle
 * rounakbanik/pokemon convention). Read directly, never recompute from
 * type1/type2.
 */
export function getTypeEffectiveness(pokemon: Pokemon): EffectivenessGroups {
  const groups: EffectivenessGroups = {
    weak4x: [],
    weak2x: [],
    resist2x: [],
    resist4x: [],
    immune: [],
  };

  for (const attackType of ATTACK_TYPES) {
    const multiplier = pokemon.against[attackType];
    const displayType = attackTypeToDisplayType(attackType);

    if (multiplier === 4) groups.weak4x.push(displayType);
    else if (multiplier === 2) groups.weak2x.push(displayType);
    else if (multiplier === 0.5) groups.resist2x.push(displayType);
    else if (multiplier === 0.25) groups.resist4x.push(displayType);
    else if (multiplier === 0) groups.immune.push(displayType);
  }

  return groups;
}
