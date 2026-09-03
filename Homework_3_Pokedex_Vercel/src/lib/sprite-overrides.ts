/**
 * Manual `id -> Showdown slug` overrides for rows where
 * nameToShowdownSlug() doesn't resolve to a real asset. Populated by
 * `scripts/audit-sprites.mjs` — see its output report.
 */
export const SPRITE_SLUG_OVERRIDES: Record<number, string> = {
  1211: "toxtricity-lowkey", // Low Key Toxtricity
  // Legends Z-A batch:
  1165: "clefable-mega", // Mega Clefable
  1166: "victreebel-mega", // Mega Victreebel
  1167: "starmie-mega", // Mega Starmie
  1168: "meganium-mega", // Mega Meganium
  1169: "feraligatr-mega", // Mega Feraligatr
  1170: "skarmory-mega", // Mega Skarmory
  1171: "froslass-mega", // Mega Froslass
  1172: "emboar-mega", // Mega Emboar
  1173: "scolipede-mega", // Mega Scolipede
  1174: "scrafty-mega", // Mega Scrafty
  1175: "eelektross-mega", // Mega Eelektross
  1176: "chandelure-mega", // Mega Chandelure
  1177: "chesnaught-mega", // Mega Chesnaught
  1178: "delphox-mega", // Mega Delphox
  1179: "pyroar-mega", // Mega Pyroar
  1180: "floette-mega", // Mega Floette
  1181: "malamar-mega", // Mega Malamar
  1182: "barbaracle-mega", // Mega Barbaracle
  1183: "dragalge-mega", // Mega Dragalge
  1184: "hawlucha-mega", // Mega Hawlucha
  1186: "drampa-mega", // Mega Drampa
  1187: "falinks-mega", // Mega Falinks
  1190: "chimecho-mega", // Mega Chimecho
  1192: "staraptor-mega", // Mega Staraptor
  1197: "golurk-mega", // Mega Golurk
  1200: "crabominable-mega", // Mega Crabominable
  1205: "scovillain-mega", // Mega Scovillain
  1206: "glimmora-mega", // Mega Glimmora

  // Origin/Mega batch 2:
  1157: "giratina-origin", // Origin Giratina
  1158: "dragonite-mega", // Mega Dragonite
  1159: "greninja-mega", // Mega Greninja

  // Mechanical-form rows (Rotom/Necrozma/Kyurem/Calyrex/etc — custom
  // prefix names that don't match the regional/Mega slug patterns):
  1116: "rotom-heat", // Heat Rotom
  1117: "rotom-wash", // Wash Rotom
  1118: "rotom-frost", // Frost Rotom
  1119: "rotom-fan", // Fan Rotom
  1120: "rotom-mow", // Mow Rotom
  1121: "castform-sunny", // Sunny Castform
  1122: "castform-rainy", // Rainy Castform
  1123: "castform-snowy", // Snowy Castform
  1124: "kyurem-black", // Black Kyurem
  1125: "kyurem-white", // White Kyurem
  1126: "necrozma-duskmane", // Dusk Mane Necrozma
  1127: "necrozma-dawnwings", // Dawn Wings Necrozma
  1128: "necrozma-ultra", // Ultra Necrozma
  1129: "hoopa-unbound", // Unbound Hoopa
  1130: "zacian-crowned", // Crowned Zacian
  1131: "zamazenta-crowned", // Crowned Zamazenta
  1132: "eternatus-eternamax", // Eternamax Eternatus
  1133: "calyrex-ice", // Ice Rider Calyrex
  1134: "calyrex-shadow", // Shadow Rider Calyrex
  1135: "ursaluna-bloodmoon", // Bloodmoon Ursaluna
  1136: "floette-eternal", // Eternal Flower Floette
  1137: "palafin-hero", // Hero Palafin

  37: "nidoranm", // Nidoran (M)
  151: "mrmime-galar", // Galarian Mr. Mime
  152: "mrmime", // Mr. Mime
  292: "hooh", // Ho-Oh
  483: "mimejr", // Mime Jr.
  722: "flabebe", // Flabébé
  829: "typenull", // Type: Null
  839: "jangmoo", // Jangmo-o
  840: "hakamoo", // Hakamo-o
  841: "kommoo", // Kommo-o
  842: "tapukoko", // Tapu Koko
  843: "tapulele", // Tapu Lele
  844: "tapubulu", // Tapu Bulu
  845: "tapufini", // Tapu Fini
  1058: "wochien", // Wo-Chien
  1059: "chienpao", // Chien-Pao
  1060: "tinglu", // Ting-Lu
  1061: "chiyu", // Chi-Yu
  // No Showdown animated sprite exists yet for these (confirmed by audit) —
  // the runtime fallback chain (PokemonSprite) drops to PokeAPI static
  // artwork for them: Paldean Tauros breeds (158-160), the Gen 9 Paradox
  // Pokemon (1041-1052, 1062-1063), and Miraidon (1065).
};
