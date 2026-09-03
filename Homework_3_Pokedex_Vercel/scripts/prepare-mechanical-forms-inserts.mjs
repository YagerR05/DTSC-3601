// Builds ready-to-insert row payloads for the curated list of REAL,
// mechanically-distinct Pokemon forms missing from the `pokemon` table.
// Writes a JSON file only — does NOT touch Supabase. Run with:
//   node scripts/prepare-mechanical-forms-inserts.mjs
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

// ---- 1. Curated allowlist: only REAL, mechanically-distinct forms. ----
// PokeAPI's per-species "varieties" also include non-canonical fan-hack
// entries (verified during the read-only audit) — this list was manually
// cross-checked against the actual games, not trusted blindly from PokeAPI.
const MEGA_SPECIES = [
  "venusaur", "blastoise", "beedrill", "pidgeot", "alakazam", "slowbro", "gengar",
  "kangaskhan", "pinsir", "gyarados", "aerodactyl", "ampharos", "steelix", "scizor",
  "heracross", "houndoom", "tyranitar", "sceptile", "blaziken", "swampert", "gardevoir",
  "sableye", "mawile", "aggron", "medicham", "manectric", "sharpedo", "camerupt",
  "altaria", "banette", "absol", "glalie", "salamence", "metagross", "latias", "latios",
  "rayquaza", "lopunny", "garchomp", "lucario", "abomasnow", "gallade", "audino", "diancie",
];

const FORMS = [
  ...MEGA_SPECIES.map((s) => ({ pokeApiName: `${s}-mega`, ourName: `Mega ${cap(s)}` })),
  { pokeApiName: "charizard-mega-x", ourName: "Mega Charizard X" },
  { pokeApiName: "charizard-mega-y", ourName: "Mega Charizard Y" },
  { pokeApiName: "mewtwo-mega-x", ourName: "Mega Mewtwo X" },
  { pokeApiName: "mewtwo-mega-y", ourName: "Mega Mewtwo Y" },
  { pokeApiName: "kyogre-primal", ourName: "Primal Kyogre" },
  { pokeApiName: "groudon-primal", ourName: "Primal Groudon" },
  { pokeApiName: "rotom-heat", ourName: "Heat Rotom" },
  { pokeApiName: "rotom-wash", ourName: "Wash Rotom" },
  { pokeApiName: "rotom-frost", ourName: "Frost Rotom" },
  { pokeApiName: "rotom-fan", ourName: "Fan Rotom" },
  { pokeApiName: "rotom-mow", ourName: "Mow Rotom" },
  { pokeApiName: "castform-sunny", ourName: "Sunny Castform" },
  { pokeApiName: "castform-rainy", ourName: "Rainy Castform" },
  { pokeApiName: "castform-snowy", ourName: "Snowy Castform" },
  { pokeApiName: "kyurem-black", ourName: "Black Kyurem" },
  { pokeApiName: "kyurem-white", ourName: "White Kyurem" },
  { pokeApiName: "necrozma-dusk", ourName: "Dusk Mane Necrozma" },
  { pokeApiName: "necrozma-dawn", ourName: "Dawn Wings Necrozma" },
  { pokeApiName: "necrozma-ultra", ourName: "Ultra Necrozma" },
  { pokeApiName: "hoopa-unbound", ourName: "Unbound Hoopa" },
  { pokeApiName: "zacian-crowned", ourName: "Crowned Zacian" },
  { pokeApiName: "zamazenta-crowned", ourName: "Crowned Zamazenta" },
  { pokeApiName: "eternatus-eternamax", ourName: "Eternamax Eternatus" },
  { pokeApiName: "calyrex-ice", ourName: "Ice Rider Calyrex" },
  { pokeApiName: "calyrex-shadow", ourName: "Shadow Rider Calyrex" },
  { pokeApiName: "ursaluna-bloodmoon", ourName: "Bloodmoon Ursaluna" },
  { pokeApiName: "floette-eternal", ourName: "Eternal Flower Floette" },
  { pokeApiName: "palafin-hero", ourName: "Hero Palafin" },
  { pokeApiName: "dialga-origin", ourName: "Origin Dialga" },
  { pokeApiName: "palkia-origin", ourName: "Origin Palkia" },
  { pokeApiName: "giratina-origin", ourName: "Origin Giratina" },
  { pokeApiName: "dragonite-mega", ourName: "Mega Dragonite" },
  { pokeApiName: "greninja-mega", ourName: "Mega Greninja" },
  { pokeApiName: "ogerpon-wellspring-mask", ourName: "Wellspring Mask Ogerpon" },
  { pokeApiName: "ogerpon-hearthflame-mask", ourName: "Hearthflame Mask Ogerpon" },
  { pokeApiName: "ogerpon-cornerstone-mask", ourName: "Cornerstone Mask Ogerpon" },
  // Legends Z-A wave (PokeAPI ids 10276-10326) — verified as a real,
  // contiguous, recently-added batch (checked by scanning that id range
  // directly), not the mix of fan-hack entries assumed during the first
  // pass. Two "second Mega" forms (Absol/Garchomp/Lucario) get a
  // disambiguating "(Z-A)" suffix since a plain "Mega X" name is taken.
  { pokeApiName: "terapagos-terastal", ourName: "Terastal Terapagos" },
  { pokeApiName: "terapagos-stellar", ourName: "Stellar Terapagos" },
  { pokeApiName: "clefable-mega", ourName: "Mega Clefable" },
  { pokeApiName: "victreebel-mega", ourName: "Mega Victreebel" },
  { pokeApiName: "starmie-mega", ourName: "Mega Starmie" },
  { pokeApiName: "meganium-mega", ourName: "Mega Meganium" },
  { pokeApiName: "feraligatr-mega", ourName: "Mega Feraligatr" },
  { pokeApiName: "skarmory-mega", ourName: "Mega Skarmory" },
  { pokeApiName: "froslass-mega", ourName: "Mega Froslass" },
  { pokeApiName: "emboar-mega", ourName: "Mega Emboar" },
  { pokeApiName: "scolipede-mega", ourName: "Mega Scolipede" },
  { pokeApiName: "scrafty-mega", ourName: "Mega Scrafty" },
  { pokeApiName: "eelektross-mega", ourName: "Mega Eelektross" },
  { pokeApiName: "chandelure-mega", ourName: "Mega Chandelure" },
  { pokeApiName: "chesnaught-mega", ourName: "Mega Chesnaught" },
  { pokeApiName: "delphox-mega", ourName: "Mega Delphox" },
  { pokeApiName: "pyroar-mega", ourName: "Mega Pyroar" },
  { pokeApiName: "floette-mega", ourName: "Mega Floette" },
  { pokeApiName: "malamar-mega", ourName: "Mega Malamar" },
  { pokeApiName: "barbaracle-mega", ourName: "Mega Barbaracle" },
  { pokeApiName: "dragalge-mega", ourName: "Mega Dragalge" },
  { pokeApiName: "hawlucha-mega", ourName: "Mega Hawlucha" },
  { pokeApiName: "zygarde-mega", ourName: "Mega Zygarde" },
  { pokeApiName: "drampa-mega", ourName: "Mega Drampa" },
  { pokeApiName: "falinks-mega", ourName: "Mega Falinks" },
  { pokeApiName: "raichu-mega-x", ourName: "Mega Raichu X" },
  { pokeApiName: "raichu-mega-y", ourName: "Mega Raichu Y" },
  { pokeApiName: "chimecho-mega", ourName: "Mega Chimecho" },
  { pokeApiName: "absol-mega-z", ourName: "Mega Absol (Z-A)" },
  { pokeApiName: "staraptor-mega", ourName: "Mega Staraptor" },
  { pokeApiName: "garchomp-mega-z", ourName: "Mega Garchomp (Z-A)" },
  { pokeApiName: "lucario-mega-z", ourName: "Mega Lucario (Z-A)" },
  { pokeApiName: "heatran-mega", ourName: "Mega Heatran" },
  { pokeApiName: "darkrai-mega", ourName: "Mega Darkrai" },
  { pokeApiName: "golurk-mega", ourName: "Mega Golurk" },
  { pokeApiName: "meowstic-male-mega", ourName: "Mega Meowstic Male" },
  { pokeApiName: "meowstic-female-mega", ourName: "Mega Meowstic Female" },
  { pokeApiName: "crabominable-mega", ourName: "Mega Crabominable" },
  { pokeApiName: "golisopod-mega", ourName: "Mega Golisopod" },
  { pokeApiName: "magearna-mega", ourName: "Mega Magearna" },
  { pokeApiName: "magearna-original-mega", ourName: "Mega Magearna (Original)" },
  { pokeApiName: "zeraora-mega", ourName: "Mega Zeraora" },
  { pokeApiName: "scovillain-mega", ourName: "Mega Scovillain" },
  { pokeApiName: "glimmora-mega", ourName: "Mega Glimmora" },
  { pokeApiName: "tatsugiri-curly-mega", ourName: "Mega Tatsugiri (Curly)" },
  { pokeApiName: "tatsugiri-droopy-mega", ourName: "Mega Tatsugiri (Droopy)" },
  { pokeApiName: "tatsugiri-stretchy-mega", ourName: "Mega Tatsugiri (Stretchy)" },
  { pokeApiName: "baxcalibur-mega", ourName: "Mega Baxcalibur" },
  // Same stats/types as the default (Amped), different ability (Plus vs
  // Minus) — the stat/type-only distinctness filter missed this the first
  // time around.
  { pokeApiName: "toxtricity-low-key", ourName: "Low Key Toxtricity" },
];

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- 2. Fetch helpers ----
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

async function fetchAllOurRows() {
  const rows = [];
  let start = 0;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pokemon?select=*&order=id.asc&offset=${start}&limit=1000`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) break;
    start += 1000;
  }
  return rows;
}

// ---- 3. Build the type effectiveness chart from PokeAPI (defender's own damage_relations) ----
const ALL_TYPES = [
  "normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel",
  "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy",
];

async function buildTypeChart() {
  const chart = {}; // chart[defendingType][attackingType] = multiplier
  const data = await poolMap(ALL_TYPES, 6, (t) => fetchJson(`https://pokeapi.co/api/v2/type/${t}`));
  for (const d of data) {
    const defend = d.name;
    chart[defend] = {};
    for (const t of ALL_TYPES) chart[defend][t] = 1;
    for (const r of d.damage_relations.double_damage_from) chart[defend][r.name] = 2;
    for (const r of d.damage_relations.half_damage_from) chart[defend][r.name] = 0.5;
    for (const r of d.damage_relations.no_damage_from) chart[defend][r.name] = 0;
  }
  return chart;
}

function computeAgainst(chart, type1, type2) {
  const against = {};
  const attackKeyMap = { fighting: "fight" }; // DB column suffix quirk (against_fight, not against_fighting)
  for (const attackType of ALL_TYPES) {
    const m1 = chart[type1][attackType];
    const m2 = type2 ? chart[type2][attackType] : 1;
    const key = attackKeyMap[attackType] ?? attackType;
    against[`against_${key}`] = m1 * m2;
  }
  return against;
}

// ---- 4. Main ----
const VARIANT_PREFIXES = ["Mega", "Primal", "Alolan", "Galarian", "Hisuian", "Paldean"];
function isFormVariant(name) {
  const trimmed = name.trim();
  if (VARIANT_PREFIXES.some((p) => new RegExp(`^${p}\\s+`, "i").test(trimmed))) return true;
  if (/\(.+\)/.test(trimmed)) return true;
  return false;
}

console.log("Fetching current DB rows...");
const ourRows = await fetchAllOurRows();
const canonicalByDex = new Map();
for (const r of ourRows) {
  if (isFormVariant(r.name)) continue;
  if (!canonicalByDex.has(r.pokedex_number)) canonicalByDex.set(r.pokedex_number, r);
}
let nextId = Math.max(...ourRows.map((r) => r.id)) + 1;

console.log("Building type effectiveness chart from PokeAPI...");
const typeChart = await buildTypeChart();

console.log(`Fetching PokeAPI data for ${FORMS.length} curated forms...`);
const built = await poolMap(FORMS, 6, async (f) => {
  const pokemon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${f.pokeApiName}`);
  const speciesUrl = pokemon.species.url;
  const dexNumber = Number(speciesUrl.match(/\/pokemon-species\/(\d+)\//)[1]);
  const base = canonicalByDex.get(dexNumber);
  if (!base) return { error: `no canonical base row found for dex #${dexNumber} (${f.pokeApiName})` };

  const type1 = pokemon.types.find((t) => t.slot === 1).type.name;
  const type2raw = pokemon.types.find((t) => t.slot === 2);
  const type2 = type2raw ? type2raw.type.name : null;
  const statsByName = Object.fromEntries(pokemon.stats.map((s) => [s.stat.name, s.base_stat]));
  const hp = statsByName.hp;
  const attack = statsByName.attack;
  const defense = statsByName.defense;
  const spAttack = statsByName["special-attack"];
  const spDefense = statsByName["special-defense"];
  const speed = statsByName.speed;

  const row = {
    id: nextId++,
    name: f.ourName,
    japanese_name: base.japanese_name,
    pokedex_number: dexNumber,
    generation: base.generation,
    type1,
    type2,
    is_legendary: base.is_legendary,
    classfication: base.classfication,
    abilities: JSON.stringify(pokemon.abilities.map((a) => titleCase(a.ability.name))),
    hp,
    attack,
    defense,
    sp_attack: spAttack,
    sp_defense: spDefense,
    speed,
    base_total: hp + attack + defense + spAttack + spDefense + speed,
    height_m: pokemon.height / 10,
    weight_kg: pokemon.weight / 10,
    capture_rate: base.capture_rate,
    base_happiness: base.base_happiness,
    base_egg_steps: base.base_egg_steps,
    experience_growth: base.experience_growth,
    percentage_male: base.percentage_male,
    ...computeAgainst(typeChart, type1, type2),
  };
  return row;
});

function titleCase(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const errors = built.filter((r) => r.error);
const rows = built.filter((r) => !r.error);

console.log(`\nBuilt ${rows.length} / ${FORMS.length} rows.`);
if (errors.length) {
  console.log("Errors:");
  for (const e of errors) console.log(`  ${e.error}`);
}

// Palafin fix: current row (id known from earlier audit) needs its stats
// corrected to the real Zero-form values.
const palafinSpecies = await fetchJson("https://pokeapi.co/api/v2/pokemon-species/964");
const palafinDefaultName = palafinSpecies.varieties.find((v) => v.is_default).pokemon.name;
const palafinBase = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${palafinDefaultName}`);
const palafinStats = Object.fromEntries(palafinBase.stats.map((s) => [s.stat.name, s.base_stat]));
const ourPalafin = ourRows.find((r) => r.name === "Palafin");
const palafinFix = ourPalafin
  ? {
      id: ourPalafin.id,
      hp: palafinStats.hp,
      attack: palafinStats.attack,
      defense: palafinStats.defense,
      sp_attack: palafinStats["special-attack"],
      sp_defense: palafinStats["special-defense"],
      speed: palafinStats.speed,
      base_total: Object.values(palafinStats).reduce((a, b) => a + b, 0),
    }
  : null;

const outPath = path.join(__dirname, "mechanical-forms-inserts.json");
fs.writeFileSync(outPath, JSON.stringify({ inserts: rows, palafinFix, errors }, null, 2));
console.log(`\nWrote ${outPath}`);
console.log(`Palafin fix: ${palafinFix ? `id=${palafinFix.id}, attack ${ourPalafin.attack} -> ${palafinFix.attack}` : "NOT FOUND"}`);
