"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { StatRadarChart, type RadarSeries } from "@/components/charts/stat-radar";
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

function matchToRadarSeries(m: DoppelgangerMatch): RadarSeries {
  return {
    name: m.name,
    hp: m.hp,
    attack: m.attack,
    defense: m.defense,
    spAttack: m.sp_attack,
    spDefense: m.sp_defense,
    speed: m.speed,
  };
}

export function DoppelgangerTab() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [k, setK] = useState(5);
  const [matches, setMatches] = useState<DoppelgangerMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayId, setOverlayId] = useState<number | null>(null);

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
      setOverlayId(null);
    } catch (err) {
      setMatches(null);
      setError(err instanceof MlApiError ? err.message : "Couldn't reach the Doppelganger API.");
    } finally {
      setLoading(false);
    }
  }

  const queryRadarSeries: RadarSeries = {
    name: "Your query",
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    spAttack: stats.sp_attack,
    spDefense: stats.sp_defense,
    speed: stats.speed,
  };
  const overlayMatch = matches?.find((m) => m.id === overlayId) ?? null;
  const radarSeries = overlayMatch ? [queryRadarSeries, matchToRadarSeries(overlayMatch)] : [queryRadarSeries];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doppelgänger</CardTitle>
          <p className="text-sm text-muted-foreground">
            Make up a base stat line and find the real Pokemon whose stats are the closest match - a
            fitted k-nearest-neighbors model running live on{" "}
            <a
              href="https://yagerr05--pokedex-doppelganger-fastapi-app.modal.run/docs"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Modal
            </a>
            . Select a match below to overlay its stats on the chart.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <div className="space-y-3">
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
              <div className="space-y-1.5">
                <Label htmlFor="doppelganger-k">Number of matches</Label>
                <Input
                  id="doppelganger-k"
                  type="number"
                  min={1}
                  max={10}
                  value={k}
                  onChange={(e) => setK(Number(e.target.value) || 1)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Searching..." : "Find Doppelgänger"}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex flex-col items-center justify-center">
              <StatRadarChart pokemons={radarSeries} className="h-[360px] w-full" />
              {overlayMatch && (
                <p className="text-xs text-muted-foreground">
                  Overlaying {overlayMatch.name} - click "Remove from chart" below to clear it
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {matches && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => {
            const isOverlaid = overlayId === m.id;
            return (
              <Card key={m.id} className={isOverlaid ? "border-primary" : undefined}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-center gap-3">
                    <PokemonSprite
                      id={m.id}
                      name={m.name}
                      pokedexNumber={m.pokedex_number}
                      animated
                      size={56}
                      className="size-14 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{m.name}</p>
                      <div className="flex flex-wrap gap-1">
                        <TypeBadge type={m.type1} />
                        {m.type2 && <TypeBadge type={m.type2} />}
                      </div>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">HP</dt>
                      <dd className="font-medium">{m.hp}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Attack</dt>
                      <dd className="font-medium">{m.attack}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Defense</dt>
                      <dd className="font-medium">{m.defense}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sp. Atk</dt>
                      <dd className="font-medium">{m.sp_attack}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Sp. Def</dt>
                      <dd className="font-medium">{m.sp_defense}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Speed</dt>
                      <dd className="font-medium">{m.speed}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    Base total {m.base_total} · distance {m.distance.toFixed(3)}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isOverlaid ? "default" : "outline"}
                      onClick={() => setOverlayId(isOverlaid ? null : m.id)}
                      className="flex-1"
                    >
                      {isOverlaid ? "Remove from chart" : "Overlay on chart"}
                    </Button>
                    <Button size="sm" variant="secondary" render={<Link href={`/pokemon/${m.id}`} />}>
                      Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
