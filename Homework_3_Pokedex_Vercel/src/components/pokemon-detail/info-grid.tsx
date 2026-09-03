import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GEN_LABELS } from "@/lib/chart-theme";
import { ABILITY_DESCRIPTIONS } from "@/lib/ability-descriptions";
import type { Pokemon } from "@/lib/types";

export function InfoGrid({ pokemon }: { pokemon: Pokemon }) {
  const genderLabel =
    pokemon.percentageMale === null
      ? "Genderless"
      : `${pokemon.percentageMale}% male / ${(100 - pokemon.percentageMale).toFixed(1)}% female`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Classification" value={pokemon.classification} />
          <Field label="Generation">
            <Badge variant="secondary">{GEN_LABELS[pokemon.generation]}</Badge>
          </Field>
          <Field label="Height" value={`${pokemon.heightM} m`} />
          <Field label="Weight" value={`${pokemon.weightKg} kg`} />
          <Field label="Capture rate" value={pokemon.captureRate} />
          <Field label="Base happiness" value={pokemon.baseHappiness} />
          <Field label="Gender" value={genderLabel} />
        </dl>
        <div className="mt-5">
          <p className="mb-2 text-sm text-muted-foreground">Abilities</p>
          <div className="space-y-2.5">
            {pokemon.abilities.map((a) => (
              <div key={a} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <Badge variant="outline" className="w-fit shrink-0">
                  {a}
                </Badge>
                {ABILITY_DESCRIPTIONS[a] && (
                  <p className="text-sm text-muted-foreground">{ABILITY_DESCRIPTIONS[a]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | number;
  children?: ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children ?? value}</dd>
    </div>
  );
}
