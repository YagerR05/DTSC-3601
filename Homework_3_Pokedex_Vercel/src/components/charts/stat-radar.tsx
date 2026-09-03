"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { STAT_COLS, STAT_LABELS, type Pokemon } from "@/lib/types";
import { CATEGORICAL } from "@/lib/chart-theme";

// Use index-based series keys (p0, p1, ...) rather than raw Pokemon names —
// names can contain spaces/punctuation that aren't valid CSS custom
// property name characters, which the shadcn chart CSS-var theming relies on.
export function StatRadarChart({
  pokemons,
  className,
}: {
  pokemons: Pokemon[];
  className?: string;
}) {
  const seriesKeys = pokemons.map((_, i) => `p${i}`);

  const data = STAT_COLS.map((stat) => {
    const row: Record<string, string | number> = { stat: STAT_LABELS[stat] };
    pokemons.forEach((p, i) => {
      row[seriesKeys[i]] = p[stat];
    });
    return row;
  });

  const config: ChartConfig = Object.fromEntries(
    pokemons.map((p, i) => [
      seriesKeys[i],
      { label: p.name, color: CATEGORICAL[i % CATEGORICAL.length] },
    ])
  );

  return (
    <ChartContainer config={config} className={className}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="stat" tick={{ fill: "#ffffff", fontSize: 15 }} />
        <PolarRadiusAxis tick={{ fill: "#ffffff", fontSize: 13 }} />
        {seriesKeys.map((key) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.25}
          />
        ))}
        <ChartTooltip content={<ChartTooltipContent />} />
        {pokemons.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </RadarChart>
    </ChartContainer>
  );
}
