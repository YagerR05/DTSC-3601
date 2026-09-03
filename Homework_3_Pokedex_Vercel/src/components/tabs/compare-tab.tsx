"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FacetedFilter } from "@/components/filters/faceted-filter";
import { StatRadarChart } from "@/components/charts/stat-radar";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { CATEGORICAL } from "@/lib/chart-theme";
import { STAT_COLS, STAT_LABELS, type Pokemon } from "@/lib/types";

const MAX_COMPARE = 5;

export function CompareTab({ pokemons }: { pokemons: Pokemon[] }) {
  const [selectedNames, setSelectedNames] = useState<string[]>(() =>
    [...pokemons].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 2).map((p) => p.name)
  );

  const options = [...pokemons]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ value: p.name, label: p.name }));

  const selected = pokemons.filter((p) => selectedNames.includes(p.name));

  function handleChange(values: string[]) {
    setSelectedNames(values.slice(0, MAX_COMPARE));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compare Pokemon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FacetedFilter title="Pick up to 5 Pokemon" options={options} selected={selectedNames} onChange={handleChange} />

          {selected.length ? (
            <>
              <div className="flex flex-wrap gap-3">
                {selected.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex flex-col items-center gap-1 rounded-lg border-2 p-3"
                    style={{ borderColor: CATEGORICAL[i % CATEGORICAL.length] }}
                  >
                    <PokemonSprite
                      id={p.id}
                      name={p.name}
                      pokedexNumber={p.pokedexNumber}
                      animated
                      size={72}
                      className="size-[72px]"
                    />
                    <span className="text-xs font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
              <StatRadarChart pokemons={selected} className="h-[520px] w-full" />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Name</TableHead>
                      {STAT_COLS.map((stat) => (
                        <TableHead key={stat}>{STAT_LABELS[stat]}</TableHead>
                      ))}
                      <TableHead>Base Total</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Gen</TableHead>
                      <TableHead>Legendary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <PokemonSprite
                            id={p.id}
                            name={p.name}
                            pokedexNumber={p.pokedexNumber}
                            animated={false}
                            size={32}
                            className="size-8"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        {STAT_COLS.map((stat) => (
                          <TableCell key={stat}>{p[stat]}</TableCell>
                        ))}
                        <TableCell>{p.baseTotal}</TableCell>
                        <TableCell className="capitalize">
                          {p.type1}
                          {p.type2 ? ` / ${p.type2}` : ""}
                        </TableCell>
                        <TableCell>{p.generation}</TableCell>
                        <TableCell>{p.isLegendary ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select at least one Pokemon to compare.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
