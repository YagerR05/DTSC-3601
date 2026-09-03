import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/type-badge";
import { getTypeEffectiveness } from "@/lib/type-effectiveness";
import type { Pokemon } from "@/lib/types";

export function EffectivenessPanel({ pokemon }: { pokemon: Pokemon }) {
  const { weak4x, weak2x, resist2x, resist4x, immune } = getTypeEffectiveness(pokemon);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type effectiveness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Weak to" types={weak4x} suffix="4x" />
        <Row label="Weak to" types={weak2x} suffix="2x" />
        <Row label="Resists" types={resist2x} suffix="1/2x" />
        <Row label="Resists" types={resist4x} suffix="1/4x" />
        {immune.length > 0 && <Row label="Immune to" types={immune} suffix="0x" />}
        {!weak4x.length && !weak2x.length && !resist2x.length && !resist4x.length && !immune.length && (
          <p className="text-sm text-muted-foreground">No notable type interactions.</p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, types, suffix }: { label: string; types: string[]; suffix: string }) {
  if (!types.length) return null;
  return (
    <div>
      <p className="mb-1.5 text-sm text-muted-foreground">
        {label} <span className="font-mono text-xs">({suffix})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    </div>
  );
}
