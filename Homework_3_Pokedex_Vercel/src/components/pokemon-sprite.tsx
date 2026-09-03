"use client";

import { useState } from "react";
import {
  pokeApiArtworkUrl,
  resolveArtworkId,
  resolveSpriteSlug,
  showdownAnimatedUrl,
  showdownStaticUrl,
} from "@/lib/sprites";
import { cn } from "@/lib/utils";

type Stage = "showdown" | "pokeapi" | "placeholder";

export function PokemonSprite({
  id,
  name,
  pokedexNumber,
  animated = true,
  className,
  size,
}: {
  id: number;
  name: string;
  pokedexNumber: number;
  animated?: boolean;
  className?: string;
  size?: number;
}) {
  const [stage, setStage] = useState<Stage>("showdown");
  const slug = resolveSpriteSlug(id, name);

  const src =
    stage === "showdown"
      ? animated
        ? showdownAnimatedUrl(slug)
        : showdownStaticUrl(slug)
      : stage === "pokeapi"
        ? pokeApiArtworkUrl(resolveArtworkId(id, pokedexNumber))
        : "/fallback-sprite.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      width={size}
      height={size}
      className={cn("[image-rendering:pixelated] object-contain", className)}
      onError={() => {
        setStage((s) => (s === "showdown" ? "pokeapi" : s === "pokeapi" ? "placeholder" : s));
      }}
    />
  );
}
