// Adds sprite/artwork overrides for the 8 newest form rows (Origin trio,
// Mega Dragonite/Greninja, Ogerpon's 3 masks). Dialga/Palkia Origin and the
// Ogerpon masks have no Showdown animated sprite yet (checked directly),
// so they only get a PokeAPI-artwork-id override — the runtime fallback
// chain in pokemon-sprite.tsx already handles that gracefully.
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

const FORM_SLUGS = {
  "Origin Dialga": { pokeApiName: "dialga-origin" },
  "Origin Palkia": { pokeApiName: "palkia-origin" },
  "Origin Giratina": { showdown: "giratina-origin", pokeApiName: "giratina-origin" },
  "Mega Dragonite": { showdown: "dragonite-mega", pokeApiName: "dragonite-mega" },
  "Mega Greninja": { showdown: "greninja-mega", pokeApiName: "greninja-mega" },
  "Wellspring Mask Ogerpon": { pokeApiName: "ogerpon-wellspring-mask" },
  "Hearthflame Mask Ogerpon": { pokeApiName: "ogerpon-hearthflame-mask" },
  "Cornerstone Mask Ogerpon": { pokeApiName: "ogerpon-cornerstone-mask" },
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
if (missing.length) console.log("WARNING missing from DB:", missing.map((m) => m.name));

const withArtworkId = await poolMap(entries.filter((e) => e.id), 6, async (e) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${e.pokeApiName}`);
  if (!res.ok) return { ...e, artworkId: null, error: `${res.status}` };
  const data = await res.json();
  return { ...e, artworkId: data.id };
});
const errors = withArtworkId.filter((e) => e.error);
if (errors.length) console.log("errors:", errors);

const spriteOverridesPath = path.join(__dirname, "..", "src", "lib", "sprite-overrides.ts");
let spriteSrc = fs.readFileSync(spriteOverridesPath, "utf-8");
const spriteLines = withArtworkId.filter((e) => e.showdown).map((e) => `  ${e.id}: "${e.showdown}", // ${e.name}`).join("\n");
spriteSrc = spriteSrc.replace(
  /(export const SPRITE_SLUG_OVERRIDES: Record<number, string> = \{)/,
  `$1\n  // Origin/Mega batch 2:\n${spriteLines}\n`
);
fs.writeFileSync(spriteOverridesPath, spriteSrc);
console.log(`Added ${withArtworkId.filter((e) => e.showdown).length} sprite-slug overrides.`);

const artworkOverridesPath = path.join(__dirname, "..", "src", "lib", "pokeapi-id-overrides.ts");
let artworkSrc = fs.readFileSync(artworkOverridesPath, "utf-8");
const artworkLines = withArtworkId.filter((e) => e.artworkId).map((e) => `  ${e.id}: ${e.artworkId}, // ${e.name}`).join("\n");
artworkSrc = artworkSrc.replace(
  /(export const POKEAPI_ID_OVERRIDES: Record<number, number> = \{)/,
  `$1\n  // Origin/Mega batch 2:\n${artworkLines}\n`
);
fs.writeFileSync(artworkOverridesPath, artworkSrc);
console.log(`Added ${withArtworkId.filter((e) => e.artworkId).length} artwork-id overrides.`);
