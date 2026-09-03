// Adds the 17 species missing from national dex 1009-1025 (Scarlet/Violet
// DLC: Kitakami + Blueberry Academy). Builds full rows from PokeAPI (no
// existing base row to copy invariant fields from, unlike the mechanical
// forms batch) and writes them straight to Supabase. Run with:
//   node scripts/add-new-species.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const streamlitEnvPath = path.join(__dirname, "..", "..", "Homework_2_Pokedex_Cloud_Deploy", ".env");
const streamlitEnv = Object.fromEntries(
  fs.readFileSync(streamlitEnvPath, "utf-8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const idx = l.indexOf("=");
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);
const SUPABASE_URL = streamlitEnv.SUPABASE_URL;
const SECRET_KEY = streamlitEnv.SUPABASE_SECRET_KEY;

const DEX_NUMBERS = Array.from({ length: 17 }, (_, i) => 1009 + i);

const ALL_TYPES = [
  "normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel",
  "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy",
];
const GROWTH_XP = {
  slow: 1250000,
  "medium-slow": 1059860,
  medium: 1000000,
  fast: 800000,
  erratic: 600000,
  fluctuating: 1640000,
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
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
function titleCase(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

async function buildTypeChart() {
  const chart = {};
  const data = await poolMap(ALL_TYPES, 6, (t) => fetchJson(`https://pokeapi.co/api/v2/type/${t}`));
  for (const d of data) {
    chart[d.name] = {};
    for (const t of ALL_TYPES) chart[d.name][t] = 1;
    for (const r of d.damage_relations.double_damage_from) chart[d.name][r.name] = 2;
    for (const r of d.damage_relations.half_damage_from) chart[d.name][r.name] = 0.5;
    for (const r of d.damage_relations.no_damage_from) chart[d.name][r.name] = 0;
  }
  return chart;
}
function computeAgainst(chart, type1, type2) {
  const against = {};
  const attackKeyMap = { fighting: "fight" };
  for (const t of ALL_TYPES) {
    const m1 = chart[type1][t];
    const m2 = type2 ? chart[type2][t] : 1;
    against[`against_${attackKeyMap[t] ?? t}`] = m1 * m2;
  }
  return against;
}

console.log("Building type chart...");
const typeChart = await buildTypeChart();

console.log(`Fetching ${DEX_NUMBERS.length} new species...`);
const rows = await poolMap(DEX_NUMBERS, 6, async (dex) => {
  const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${dex}`);
  const defaultVariety = species.varieties.find((v) => v.is_default);
  const pokemon = await fetchJson(defaultVariety.pokemon.url);

  const type1 = pokemon.types.find((t) => t.slot === 1).type.name;
  const type2v = pokemon.types.find((t) => t.slot === 2);
  const type2 = type2v ? type2v.type.name : null;
  const statsByName = Object.fromEntries(pokemon.stats.map((s) => [s.stat.name, s.base_stat]));
  const hp = statsByName.hp, attack = statsByName.attack, defense = statsByName.defense;
  const spAttack = statsByName["special-attack"], spDefense = statsByName["special-defense"], speed = statsByName.speed;

  const enName = species.names.find((n) => n.language.name === "en")?.name ?? titleCase(species.name);
  const jaName = species.names.find((n) => n.language.name === "ja-Hrkt")?.name ?? "";
  const genus = species.genera.find((g) => g.language.name === "en")?.genus ?? "";

  return {
    name: enName,
    japanese_name: jaName,
    pokedex_number: dex,
    generation: 9,
    type1,
    type2,
    is_legendary: species.is_legendary || species.is_mythical,
    classfication: genus,
    abilities: JSON.stringify(pokemon.abilities.map((a) => titleCase(a.ability.name))),
    hp, attack, defense, sp_attack: spAttack, sp_defense: spDefense, speed,
    base_total: hp + attack + defense + spAttack + spDefense + speed,
    height_m: pokemon.height / 10,
    weight_kg: pokemon.weight / 10,
    capture_rate: species.capture_rate,
    base_happiness: species.base_happiness ?? 0,
    base_egg_steps: species.hatch_counter != null ? species.hatch_counter * 256 : 5120,
    experience_growth: GROWTH_XP[species.growth_rate.name] ?? 1000000,
    percentage_male: species.gender_rate === -1 ? null : Math.round(((8 - species.gender_rate) / 8) * 1000) / 10,
    ...computeAgainst(typeChart, type1, type2),
  };
});

const outPath = path.join(__dirname, "new-species-inserts.json");
fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
console.log(`Built ${rows.length} rows. Wrote ${outPath}`);
console.log(rows.map((r) => `#${r.pokedex_number} ${r.name} (${r.type1}${r.type2 ? "/" + r.type2 : ""}) BST ${r.base_total}`).join("\n"));

const headers = { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, "Content-Type": "application/json" };
console.log("\nInserting into Supabase...");
const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pokemon`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify(rows),
});
if (!insertRes.ok) {
  console.error(`Insert failed: ${insertRes.status}`, await insertRes.text());
  process.exit(1);
}
console.log("Insert OK.");
