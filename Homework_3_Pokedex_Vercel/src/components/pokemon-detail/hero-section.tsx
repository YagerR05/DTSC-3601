import { Sparkles } from "lucide-react";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { TypeBadge } from "@/components/type-badge";
import { StatRadarChart } from "@/components/charts/stat-radar";
import { FormTabs } from "@/components/pokemon-detail/form-tabs";
import { TYPE_COLORS } from "@/lib/chart-theme";
import type { Pokemon } from "@/lib/types";

export function HeroSection({ pokemon, forms }: { pokemon: Pokemon; forms: Pokemon[] }) {
  const accent = TYPE_COLORS[pokemon.type1] ?? "#888888";
  const accent2 = TYPE_COLORS[pokemon.type2 ?? pokemon.type1] ?? accent;

  return (
    <div
      className="overflow-hidden rounded-xl border p-6 md:p-10"
      style={{
        backgroundImage: `radial-gradient(circle at 15% 15%, ${accent}33, transparent 55%), radial-gradient(circle at 85% 85%, ${accent2}26, transparent 55%)`,
      }}
    >
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-4">
        <PokemonSprite
          id={pokemon.id}
          name={pokemon.name}
          pokedexNumber={pokemon.pokedexNumber}
          animated
          size={200}
          className="size-48 drop-shadow-lg md:size-56"
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">#{String(pokemon.pokedexNumber).padStart(4, "0")}</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight">{pokemon.name}</h1>
          <p className="text-sm text-muted-foreground">{pokemon.japaneseName}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <TypeBadge type={pokemon.type1} />
            {pokemon.type2 && <TypeBadge type={pokemon.type2} />}
            {pokemon.isLegendary && (
              <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-500">
                <Sparkles className="size-3" /> Legendary
              </span>
            )}
          </div>
          <div className="mt-4">
            <FormTabs forms={forms} activeId={pokemon.id} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <StatRadarChart pokemons={[pokemon]} className="h-[280px] w-full" />
      </div>
      </div>
    </div>
  );
}
