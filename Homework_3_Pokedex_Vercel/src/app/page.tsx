import { Suspense } from "react";
import { getAllPokemon } from "@/lib/data";
import { PokedexApp } from "@/components/pokedex-app";
import { Skeleton } from "@/components/ui/skeleton";

export default async function Home() {
  const pokemons = await getAllPokemon();

  return (
    <main className="w-full px-4 py-4 sm:px-8 md:py-8 lg:px-12 xl:px-16">
      <Suspense fallback={<PageSkeleton />}>
        <PokedexApp pokemons={pokemons} />
      </Suspense>
    </main>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
