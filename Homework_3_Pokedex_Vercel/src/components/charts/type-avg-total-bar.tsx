"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { TypeBarShape } from "./type-bar-shape";
import { groupPokemonsByType, type TypeCountMode } from "@/lib/type-grouping";
import type { Pokemon } from "@/lib/types";

const config: ChartConfig = { avgTotal: { label: "Average base total" } };

export function TypeAvgTotalBar({ pokemons, mode }: { pokemons: Pokemon[]; mode: TypeCountMode }) {
  const byType = groupPokemonsByType(pokemons, mode);
  const data = [...byType.entries()]
    .map(([type, list]) => ({
      type,
      avgTotal: Math.round(list.reduce((s, p) => s + p.baseTotal, 0) / list.length),
    }))
    .sort((a, b) => b.avgTotal - a.avgTotal);

  return (
    <ChartContainer config={config} className="h-[560px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} width={92} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="avgTotal" shape={TypeBarShape} />
      </BarChart>
    </ChartContainer>
  );
}
