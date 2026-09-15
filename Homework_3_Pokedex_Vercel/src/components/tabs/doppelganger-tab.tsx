"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { STAT_LABELS } from "@/lib/types";
import { findDoppelganger, MlApiError, type DoppelgangerMatch, type StatQuery } from "@/lib/ml-api";

const STAT_FIELDS: { key: keyof Omit<StatQuery, "k">; label: string }[] = [
  { key: "hp", label: STAT_LABELS.hp },
  { key: "attack", label: STAT_LABELS.attack },
  { key: "defense", label: STAT_LABELS.defense },
  { key: "sp_attack", label: STAT_LABELS.spAttack },
  { key: "sp_defense", label: STAT_LABELS.spDefense },
  { key: "speed", label: STAT_LABELS.speed },
];

const DEFAULT_STATS: Omit<StatQuery, "k"> = {
  hp: 80,
  attack: 80,
  defense: 80,
  sp_attack: 80,
  sp_defense: 80,
  speed: 80,
};

export function DoppelgangerTab() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [k, setK] = useState(5);
  const [matches, setMatches] = useState<DoppelgangerMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateStat(key: keyof Omit<StatQuery, "k">, value: string) {
    const n = Number(value);
    setStats((prev) => ({ ...prev, [key]: Number.isNaN(n) ? 0 : n }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await findDoppelganger({ ...stats, k });
      setMatches(res.matches);
    } catch (err) {
      setMatches(null);
      setError(err instanceof MlApiError ? err.message : "Couldn't reach the Doppelganger API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doppelgänger</CardTitle>
          <p className="text-sm text-muted-foreground">
            Make up a base stat line and find the real Pokemon whose stats are the closest match -
            a fitted k-nearest-neighbors model running live on{" "}
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {STAT_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`stat-${key}`}>{label}</Label>
                  <Input
                    id={`stat-${key}`}
                    type="number"
                    min={1}
                    max={255}
                    value={stats[key]}
                    onChange={(e) => updateStat(key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="doppelganger-k">Matches</Label>
                <Input
                  id="doppelganger-k"
                  type="number"
                  min={1}
                  max={10}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value) || 1)}
                  className="w-20"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find Doppelgänger"}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {matches && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m, i) => (
            <Card key={m.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <PokemonSprite
                  id={m.id}
                  name={m.name}
                  pokedexNumber={m.pokedex_number}
                  animated={i === 0}
                  size={56}
                  className="size-14 shrink-0"
                />
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{m.name}</p>
                  <div className="flex flex-wrap gap-1">
                    <TypeBadge type={m.type1} />
                    {m.type2 && <TypeBadge type={m.type2} />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Base total {m.base_total} · distance {m.distance.toFixed(3)}
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
