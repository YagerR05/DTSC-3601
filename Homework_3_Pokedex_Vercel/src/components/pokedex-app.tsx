"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBar } from "@/components/filters/filter-bar";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { GenerationsTab } from "@/components/tabs/generations-tab";
import { TypesTab } from "@/components/tabs/types-tab";
import { CompareTab } from "@/components/tabs/compare-tab";
import { ExploreTab } from "@/components/tabs/explore-tab";
import { applyFilters, useFilters } from "@/lib/filters";
import { getCanonicalPokemon, groupBySpecies } from "@/lib/forms";
import { LIST_URL_STORAGE_KEY } from "@/lib/list-url-memory";
import type { Pokemon } from "@/lib/types";

export function PokedexApp({ pokemons }: { pokemons: Pokemon[] }) {
  const { filters } = useFilters();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Remembers the list page's current URL (filters and all) so the detail
  // page's Home button can jump straight back to it, even many form/prev-
  // next hops later — router.back() alone only undoes one step at a time.
  useEffect(() => {
    const qs = searchParams.toString();
    sessionStorage.setItem(LIST_URL_STORAGE_KEY, qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  // Species-level views (one row per Pokedex number) drive Overview,
  // Generations, and Explore's browse/search — a Pokemon and its regional
  // forms shouldn't inflate these counts. Types and Compare keep every row,
  // since a form's own type/stat profile is meaningful there.
  const canonicalAll = getCanonicalPokemon(pokemons);
  const canonicalFiltered = applyFilters(canonicalAll, { ...filters, q: "" });
  const allFormsFiltered = applyFilters(pokemons, { ...filters, q: "" });

  const speciesGroups = groupBySpecies(pokemons);
  const q = filters.q.trim().toLowerCase();
  const exploreFiltered = canonicalFiltered.filter((p) => {
    if (!q) return true;
    const forms = speciesGroups.get(p.pokedexNumber)?.forms ?? [p];
    return forms.some((f) => f.name.toLowerCase().includes(q));
  });
  // The "Random" button can land on any form, not just the canonical
  // species shown in the grid — same generation/type/legendary + search
  // filters, just not deduped down to one row per species.
  const randomPool = q ? allFormsFiltered.filter((p) => p.name.toLowerCase().includes(q)) : allFormsFiltered;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
          Pokemon Across the Generations
        </h1>
        <p className="text-base text-muted-foreground">
          Explore base stats, types, and legendary status across all nine generations.
        </p>
      </header>

      <div className="flex items-center justify-between gap-4">
        <FilterBar />
        <p className="shrink-0 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{canonicalFiltered.length}</span> of{" "}
          {canonicalAll.length} Pokemon match
        </p>
      </div>

      <Tabs defaultValue="explore">
        <TabsList>
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generations">Generations</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab pokemons={canonicalFiltered} />
        </TabsContent>
        <TabsContent value="generations">
          <GenerationsTab pokemons={canonicalFiltered} />
        </TabsContent>
        <TabsContent value="types">
          <TypesTab pokemons={allFormsFiltered} />
        </TabsContent>
        <TabsContent value="compare">
          <CompareTab pokemons={allFormsFiltered} />
        </TabsContent>
        <TabsContent value="explore">
          <ExploreTab pokemons={exploreFiltered} randomPool={randomPool} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
