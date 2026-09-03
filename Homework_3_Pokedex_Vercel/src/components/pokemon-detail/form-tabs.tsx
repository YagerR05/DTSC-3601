import Link from "next/link";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { cn } from "@/lib/utils";
import type { Pokemon } from "@/lib/types";

const VARIANT_PREFIXES = ["Mega", "Primal", "Alolan", "Galarian", "Hisuian", "Paldean"];

function formLabel(name: string, isCanonical: boolean): string {
  if (isCanonical) return "Base";

  const megaMatch = name.match(/^Mega\s+.+?(\s+([XY]))?$/i);
  if (megaMatch) return `Mega${megaMatch[2] ? ` ${megaMatch[2]}` : ""}`;

  for (const prefix of VARIANT_PREFIXES) {
    if (new RegExp(`^${prefix}\\s+`, "i").test(name)) return prefix;
  }

  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];

  return name;
}

export function FormTabs({ forms, activeId }: { forms: Pokemon[]; activeId: number }) {
  if (forms.length < 2) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {forms.map((form, i) => {
        const isActive = form.id === activeId;
        return (
          <Link
            key={form.id}
            href={`/pokemon/${form.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/50 hover:bg-accent"
            )}
          >
            <PokemonSprite
              id={form.id}
              name={form.name}
              pokedexNumber={form.pokedexNumber}
              animated={false}
              size={20}
              className="size-5"
            />
            {formLabel(form.name, i === 0)}
          </Link>
        );
      })}
    </div>
  );
}
