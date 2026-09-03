"use client";

import { FacetedFilter } from "./faceted-filter";
import { Button } from "@/components/ui/button";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GEN_LABELS, N_GENERATIONS, TYPE_COLORS } from "@/lib/chart-theme";
import { useFilters } from "@/lib/filters";

const GEN_OPTIONS = Array.from({ length: N_GENERATIONS }, (_, i) => ({
  value: String(i + 1),
  label: GEN_LABELS[i + 1],
}));

const TYPE_OPTIONS = Object.keys(TYPE_COLORS)
  .sort()
  .map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1), color: TYPE_COLORS[t] }));

export function FilterBar() {
  const { filters, update } = useFilters();
  const hasFilters =
    filters.generations.length > 0 || filters.types.length > 0 || filters.legendary !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FacetedFilter
        title="Generation"
        options={GEN_OPTIONS}
        selected={filters.generations.map(String)}
        onChange={(values) => update({ generations: values.map(Number) })}
      />
      <FacetedFilter
        title="Type"
        options={TYPE_OPTIONS}
        selected={filters.types}
        onChange={(values) => update({ types: values })}
      />
      <RadioGroup
        className="flex flex-row items-center gap-3 text-sm"
        value={filters.legendary}
        onValueChange={(v) => update({ legendary: v as typeof filters.legendary })}
      >
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="all" id="leg-all" />
          <Label htmlFor="leg-all">All</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="legendary" id="leg-only" />
          <Label htmlFor="leg-only">Legendary</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="non-legendary" id="leg-non" />
          <Label htmlFor="leg-non">Non-legendary</Label>
        </div>
      </RadioGroup>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => update({ generations: [], types: [], legendary: "all" })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
