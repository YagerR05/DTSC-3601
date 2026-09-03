export type SlugConfidence = "pattern" | "generic";

export type SlugResult = {
  slug: string;
  confidence: SlugConfidence;
};

function baseSlugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/:/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derives a Pokemon Showdown sprite slug from this app's `name` column.
 * Covers the common regional/mega/primal prefix-suffix patterns found in
 * the dataset; anything else falls through to a generic slugify with
 * confidence "generic" so the audit script can flag it for review.
 */
export function nameToShowdownSlug(name: string): SlugResult {
  const trimmed = name.trim();

  const megaMatch = trimmed.match(/^Mega\s+(.+?)(\s+([XY]))?$/i);
  if (megaMatch) {
    const base = baseSlugify(megaMatch[1]);
    const suffix = megaMatch[3] ? megaMatch[3].toLowerCase() : "";
    return { slug: `${base}-mega${suffix}`, confidence: "pattern" };
  }

  const primalMatch = trimmed.match(/^Primal\s+(.+)$/i);
  if (primalMatch) {
    return {
      slug: `${baseSlugify(primalMatch[1])}-primal`,
      confidence: "pattern",
    };
  }

  const regionalPrefixes: Record<string, string> = {
    Alolan: "alola",
    Galarian: "galar",
    Hisuian: "hisui",
    Paldean: "paldea",
  };
  for (const [prefix, suffix] of Object.entries(regionalPrefixes)) {
    const re = new RegExp(`^${prefix}\\s+(.+)$`, "i");
    const match = trimmed.match(re);
    if (match) {
      return { slug: `${baseSlugify(match[1])}-${suffix}`, confidence: "pattern" };
    }
  }

  return { slug: baseSlugify(trimmed), confidence: "generic" };
}

import { SPRITE_SLUG_OVERRIDES } from "./sprite-overrides";
import { POKEAPI_ID_OVERRIDES } from "./pokeapi-id-overrides";

export function resolveSpriteSlug(id: number, name: string): string {
  return SPRITE_SLUG_OVERRIDES[id] ?? nameToShowdownSlug(name).slug;
}

/** The PokeAPI numeric id for this row's official artwork — its own id for
 * a form variant (so Paldean Tauros shows Paldean art, not base Tauros),
 * else the national dex number (correct for canonical/base-form rows). */
export function resolveArtworkId(id: number, pokedexNumber: number): number {
  return POKEAPI_ID_OVERRIDES[id] ?? pokedexNumber;
}

const SHOWDOWN_ANI_BASE = "https://play.pokemonshowdown.com/sprites/ani";
const SHOWDOWN_STATIC_BASE = "https://play.pokemonshowdown.com/sprites/gen5";
const POKEAPI_ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

export function showdownAnimatedUrl(slug: string): string {
  return `${SHOWDOWN_ANI_BASE}/${slug}.gif`;
}

export function showdownStaticUrl(slug: string): string {
  return `${SHOWDOWN_STATIC_BASE}/${slug}.png`;
}

export function pokeApiArtworkUrl(pokedexNumber: number): string {
  return `${POKEAPI_ARTWORK_BASE}/${pokedexNumber}.png`;
}
