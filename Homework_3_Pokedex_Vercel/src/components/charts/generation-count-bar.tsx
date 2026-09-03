"use client";

import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { GEN_COLORS, GEN_LABELS, N_GENERATIONS } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

const config: ChartConfig = { count: { label: "Count" } };

export function GenerationCountBar({ pokemons }: { pokemons: Pokemon[] }) {
  const data = Array.from({ length: N_GENERATIONS }, (_, i) => {
    const gen = i + 1;
    return { generation: gen, label: GEN_LABELS[gen], count: pokemons.filter((p) => p.generation === gen).length };
  });

  return (
    <ChartContainer config={config} className="h-[360px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={2}>
          {data.map((d) => (
            <Cell key={d.generation} fill={GEN_COLORS[d.generation]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
