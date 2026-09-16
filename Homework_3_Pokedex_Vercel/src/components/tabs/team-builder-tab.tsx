"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PokemonPicker } from "@/components/pokemon-picker";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { recommendTeam, MlApiError, type SlotRecommendation } from "@/lib/ml-api";
import type { Pokemon } from "@/lib/types";

const MAX_TEAM = 5;

export function TeamBuilderTab({ pokemons }: { pokemons: Pokemon[] }) {
  const sorted = [...pokemons].sort((a, b) => a.pokedexNumber - b.pokedexNumber || a.name.localeCompare(b.name));

  const [teamIds, setTeamIds] = useState<number[]>([]);
  const [optionsPerSlot, setOptionsPerSlot] = useState(3);
  const [includeLegendaries, setIncludeLegendaries] = useState(false);
  const [includeNotFullyEvolved, setIncludeNotFullyEvolved] = useState(false);
  const [slots, setSlots] = useState<SlotRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team = teamIds.map((id) => sorted.find((p) => p.id === id)).filter((p): p is Pokemon => !!p);

  function handleClear() {
    setTeamIds([]);
    setSlots(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (teamIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await recommendTeam({
        team: teamIds,
        options_per_slot: optionsPerSlot,
        include_legendaries: includeLegendaries,
        include_not_fully_evolved: includeNotFullyEvolved,
      });
      setSlots(res.slots);
    } catch (err) {
      setSlots(null);
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
            Pick 1-5 Pokemon already on your team and get recommended teammates for each remaining
            slot - a random forest trained on synthetic team-fit examples, running live on{" "}
            <a
              href="https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run/docs"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Modal
            </a>
            . Each slot's top pick is used to choose the next slot, so later suggestions complement
            the earlier ones instead of repeating them.
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
                <Label htmlFor="team-options-per-slot">Options to show per empty slot</Label>
                <Input
                  id="team-options-per-slot"
                  type="number"
                  min={1}
                  max={5}
                  value={optionsPerSlot}
                  onChange={(e) => setOptionsPerSlot(Number(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
              <Button type="submit" disabled={loading || teamIds.length === 0}>
                {loading ? "Building..." : "Recommend Teammates"}
              </Button>
              <Button type="button" variant="outline" onClick={handleClear} disabled={teamIds.length === 0}>
                Clear selections
              </Button>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeLegendaries} onCheckedChange={(v) => setIncludeLegendaries(v === true)} />
                Include legendaries
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeNotFullyEvolved}
                  onCheckedChange={(v) => setIncludeNotFullyEvolved(v === true)}
                />
                Include not fully evolved Pokemon
              </label>
            </div>

            {team.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {team.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-1 rounded-lg border p-2">
                    <Link href={`/pokemon/${p.id}`}>
                      <PokemonSprite id={p.id} name={p.name} pokedexNumber={p.pokedexNumber} size={48} className="size-12" />
                    </Link>
                    <span className="text-xs font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {slots && slots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No eligible Pokemon matched the current filters - try enabling one of the checkboxes above.
        </p>
      )}

      {slots?.map((slot) => (
        <div key={slot.position} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Team Member {slot.position}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slot.options.map((r, i) => (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <PokemonSprite id={r.id} name={r.name} pokedexNumber={r.pokedex_number} size={56} className="size-14 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{r.name}</p>
                      {i === 0 && <Badge variant="secondary">Best fit</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <TypeBadge type={r.type1} />
                      {r.type2 && <TypeBadge type={r.type2} />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Base total {r.base_total} · fit score {r.fit_score.toFixed(3)}
                    </p>
                    <Button size="sm" variant="secondary" render={<Link href={`/pokemon/${r.id}`} />}>
                      Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
