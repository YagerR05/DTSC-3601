"use client";

import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { GEN_COLORS, GEN_LABELS, N_GENERATIONS } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

const config: ChartConfig = { pct: { label: "% Legendary" } };

export function LegendaryShareBar({ pokemons }: { pokemons: Pokemon[] }) {
  const data = Array.from({ length: N_GENERATIONS }, (_, i) => {
    const gen = i + 1;
    const genPokemon = pokemons.filter((p) => p.generation === gen);
    const pct = genPokemon.length
      ? (genPokemon.filter((p) => p.isLegendary).length / genPokemon.length) * 100
      : 0;
    return { generation: gen, label: GEN_LABELS[gen], pct: Math.round(pct * 10) / 10 };
  });

  return (
    <ChartContainer config={config} className="h-[340px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} unit="%" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="pct" radius={2}>
          {data.map((d) => (
            <Cell key={d.generation} fill={GEN_COLORS[d.generation]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
