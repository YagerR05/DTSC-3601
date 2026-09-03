"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { TypeBarShape } from "./type-bar-shape";
import { groupPokemonsByType, type TypeCountMode } from "@/lib/type-grouping";
import type { Pokemon } from "@/lib/types";

const config: ChartConfig = { count: { label: "Count" } };

export function TypeFrequencyBar({ pokemons, mode }: { pokemons: Pokemon[]; mode: TypeCountMode }) {
  const byType = groupPokemonsByType(pokemons, mode);
  const data = [...byType.entries()]
    .map(([type, list]) => ({ type, count: list.length }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartContainer config={config} className="h-[420px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="type" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} interval={0} angle={-45} textAnchor="end" height={60} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" shape={TypeBarShape} />
      </BarChart>
    </ChartContainer>
  );
}
