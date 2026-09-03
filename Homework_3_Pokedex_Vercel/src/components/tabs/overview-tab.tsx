import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BaseTotalHistogram } from "@/components/charts/base-total-histogram";
import { TopStrongestBar } from "@/components/charts/top-strongest-bar";
import type { Pokemon } from "@/lib/types";

export function OverviewTab({ pokemons }: { pokemons: Pokemon[] }) {
  const avgTotal = pokemons.length
    ? Math.round(pokemons.reduce((s, p) => s + p.baseTotal, 0) / pokemons.length)
    : 0;
  const legendaryCount = pokemons.filter((p) => p.isLegendary).length;
  const generationCount = new Set(pokemons.map((p) => p.generation)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-4">
        <MetricCard label="Pokemon" value={pokemons.length} />
        <MetricCard label="Generations" value={generationCount} />
        <MetricCard label="Legendary" value={legendaryCount} />
        <MetricCard label="Avg. Base Total" value={pokemons.length ? avgTotal : "—"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Base Total distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseTotalHistogram pokemons={pokemons} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strongest Pokemon (by Base Total)</CardTitle>
          </CardHeader>
          <CardContent>
            <TopStrongestBar pokemons={pokemons} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
