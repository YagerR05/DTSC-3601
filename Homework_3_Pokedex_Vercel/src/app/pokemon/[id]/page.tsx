import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPokemon, getPokemonById } from "@/lib/data";
import { getCanonicalPokemon, getSpeciesForms } from "@/lib/forms";
import { HeroSection } from "@/components/pokemon-detail/hero-section";
import { EffectivenessPanel } from "@/components/pokemon-detail/effectiveness-panel";
import { StatsCard } from "@/components/pokemon-detail/stats-card";
import { InfoGrid } from "@/components/pokemon-detail/info-grid";
import { BackButton } from "@/components/pokemon-detail/back-button";
import { HomeButton } from "@/components/pokemon-detail/home-button";
import { Button } from "@/components/ui/button";

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const pokemon = await getPokemonById(numericId);
  if (!pokemon) notFound();

  const all = await getAllPokemon();
  const forms = getSpeciesForms(all, pokemon.pokedexNumber);

  // Prev/next navigate species-to-species (skipping sibling forms), using
  // whichever species this pokedex number's canonical entry sits at.
  const species = getCanonicalPokemon(all);
  const index = species.findIndex((p) => p.pokedexNumber === pokemon.pokedexNumber);
  const prev = species[(index - 1 + species.length) % species.length];
  const next = species[(index + 1) % species.length];

  return (
    <div className="w-full space-y-6 px-4 py-4 sm:px-8 md:py-8 lg:px-12 xl:px-16">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <BackButton />
          <HomeButton />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/pokemon/${prev.id}`} />}>
            &larr; {prev.name}
          </Button>
          <Button variant="outline" size="sm" render={<Link href={`/pokemon/${next.id}`} />}>
            {next.name} &rarr;
          </Button>
        </div>
      </div>

      <HeroSection pokemon={pokemon} forms={forms} />

      <div className="grid gap-6 md:grid-cols-2">
        <EffectivenessPanel pokemon={pokemon} />
        <StatsCard pokemon={pokemon} />
      </div>

      <InfoGrid pokemon={pokemon} />
    </div>
  );
}
