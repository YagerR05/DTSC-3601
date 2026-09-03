import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerationCountBar } from "@/components/charts/generation-count-bar";
import { GenerationStatsLine } from "@/components/charts/generation-stats-line";
import { LegendaryShareBar } from "@/components/charts/legendary-share-bar";
import type { Pokemon } from "@/lib/types";

export function GenerationsTab({ pokemons }: { pokemons: Pokemon[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Average base stats by generation</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerationStatsLine pokemons={pokemons} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pokemon count per generation</CardTitle>
          </CardHeader>
          <CardContent>
            <GenerationCountBar pokemons={pokemons} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legendary share by generation</CardTitle>
          </CardHeader>
          <CardContent>
            <LegendaryShareBar pokemons={pokemons} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
