"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

const NBINS = 28;

function histogram(values: number[], bins: number) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / width));
    counts[idx]++;
  }
  return counts.map((count, i) => ({
    range: `${Math.round(min + i * width)}`,
    count,
  }));
}

const config: ChartConfig = { count: { label: "Count", color: CATEGORICAL[0] } };

export function BaseTotalHistogram({ pokemons }: { pokemons: Pokemon[] }) {
  const data = histogram(pokemons.map((p) => p.baseTotal), NBINS);

  return (
    <ChartContainer config={config} className="h-[360px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="range"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (i % 5 === 0 ? v : "")}
          tick={{ fill: "#ffffff", fontSize: 14 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} domain={[0, "dataMax"]} />
        <ChartTooltip content={<ChartTooltipContent labelKey="range" />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}
