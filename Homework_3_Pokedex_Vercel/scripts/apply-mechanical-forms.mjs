// Applies the previously-built + reviewed mechanical-forms payload to the
// live Supabase `pokemon` table: inserts the new form rows and fixes
// Palafin's stats. Requires the SECRET key (read from the sibling
// pokemon-streamlit project's .env, never copied into this project).
// Run with:
//   node scripts/apply-mechanical-forms.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const streamlitEnvPath = path.join(__dirname, "..", "..", "Homework_2_Pokedex_Cloud_Deploy", ".env");
const streamlitEnv = Object.fromEntries(
  fs
    .readFileSync(streamlitEnvPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);
const SUPABASE_URL = streamlitEnv.SUPABASE_URL;
const SECRET_KEY = streamlitEnv.SUPABASE_SECRET_KEY;

const payload = JSON.parse(
  fs.readFileSync(path.join(__dirname, "mechanical-forms-inserts.json"), "utf-8")
);

const headers = {
  apikey: SECRET_KEY,
  Authorization: `Bearer ${SECRET_KEY}`,
  "Content-Type": "application/json",
};

console.log(`Inserting ${payload.inserts.length} new form rows...`);
// `id` is a GENERATED ALWAYS identity column — let Postgres assign it.
const insertRows = payload.inserts.map(({ id, ...rest }) => rest);
const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pokemon`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=minimal" },
  body: JSON.stringify(insertRows),
});
if (!insertRes.ok) {
  console.error(`Insert failed: ${insertRes.status} ${insertRes.statusText}`);
  console.error(await insertRes.text());
  process.exit(1);
}
console.log("Insert OK.");

if (payload.palafinFix) {
  console.log(`\nFixing Palafin (id=${payload.palafinFix.id})...`);
  const { id, ...fixFields } = payload.palafinFix;
  const fixRes = await fetch(`${SUPABASE_URL}/rest/v1/pokemon?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(fixFields),
  });
  if (!fixRes.ok) {
    console.error(`Palafin fix failed: ${fixRes.status} ${fixRes.statusText}`);
    console.error(await fixRes.text());
    process.exit(1);
  }
  const fixed = await fixRes.json();
  console.log("Palafin fix OK:", JSON.stringify(fixed[0]));
} else {
  console.log("\nNo Palafin fix in this batch, skipping.");
}

console.log("\nVerifying total row count...");
const countRes = await fetch(`${SUPABASE_URL}/rest/v1/pokemon?select=id&limit=1`, {
  headers: { ...headers, Prefer: "count=exact" },
});
console.log("Content-Range:", countRes.headers.get("content-range"));
