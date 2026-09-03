"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LegendaryFilter, Pokemon } from "./types";

export type Filters = {
  generations: number[];
  types: string[];
  legendary: LegendaryFilter;
  q: string;
};

function parseFilters(params: URLSearchParams): Filters {
  const gen = params.get("gen");
  const type = params.get("type");
  const legendary = params.get("legendary");
  return {
    generations: gen ? gen.split(",").map(Number).filter(Boolean) : [],
    types: type ? type.split(",").filter(Boolean) : [],
    legendary:
      legendary === "legendary" || legendary === "non-legendary" ? legendary : "all",
    q: params.get("q") ?? "",
  };
}

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...patch };

      if (merged.generations.length) next.set("gen", merged.generations.join(","));
      else next.delete("gen");

      if (merged.types.length) next.set("type", merged.types.join(","));
      else next.delete("type");

      if (merged.legendary !== "all") next.set("legendary", merged.legendary);
      else next.delete("legendary");

      if (merged.q) next.set("q", merged.q);
      else next.delete("q");

      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router, searchParams]
  );

  return { filters, update };
}

export function applyFilters(all: Pokemon[], filters: Filters): Pokemon[] {
  let result = all;
  if (filters.generations.length) {
    const set = new Set(filters.generations);
    result = result.filter((p) => set.has(p.generation));
  }
  if (filters.types.length) {
    const set = new Set(filters.types);
    result = result.filter((p) => set.has(p.type1) || (p.type2 && set.has(p.type2)));
  }
  if (filters.legendary === "legendary") result = result.filter((p) => p.isLegendary);
  else if (filters.legendary === "non-legendary") result = result.filter((p) => !p.isLegendary);
  if (filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }
  return result;
}
