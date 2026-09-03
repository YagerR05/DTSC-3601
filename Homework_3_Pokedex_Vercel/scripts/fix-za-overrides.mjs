// Adds sprite/artwork overrides for the 48 Legends Z-A Mega/form rows.
// Checks Showdown coverage per-slug (mixed — very recent content) and
// always sets the PokeAPI artwork-id override.
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

const FORM_NAMES = {
  "Terastal Terapagos": "terapagos-terastal",
  "Stellar Terapagos": "terapagos-stellar",
  "Mega Clefable": "clefable-mega",
  "Mega Victreebel": "victreebel-mega",
  "Mega Starmie": "starmie-mega",
  "Mega Meganium": "meganium-mega",
  "Mega Feraligatr": "feraligatr-mega",
  "Mega Skarmory": "skarmory-mega",
  "Mega Froslass": "froslass-mega",
  "Mega Emboar": "emboar-mega",
  "Mega Scolipede": "scolipede-mega",
  "Mega Scrafty": "scrafty-mega",
  "Mega Eelektross": "eelektross-mega",
  "Mega Chandelure": "chandelure-mega",
  "Mega Chesnaught": "chesnaught-mega",
  "Mega Delphox": "delphox-mega",
  "Mega Pyroar": "pyroar-mega",
  "Mega Floette": "floette-mega",
  "Mega Malamar": "malamar-mega",
  "Mega Barbaracle": "barbaracle-mega",
  "Mega Dragalge": "dragalge-mega",
  "Mega Hawlucha": "hawlucha-mega",
  "Mega Zygarde": "zygarde-mega",
  "Mega Drampa": "drampa-mega",
  "Mega Falinks": "falinks-mega",
  "Mega Raichu X": "raichu-mega-x",
  "Mega Raichu Y": "raichu-mega-y",
  "Mega Chimecho": "chimecho-mega",
  "Mega Absol (Z-A)": "absol-mega-z",
  "Mega Staraptor": "staraptor-mega",
  "Mega Garchomp (Z-A)": "garchomp-mega-z",
  "Mega Lucario (Z-A)": "lucario-mega-z",
  "Mega Heatran": "heatran-mega",
  "Mega Darkrai": "darkrai-mega",
  "Mega Golurk": "golurk-mega",
  "Mega Meowstic Male": "meowstic-male-mega",
  "Mega Meowstic Female": "meowstic-female-mega",
  "Mega Crabominable": "crabominable-mega",
  "Mega Golisopod": "golisopod-mega",
  "Mega Magearna": "magearna-mega",
  "Mega Magearna (Original)": "magearna-original-mega",
  "Mega Zeraora": "zeraora-mega",
  "Mega Scovillain": "scovillain-mega",
  "Mega Glimmora": "glimmora-mega",
  "Mega Tatsugiri (Curly)": "tatsugiri-curly-mega",
  "Mega Tatsugiri (Droopy)": "tatsugiri-droopy-mega",
  "Mega Tatsugiri (Stretchy)": "tatsugiri-stretchy-mega",
  "Mega Baxcalibur": "baxcalibur-mega",
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
const entries = Object.entries(FORM_NAMES).map(([name, slug]) => ({ name, slug, id: idByName.get(name) }));
const missing = entries.filter((e) => !e.id);
if (missing.length) console.log("WARNING missing from DB:", missing.map((m) => m.name));

console.log(`Checking Showdown + fetching PokeAPI ids for ${entries.length} rows...`);
const resolved = await poolMap(entries.filter((e) => e.id), 8, async (e) => {
  const [showdownRes, pokeApiRes] = await Promise.all([
    fetch(`https://play.pokemonshowdown.com/sprites/ani/${e.slug}.gif`, { method: "HEAD" }),
    fetch(`https://pokeapi.co/api/v2/pokemon/${e.slug}`),
  ]);
  const artworkId = pokeApiRes.ok ? (await pokeApiRes.json()).id : null;
  return { ...e, hasShowdown: showdownRes.ok, artworkId };
});

const spriteOverridesPath = path.join(__dirname, "..", "src", "lib", "sprite-overrides.ts");
let spriteSrc = fs.readFileSync(spriteOverridesPath, "utf-8");
const spriteLines = resolved.filter((e) => e.hasShowdown).map((e) => `  ${e.id}: "${e.slug}", // ${e.name}`).join("\n");
spriteSrc = spriteSrc.replace(
  /(export const SPRITE_SLUG_OVERRIDES: Record<number, string> = \{)/,
  `$1\n  // Legends Z-A batch:\n${spriteLines}\n`
);
fs.writeFileSync(spriteOverridesPath, spriteSrc);
console.log(`Added ${resolved.filter((e) => e.hasShowdown).length} sprite-slug overrides (of ${resolved.length}).`);

const artworkOverridesPath = path.join(__dirname, "..", "src", "lib", "pokeapi-id-overrides.ts");
let artworkSrc = fs.readFileSync(artworkOverridesPath, "utf-8");
const artworkLines = resolved.filter((e) => e.artworkId).map((e) => `  ${e.id}: ${e.artworkId}, // ${e.name}`).join("\n");
artworkSrc = artworkSrc.replace(
  /(export const POKEAPI_ID_OVERRIDES: Record<number, number> = \{)/,
  `$1\n  // Legends Z-A batch:\n${artworkLines}\n`
);
fs.writeFileSync(artworkOverridesPath, artworkSrc);
console.log(`Added ${resolved.filter((e) => e.artworkId).length} artwork-id overrides.`);
