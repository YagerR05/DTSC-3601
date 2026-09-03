import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAT_COLS, STAT_LABELS, type Pokemon } from "@/lib/types";

export function PokemonTable({ pokemons }: { pokemons: Pokemon[] }) {
  const sorted = [...pokemons].sort((a, b) => a.pokedexNumber - b.pokedexNumber);

  return (
    <div className="max-h-[560px] overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gen</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Legendary</TableHead>
            {STAT_COLS.map((stat) => (
              <TableHead key={stat}>{STAT_LABELS[stat]}</TableHead>
            ))}
            <TableHead>Total</TableHead>
            <TableHead>Height (m)</TableHead>
            <TableHead>Weight (kg)</TableHead>
            <TableHead>Classification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.pokedexNumber}</TableCell>
              <TableCell className="font-medium">
                <Link href={`/pokemon/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>{p.generation}</TableCell>
              <TableCell className="capitalize">
                {p.type1}
                {p.type2 ? ` / ${p.type2}` : ""}
              </TableCell>
              <TableCell>{p.isLegendary ? "Yes" : "No"}</TableCell>
              {STAT_COLS.map((stat) => (
                <TableCell key={stat}>{p[stat]}</TableCell>
              ))}
              <TableCell>{p.baseTotal}</TableCell>
              <TableCell>{p.heightM}</TableCell>
              <TableCell>{p.weightKg}</TableCell>
              <TableCell>{p.classification}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
