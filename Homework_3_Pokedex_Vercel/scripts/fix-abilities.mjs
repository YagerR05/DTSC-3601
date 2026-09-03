// Applies the abilities-audit-report.json fixes: replaces each mismatched
// row's abilities with PokeAPI's correct list. Requires the SECRET key.
// Run with:
//   node scripts/fix-abilities.mjs
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

const report = JSON.parse(
  fs.readFileSync(path.join(__dirname, "abilities-audit-report.json"), "utf-8")
);

const headers = {
  apikey: SECRET_KEY,
  Authorization: `Bearer ${SECRET_KEY}`,
  "Content-Type": "application/json",
};

console.log(`Fixing ${report.mismatches.length} rows...`);
let done = 0;
for (const m of report.mismatches) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pokemon?id=eq.${m.id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ abilities: JSON.stringify(m.correct) }),
  });
  if (!res.ok) {
    console.error(`  FAILED id=${m.id} "${m.name}": ${res.status} ${await res.text()}`);
  } else {
    done++;
  }
}
console.log(`Fixed ${done} / ${report.mismatches.length} rows.`);
