"use client";

import { Bar, BarChart, Cell, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { GEN_COLORS, GEN_LABELS } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

const config: ChartConfig = { baseTotal: { label: "Base stat total" } };

export function TopStrongestBar({ pokemons }: { pokemons: Pokemon[] }) {
  const data = [...pokemons]
    .sort((a, b) => b.baseTotal - a.baseTotal)
    .slice(0, 15)
    .map((p) => ({ name: p.name, baseTotal: p.baseTotal, generation: p.generation }));

  return (
    <ChartContainer config={config} className="h-[460px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#ffffff", fontSize: 14 }} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
          tick={{ fill: "#ffffff", fontSize: 14 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelKey="name"
              formatter={(value, _name, item) => [
                `${value} (${GEN_LABELS[item.payload.generation]})`,
                "Base total",
              ]}
            />
          }
        />
        <Bar dataKey="baseTotal" radius={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={GEN_COLORS[d.generation]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
