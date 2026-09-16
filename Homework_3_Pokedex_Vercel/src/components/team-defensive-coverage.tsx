import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeBadge } from "@/components/type-badge";
import { ATTACK_TYPES, type Pokemon } from "@/lib/types";
import { attackTypeToDisplayType } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

// Cell shading for a single team member's against-value for one attacking
// type - red family for weaknesses, green family for resistances, matching
// the resist/weak framing used by tools like Marriland's team builder.
function cellClass(multiplier: number): string {
  if (multiplier >= 4) return "bg-red-600/90 text-white";
  if (multiplier >= 2) return "bg-red-400/70 text-white";
  if (multiplier === 0) return "bg-blue-500/70 text-white";
  if (multiplier <= 0.25) return "bg-green-600/80 text-white";
  if (multiplier <= 0.5) return "bg-green-400/60 text-white";
  return "bg-muted text-muted-foreground";
}

function multiplierLabel(multiplier: number): string {
  if (multiplier === 0) return "0";
  if (multiplier === 0.25) return "¼";
  if (multiplier === 0.5) return "½";
  return `${multiplier}`;
}

export function TeamDefensiveCoverage({ team }: { team: Pokemon[] }) {
  const gapTypes = ATTACK_TYPES.filter((t) => team.every((p) => p.against[t] > 0.5));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defensive Coverage</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your team is full (6/6). Each row is an attacking type; each cell shows how much damage
          that team member takes from it. Rows with no green or blue cell are types nobody on your
          team resists.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="p-1 text-left font-medium text-muted-foreground">Type</th>
                {team.map((p) => (
                  <th key={p.id} className="p-1 text-center font-medium text-muted-foreground">
                    <span className="block max-w-20 truncate">{p.name}</span>
                  </th>
                ))}
                <th className="p-1 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {ATTACK_TYPES.map((t) => {
                const isGap = gapTypes.includes(t);
                return (
                  <tr key={t}>
                    <td className="p-1">
                      <TypeBadge type={attackTypeToDisplayType(t)} />
                    </td>
                    {team.map((p) => (
                      <td key={p.id} className="p-0 text-center">
                        <div className={cn("mx-auto flex size-8 items-center justify-center rounded-md text-xs font-semibold", cellClass(p.against[t]))}>
                          {multiplierLabel(p.against[t])}
                        </div>
                      </td>
                    ))}
                    <td className="p-1 text-center">
                      {isGap ? (
                        <span className="text-xs font-semibold text-red-500">No answer</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Covered</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {gapTypes.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No team member resists:{" "}
            {gapTypes.map((t, i) => (
              <span key={t}>
                <span className="font-medium text-foreground capitalize">{attackTypeToDisplayType(t)}</span>
                {i < gapTypes.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
