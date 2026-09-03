"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shuffle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PokemonGrid } from "@/components/explore/pokemon-grid";
import { PokemonTable } from "@/components/explore/pokemon-table";
import { useFilters } from "@/lib/filters";
import type { Pokemon } from "@/lib/types";

export function ExploreTab({ pokemons, randomPool }: { pokemons: Pokemon[]; randomPool: Pokemon[] }) {
  const { filters, update } = useFilters();
  const [view, setView] = useState<"grid" | "table">("grid");
  const router = useRouter();

  function goRandom() {
    if (!randomPool.length) return;
    const pick = randomPool[Math.floor(Math.random() * randomPool.length)];
    router.push(`/pokemon/${pick.id}`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Browse every Pokemon by sprite, or search by name below — click one to see its full stats,
        type matchups, and forms.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="pl-8"
            defaultValue={filters.q}
            onChange={(e) => update({ q: e.target.value })}
          />
        </div>
        <Button variant="outline" size="sm" onClick={goRandom} disabled={!randomPool.length}>
          <Shuffle className="size-4" />
          Random
        </Button>
        <div className="ml-auto flex gap-1 rounded-md border p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("grid")}
          >
            Sprite grid
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >
            Table
          </Button>
        </div>
      </div>

      {view === "grid" ? <PokemonGrid pokemons={pokemons} /> : <PokemonTable pokemons={pokemons} />}
    </div>
  );
}
