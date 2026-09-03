"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypeFrequencyBar } from "@/components/charts/type-frequency-bar";
import { TypeAvgTotalBar } from "@/components/charts/type-avg-total-bar";
import { TypeBadge } from "@/components/type-badge";
import { TYPE_COLORS } from "@/lib/chart-theme";
import { TYPE_MODE_LABELS, type TypeCountMode } from "@/lib/type-grouping";
import type { Pokemon } from "@/lib/types";

const MODES: TypeCountMode[] = ["both", "type1", "type2"];

export function TypesTab({ pokemons }: { pokemons: Pokemon[] }) {
  const [mode, setMode] = useState<TypeCountMode>("both");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(TYPE_COLORS)
            .sort()
            .map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
        </div>
        <div className="flex gap-1 rounded-md border p-0.5">
          {MODES.map((m) => (
            <Button
              key={m}
              variant={mode === m ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setMode(m)}
            >
              {TYPE_MODE_LABELS[m]}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Type frequency ({TYPE_MODE_LABELS[mode]})</CardTitle>
        </CardHeader>
        <CardContent>
          <TypeFrequencyBar pokemons={pokemons} mode={mode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Base Total by type ({TYPE_MODE_LABELS[mode]})</CardTitle>
        </CardHeader>
        <CardContent>
          <TypeAvgTotalBar pokemons={pokemons} mode={mode} />
        </CardContent>
      </Card>
    </div>
  );
}
