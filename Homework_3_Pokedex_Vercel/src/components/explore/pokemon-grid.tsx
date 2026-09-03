"use client";

import Link from "next/link";
import { VirtuosoGrid } from "react-virtuoso";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { GEN_LABELS, TYPE_COLORS } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

export function PokemonGrid({ pokemons }: { pokemons: Pokemon[] }) {
  if (!pokemons.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        No Pokemon match your search/filters.
      </p>
    );
  }

  return (
    <VirtuosoGrid
      style={{ height: 640 }}
      totalCount={pokemons.length}
      listClassName="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10"
      itemContent={(index) => {
        const p = pokemons[index];
        const accent = TYPE_COLORS[p.type1] ?? "#888888";
        return (
          <Link
            href={`/pokemon/${p.id}`}
            className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors hover:bg-accent"
            style={{ borderColor: `${accent}55` }}
          >
            <PokemonSprite
              id={p.id}
              name={p.name}
              pokedexNumber={p.pokedexNumber}
              animated={false}
              size={72}
              className="size-[72px]"
            />
            <span className="line-clamp-1 text-xs font-medium">{p.name}</span>
            <span className="text-[11px] text-muted-foreground">{GEN_LABELS[p.generation]}</span>
          </Link>
        );
      }}
    />
  );
}
