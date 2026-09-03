// Read-only audit: compares the current `pokemon` table against PokeAPI's
// per-species "varieties" list to find mechanically-distinct forms (real
// stat or type differences) that are missing or wrong in our data.
// Writes NOTHING to Supabase. Run with:
//   node scripts/audit-mechanical-forms.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
const PAGE_SIZE = 1000;
const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

async function fetchAllRows() {
  const rows = [];
  let start = 0;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=id,pokedex_number,name,hp,attack,defense,sp_attack,sp_defense,speed,base_total,type1,type2&order=id.asc&offset=${start}&limit=${PAGE_SIZE}`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }
  return rows;
}

async function poolMap(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = { error: String(e) };
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function statTotal(pokeApiPokemon) {
  return pokeApiPokemon.stats.reduce((s, st) => s + st.base_stat, 0);
}

function typesOf(pokeApiPokemon) {
  return pokeApiPokemon.types.map((t) => t.type.name).sort();
}

const rows = await fetchAllRows();
const rowsByDex = new Map();
for (const r of rows) {
  if (!rowsByDex.has(r.pokedex_number)) rowsByDex.set(r.pokedex_number, []);
  rowsByDex.get(r.pokedex_number).push(r);
}
const dexNumbers = [...rowsByDex.keys()].sort((a, b) => a - b);
console.log(`Auditing ${dexNumbers.length} species against PokeAPI...`);

const speciesResults = await poolMap(dexNumbers, 10, async (dexNum) => {
  const species = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species/${dexNum}`);
  if (!species) return { dexNum, error: "species not found" };
  return { dexNum, varieties: species.varieties };
});

// Only species with more than one variety are candidates for missing/wrong forms.
const candidates = speciesResults.filter((s) => s.varieties && s.varieties.length > 1);
console.log(`${candidates.length} species have multiple PokeAPI varieties. Checking each...`);

const varietyChecks = [];
for (const c of candidates) {
  for (const v of c.varieties) {
    varietyChecks.push({ dexNum: c.dexNum, name: v.pokemon.name, isDefault: v.is_default, url: v.pokemon.url });
  }
}

const varietyDetails = await poolMap(varietyChecks, 10, async (v) => {
  const data = await fetchJson(v.url);
  if (!data) return { ...v, error: "variant fetch failed" };
  return { ...v, baseTotal: statTotal(data), types: typesOf(data), stats: Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat])) };
});

// Group variety details back by dex number, compare each non-default variety
// to the default one; flag as MECHANICAL if stats or types differ, COSMETIC otherwise.
const byDex = new Map();
for (const v of varietyDetails) {
  if (!byDex.has(v.dexNum)) byDex.set(v.dexNum, []);
  byDex.get(v.dexNum).push(v);
}

const report = [];
for (const [dexNum, variants] of byDex) {
  const defaultVariant = variants.find((v) => v.isDefault);
  if (!defaultVariant || defaultVariant.error) continue;
  const ourRows = rowsByDex.get(dexNum) ?? [];

  for (const v of variants) {
    if (v.isDefault || v.error) continue;
    const mechanicallyDistinct =
      v.baseTotal !== defaultVariant.baseTotal || v.types.join(",") !== defaultVariant.types.join(",");
    if (!mechanicallyDistinct) continue; // cosmetic-only, out of scope

    // crude name-fragment match against existing rows to see if we already have this form
    const nameFragment = v.name.replace(defaultVariant.name + "-", "").split("-")[0];
    const alreadyHave = ourRows.some((r) => r.name.toLowerCase().includes(nameFragment));

    report.push({
      dexNum,
      species: defaultVariant.name,
      variant: v.name,
      status: alreadyHave ? "present (name match, verify manually)" : "MISSING",
      pokeapi: { baseTotal: v.baseTotal, types: v.types, stats: v.stats },
    });
  }

  // Flag our default-form row's stats disagreeing with PokeAPI's default variant
  // (catches cases like Palafin where the "base" row actually holds another form's stats).
  const ourCanonical = ourRows.find((r) => !ourRows.some((o) => o !== r && r.name.length > o.name.length && r.name.includes(o.name)));
  if (ourCanonical) {
    const ourStats = {
      hp: ourCanonical.hp,
      attack: ourCanonical.attack,
      defense: ourCanonical.defense,
      "special-attack": ourCanonical.sp_attack,
      "special-defense": ourCanonical.sp_defense,
      speed: ourCanonical.speed,
    };
    const mismatch = STAT_KEYS.some((k) => ourStats[k] !== defaultVariant.stats?.[k]);
    if (mismatch) {
      report.push({
        dexNum,
        species: defaultVariant.name,
        variant: `OUR ROW "${ourCanonical.name}" (id=${ourCanonical.id})`,
        status: "STAT_MISMATCH_WITH_POKEAPI_DEFAULT",
        ourStats,
        pokeapiDefaultStats: defaultVariant.stats,
      });
    }
  }
}

const outPath = path.join(__dirname, "mechanical-forms-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

const missing = report.filter((r) => r.status === "MISSING");
const mismatches = report.filter((r) => r.status === "STAT_MISMATCH_WITH_POKEAPI_DEFAULT");
const present = report.filter((r) => r.status.startsWith("present"));

console.log(`\n=== Summary ===`);
console.log(`Missing mechanical forms: ${missing.length}`);
console.log(`Rows with stats mismatched vs PokeAPI default: ${mismatches.length}`);
console.log(`Already present (name-matched, spot-check recommended): ${present.length}`);
console.log(`\nFull report: ${outPath}`);

console.log(`\n--- Missing forms (by species) ---`);
for (const m of missing) console.log(`  #${m.dexNum} ${m.species} -> missing "${m.variant}" (BST ${m.pokeapi.baseTotal}, ${m.pokeapi.types.join("/")})`);

console.log(`\n--- Stat mismatches ---`);
for (const m of mismatches) console.log(`  #${m.dexNum} ${m.variant}: ours=${JSON.stringify(m.ourStats)} pokeapi=${JSON.stringify(m.pokeapiDefaultStats)}`);
