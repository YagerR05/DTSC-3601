"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL } from "@/lib/chart-theme";
import { GEN_LABELS, N_GENERATIONS } from "@/lib/chart-theme";
import { STAT_COLS, STAT_LABELS, type Pokemon } from "@/lib/types";

const config: ChartConfig = Object.fromEntries(
  STAT_COLS.map((stat, i) => [stat, { label: STAT_LABELS[stat], color: CATEGORICAL[i % CATEGORICAL.length] }])
);

export function GenerationStatsLine({ pokemons }: { pokemons: Pokemon[] }) {
  const data = Array.from({ length: N_GENERATIONS }, (_, i) => {
    const gen = i + 1;
    const genPokemon = pokemons.filter((p) => p.generation === gen);
    const row: Record<string, string | number> = { label: GEN_LABELS[gen] };
    for (const stat of STAT_COLS) {
      row[stat] = genPokemon.length
        ? Math.round((genPokemon.reduce((sum, p) => sum + p[stat], 0) / genPokemon.length) * 10) / 10
        : 0;
    }
    return row;
  });

  return (
    <ChartContainer config={config} className="h-[420px] w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {STAT_COLS.map((stat) => (
          <Line
            key={stat}
            type="monotone"
            dataKey={stat}
            stroke={`var(--color-${stat})`}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
