// Adds sprite-slug and PokeAPI-artwork-id overrides for the 72 mechanical
// forms inserted earlier. Their custom prefix-style names ("Hero Palafin",
// "Black Kyurem", ...) don't match the existing regional/Mega slug
// patterns, so they were silently falling back to base-species art.
// Updates src/lib/sprite-overrides.ts and src/lib/pokeapi-id-overrides.ts
// in place. Run with:
//   node scripts/fix-new-form-overrides.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf-8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

// name (as stored in DB) -> { showdownSlug (omit if the existing Mega/Primal
// pattern already handles it correctly), pokeApiName (for artwork id lookup) }
const FORM_SLUGS = {
  "Heat Rotom": { showdown: "rotom-heat", pokeApiName: "rotom-heat" },
  "Wash Rotom": { showdown: "rotom-wash", pokeApiName: "rotom-wash" },
  "Frost Rotom": { showdown: "rotom-frost", pokeApiName: "rotom-frost" },
  "Fan Rotom": { showdown: "rotom-fan", pokeApiName: "rotom-fan" },
  "Mow Rotom": { showdown: "rotom-mow", pokeApiName: "rotom-mow" },
  "Sunny Castform": { showdown: "castform-sunny", pokeApiName: "castform-sunny" },
  "Rainy Castform": { showdown: "castform-rainy", pokeApiName: "castform-rainy" },
  "Snowy Castform": { showdown: "castform-snowy", pokeApiName: "castform-snowy" },
  "Black Kyurem": { showdown: "kyurem-black", pokeApiName: "kyurem-black" },
  "White Kyurem": { showdown: "kyurem-white", pokeApiName: "kyurem-white" },
  "Dusk Mane Necrozma": { showdown: "necrozma-duskmane", pokeApiName: "necrozma-dusk" },
  "Dawn Wings Necrozma": { showdown: "necrozma-dawnwings", pokeApiName: "necrozma-dawn" },
  "Ultra Necrozma": { showdown: "necrozma-ultra", pokeApiName: "necrozma-ultra" },
  "Unbound Hoopa": { showdown: "hoopa-unbound", pokeApiName: "hoopa-unbound" },
  "Crowned Zacian": { showdown: "zacian-crowned", pokeApiName: "zacian-crowned" },
  "Crowned Zamazenta": { showdown: "zamazenta-crowned", pokeApiName: "zamazenta-crowned" },
  "Eternamax Eternatus": { showdown: "eternatus-eternamax", pokeApiName: "eternatus-eternamax" },
  "Ice Rider Calyrex": { showdown: "calyrex-ice", pokeApiName: "calyrex-ice" },
  "Shadow Rider Calyrex": { showdown: "calyrex-shadow", pokeApiName: "calyrex-shadow" },
  "Bloodmoon Ursaluna": { showdown: "ursaluna-bloodmoon", pokeApiName: "ursaluna-bloodmoon" },
  "Eternal Flower Floette": { showdown: "floette-eternal", pokeApiName: "floette-eternal" },
  "Hero Palafin": { showdown: "palafin-hero", pokeApiName: "palafin-hero" },
  // Mega/Primal forms already resolve correctly via the existing pattern
  // matcher in sprites.ts — only need their PokeAPI artwork id here.
  "Mega Venusaur": { pokeApiName: "venusaur-mega" },
  "Mega Blastoise": { pokeApiName: "blastoise-mega" },
  "Mega Beedrill": { pokeApiName: "beedrill-mega" },
  "Mega Pidgeot": { pokeApiName: "pidgeot-mega" },
  "Mega Alakazam": { pokeApiName: "alakazam-mega" },
  "Mega Slowbro": { pokeApiName: "slowbro-mega" },
  "Mega Gengar": { pokeApiName: "gengar-mega" },
  "Mega Kangaskhan": { pokeApiName: "kangaskhan-mega" },
  "Mega Pinsir": { pokeApiName: "pinsir-mega" },
  "Mega Gyarados": { pokeApiName: "gyarados-mega" },
  "Mega Aerodactyl": { pokeApiName: "aerodactyl-mega" },
  "Mega Ampharos": { pokeApiName: "ampharos-mega" },
  "Mega Steelix": { pokeApiName: "steelix-mega" },
  "Mega Scizor": { pokeApiName: "scizor-mega" },
  "Mega Heracross": { pokeApiName: "heracross-mega" },
  "Mega Houndoom": { pokeApiName: "houndoom-mega" },
  "Mega Tyranitar": { pokeApiName: "tyranitar-mega" },
  "Mega Sceptile": { pokeApiName: "sceptile-mega" },
  "Mega Blaziken": { pokeApiName: "blaziken-mega" },
  "Mega Swampert": { pokeApiName: "swampert-mega" },
  "Mega Gardevoir": { pokeApiName: "gardevoir-mega" },
  "Mega Sableye": { pokeApiName: "sableye-mega" },
  "Mega Mawile": { pokeApiName: "mawile-mega" },
  "Mega Aggron": { pokeApiName: "aggron-mega" },
  "Mega Medicham": { pokeApiName: "medicham-mega" },
  "Mega Manectric": { pokeApiName: "manectric-mega" },
  "Mega Sharpedo": { pokeApiName: "sharpedo-mega" },
  "Mega Camerupt": { pokeApiName: "camerupt-mega" },
  "Mega Altaria": { pokeApiName: "altaria-mega" },
  "Mega Banette": { pokeApiName: "banette-mega" },
  "Mega Absol": { pokeApiName: "absol-mega" },
  "Mega Glalie": { pokeApiName: "glalie-mega" },
  "Mega Salamence": { pokeApiName: "salamence-mega" },
  "Mega Metagross": { pokeApiName: "metagross-mega" },
  "Mega Latias": { pokeApiName: "latias-mega" },
  "Mega Latios": { pokeApiName: "latios-mega" },
  "Mega Rayquaza": { pokeApiName: "rayquaza-mega" },
  "Mega Lopunny": { pokeApiName: "lopunny-mega" },
  "Mega Garchomp": { pokeApiName: "garchomp-mega" },
  "Mega Lucario": { pokeApiName: "lucario-mega" },
  "Mega Abomasnow": { pokeApiName: "abomasnow-mega" },
  "Mega Gallade": { pokeApiName: "gallade-mega" },
  "Mega Audino": { pokeApiName: "audino-mega" },
  "Mega Diancie": { pokeApiName: "diancie-mega" },
  "Mega Charizard X": { pokeApiName: "charizard-mega-x" },
  "Mega Charizard Y": { pokeApiName: "charizard-mega-y" },
  "Mega Mewtwo X": { pokeApiName: "mewtwo-mega-x" },
  "Mega Mewtwo Y": { pokeApiName: "mewtwo-mega-y" },
  "Primal Kyogre": { pokeApiName: "kyogre-primal" },
  "Primal Groudon": { pokeApiName: "groudon-primal" },
};

async function fetchAllRows() {
  const rows = [];
  let start = 0;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=id,name&order=id.asc&offset=${start}&limit=1000`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
    start += 1000;
  }
  return rows;
}

async function poolMap(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

const rows = await fetchAllRows();
const idByName = new Map(rows.map((r) => [r.name, r.id]));

const entries = Object.entries(FORM_SLUGS).map(([name, info]) => ({ name, id: idByName.get(name), ...info }));
const missing = entries.filter((e) => !e.id);
if (missing.length) {
  console.log("WARNING: names not found in DB:", missing.map((m) => m.name));
}

console.log(`Fetching PokeAPI numeric ids for ${entries.length} forms...`);
const withArtworkId = await poolMap(entries.filter((e) => e.id), 8, async (e) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${e.pokeApiName}`);
  if (!res.ok) return { ...e, artworkId: null, error: `${res.status}` };
  const data = await res.json();
  return { ...e, artworkId: data.id };
});

const errors = withArtworkId.filter((e) => e.error);
if (errors.length) console.log("PokeAPI fetch errors:", errors);

// ---- Write sprite-overrides.ts additions ----
const spriteOverridesPath = path.join(__dirname, "..", "src", "lib", "sprite-overrides.ts");
let spriteSrc = fs.readFileSync(spriteOverridesPath, "utf-8");
const spriteLines = withArtworkId
  .filter((e) => e.showdown)
  .map((e) => `  ${e.id}: "${e.showdown}", // ${e.name}`)
  .join("\n");
spriteSrc = spriteSrc.replace(
  /(export const SPRITE_SLUG_OVERRIDES: Record<number, string> = \{)/,
  `$1\n  // Mechanical-form rows (Rotom/Necrozma/Kyurem/Calyrex/etc — custom\n  // prefix names that don't match the regional/Mega slug patterns):\n${spriteLines}\n`
);
fs.writeFileSync(spriteOverridesPath, spriteSrc);
console.log(`Added ${withArtworkId.filter((e) => e.showdown).length} entries to sprite-overrides.ts`);

// ---- Write pokeapi-id-overrides.ts additions ----
const artworkOverridesPath = path.join(__dirname, "..", "src", "lib", "pokeapi-id-overrides.ts");
let artworkSrc = fs.readFileSync(artworkOverridesPath, "utf-8");
const artworkLines = withArtworkId
  .filter((e) => e.artworkId)
  .map((e) => `  ${e.id}: ${e.artworkId}, // ${e.name}`)
  .join("\n");
artworkSrc = artworkSrc.replace(
  /(export const POKEAPI_ID_OVERRIDES: Record<number, number> = \{)/,
  `$1\n  // Mechanical-form rows added alongside the sprite-slug overrides above:\n${artworkLines}\n`
);
fs.writeFileSync(artworkOverridesPath, artworkSrc);
console.log(`Added ${withArtworkId.filter((e) => e.artworkId).length} entries to pokeapi-id-overrides.ts`);
