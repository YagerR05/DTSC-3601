// Audits every row's `abilities` column against PokeAPI ground truth.
// Uses the same id -> PokeAPI-numeric-id resolution as the sprite/artwork
// overrides (parsed straight from pokeapi-id-overrides.ts) so form rows
// are checked against their OWN abilities, not the base species'.
// Writes a report; fixes are applied separately after review.
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

function parseIdOverrides(filePath) {
  const src = fs.readFileSync(filePath, "utf-8");
  const map = new Map();
  for (const m of src.matchAll(/"?(\d+)"?:\s*(\d+),/g)) map.set(Number(m[1]), Number(m[2]));
  return map;
}
const pokeApiIdOverrides = parseIdOverrides(path.join(__dirname, "..", "src", "lib", "pokeapi-id-overrides.ts"));

function parseAbilities(raw) {
  const match = raw.match(/'([^']*)'|"([^"]*)"/g);
  if (!match) return [];
  return [...new Set(match.map((s) => s.slice(1, -1)))];
}

async function fetchAllRows() {
  const rows = [];
  let start = 0;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=id,name,pokedex_number,abilities&order=id.asc&offset=${start}&limit=1000`,
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

function titleCase(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const rows = await fetchAllRows();
console.log(`Auditing abilities for ${rows.length} rows against PokeAPI...`);

const results = await poolMap(rows, 12, async (row) => {
  const pokeApiId = pokeApiIdOverrides.get(row.id) ?? row.pokedex_number;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeApiId}`);
  if (!res.ok) return { ...row, error: `${res.status}` };
  const data = await res.json();
  const correct = data.abilities.map((a) => titleCase(a.ability.name));
  const ours = parseAbilities(row.abilities);
  const oursSorted = [...ours].sort();
  const correctSorted = [...correct].sort();
  const matches = JSON.stringify(oursSorted) === JSON.stringify(correctSorted);
  return { id: row.id, name: row.name, ours, correct, matches };
});

const errors = results.filter((r) => r.error);
const mismatches = results.filter((r) => !r.error && !r.matches);
const ok = results.filter((r) => !r.error && r.matches);

console.log(`\nOK: ${ok.length}, mismatched: ${mismatches.length}, errors: ${errors.length}`);

const outPath = path.join(__dirname, "abilities-audit-report.json");
fs.writeFileSync(outPath, JSON.stringify({ mismatches, errors }, null, 2));
console.log(`Wrote ${outPath}`);

console.log("\nFirst 30 mismatches:");
for (const m of mismatches.slice(0, 30)) {
  console.log(`  id=${m.id} "${m.name}": ours=[${m.ours.join(", ")}] correct=[${m.correct.join(", ")}]`);
}
