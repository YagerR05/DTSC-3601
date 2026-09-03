// One-off dev script: audits which Pokemon names resolve to a real Showdown
// animated sprite. Not part of the Next.js build. Run with:
//   node scripts/audit-sprites.mjs
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

function baseSlugify(name) {
  return name
    .toLowerCase()
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/'/g, "")
    .replace(/\./g, "")
    .replace(/:/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nameToShowdownSlug(name) {
  const trimmed = name.trim();

  const megaMatch = trimmed.match(/^Mega\s+(.+?)(\s+([XY]))?$/i);
  if (megaMatch) {
    const base = baseSlugify(megaMatch[1]);
    const suffix = megaMatch[3] ? megaMatch[3].toLowerCase() : "";
    return { slug: `${base}-mega${suffix}`, confidence: "pattern" };
  }

  const primalMatch = trimmed.match(/^Primal\s+(.+)$/i);
  if (primalMatch) {
    return { slug: `${baseSlugify(primalMatch[1])}-primal`, confidence: "pattern" };
  }

  const regionalPrefixes = { Alolan: "alola", Galarian: "galar", Hisuian: "hisui", Paldean: "paldea" };
  for (const [prefix, suffix] of Object.entries(regionalPrefixes)) {
    const re = new RegExp(`^${prefix}\\s+(.+)$`, "i");
    const match = trimmed.match(re);
    if (match) return { slug: `${baseSlugify(match[1])}-${suffix}`, confidence: "pattern" };
  }

  return { slug: baseSlugify(trimmed), confidence: "generic" };
}

async function fetchAllRows() {
  const rows = [];
  let start = 0;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=id,name&order=id.asc&offset=${start}&limit=${PAGE_SIZE}`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }
  return rows;
}

async function checkSlug(slug) {
  try {
    const res = await fetch(`https://play.pokemonshowdown.com/sprites/ani/${slug}.gif`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
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
console.log(`Auditing ${rows.length} rows...`);

const derived = rows.map((r) => ({ id: r.id, name: r.name, ...nameToShowdownSlug(r.name) }));
const statuses = await poolMap(derived, 20, async (d) => (await checkSlug(d.slug)) ? "ok" : "miss");

const misses = derived.filter((_, i) => statuses[i] === "miss");
const patternMisses = misses.filter((m) => m.confidence === "pattern");
const genericMisses = misses.filter((m) => m.confidence === "generic");

console.log(`\nOK: ${derived.length - misses.length} / ${derived.length}`);
console.log(`Misses: ${misses.length} (pattern: ${patternMisses.length}, generic: ${genericMisses.length})\n`);

const reportPath = path.join(__dirname, "sprite-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(misses, null, 2));
console.log(`Full miss list written to ${reportPath}`);
console.log("\nPattern misses (check these first — likely a slug-transform bug):");
for (const m of patternMisses) console.log(`  id=${m.id}  "${m.name}"  ->  ${m.slug}`);
