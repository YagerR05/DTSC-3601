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
import { STAT_LABELS, type StatCol } from "@/lib/types";
import { CATEGORICAL } from "@/lib/chart-theme";

// Matches the in-game summary screen's hexagon: HP at the top, then
// clockwise through Attack, Defense, Speed, Sp. Defense, Sp. Attack.
const RADAR_STAT_ORDER: StatCol[] = ["hp", "attack", "defense", "speed", "spDefense", "spAttack"];

// Narrower than the full Pokemon type so callers can plot a live-typed
// stat query or an API match that doesn't carry every Pokemon field.
export type RadarSeries = { name: string } & Record<StatCol, number>;

// Use index-based series keys (p0, p1, ...) rather than raw Pokemon names —
// names can contain spaces/punctuation that aren't valid CSS custom
// property name characters, which the shadcn chart CSS-var theming relies on.
export function StatRadarChart({
  pokemons,
  className,
}: {
  pokemons: RadarSeries[];
  className?: string;
}) {
  const seriesKeys = pokemons.map((_, i) => `p${i}`);

  const data = RADAR_STAT_ORDER.map((stat) => {
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
