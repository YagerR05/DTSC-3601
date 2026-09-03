// Pokemon GO-style circular type-icon badges (datamined game assets,
// community-hosted on GitHub — same kind of fan-hosted asset CDN as the
// Showdown sprites used elsewhere in this app).
export function typeIconUrl(type: string): string {
  return `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_${type.toUpperCase()}.png`;
}
