"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PokemonPicker } from "@/components/pokemon-picker";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { Input } from "@/components/ui/input";
import { recommendTeam, MlApiError, type TeamRecommendation } from "@/lib/ml-api";
import type { Pokemon } from "@/lib/types";

const MAX_TEAM = 5;

export function TeamBuilderTab({ pokemons }: { pokemons: Pokemon[] }) {
  const sorted = [...pokemons].sort((a, b) => a.pokedexNumber - b.pokedexNumber || a.name.localeCompare(b.name));

  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [k, setK] = useState(3);
  const [recommendations, setRecommendations] = useState<TeamRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team = teamIds.map((id) => sorted.find((p) => p.id === id)).filter((p): p is Pokemon => !!p);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (teamIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await recommendTeam(teamIds, k);
      setRecommendations(res.recommendations);
    } catch (err) {
      setRecommendations(null);
      setError(err instanceof MlApiError ? err.message : "Couldn't reach the Team Builder API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Builder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick 1-5 Pokemon already on your team and get recommended (non-legendary) teammates that
            improve type coverage and physical/special balance - a random forest trained on synthetic
            team-fit examples, running live on{" "}
            <a
              href="https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run/docs"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Modal
            </a>
            .
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label>Your team</Label>
                <PokemonPicker
                  title="Pick up to 5 Pokemon"
                  pokemons={sorted}
                  selectedIds={teamIds}
                  onChange={setTeamIds}
                  max={MAX_TEAM}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="team-k">Recommendations</Label>
                <Input
                  id="team-k"
                  type="number"
                  min={1}
                  max={10}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
              <Button type="submit" disabled={loading || teamIds.length === 0}>
                {loading ? "Building..." : "Recommend Teammates"}
              </Button>
            </div>

            {team.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {team.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1 rounded-lg border p-2">
                    <PokemonSprite id={p.id} name={p.name} pokedexNumber={p.pokedexNumber} size={48} className="size-12" />
                    <span className="text-xs font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {recommendations && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <PokemonSprite id={r.id} name={r.name} pokedexNumber={r.pokedex_number} size={56} className="size-14 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <div className="flex flex-wrap gap-1">
                    <TypeBadge type={r.type1} />
                    {r.type2 && <TypeBadge type={r.type2} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Base total {r.base_total} · fit score {r.fit_score.toFixed(3)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
