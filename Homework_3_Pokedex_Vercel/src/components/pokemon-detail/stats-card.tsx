import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statBarColor, STAT_BAR_SCALE_MAX } from "@/lib/stat-colors";
import { STAT_COLS, STAT_LABELS, type Pokemon } from "@/lib/types";

export function StatsCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Base stats</span>
          <span className="text-base font-normal text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{pokemon.baseTotal}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STAT_COLS.map((stat) => {
          const value = pokemon[stat];
          const color = statBarColor(value);
          return (
            <div key={stat} className="flex items-center gap-3 text-base">
              <span className="w-28 shrink-0 font-semibold text-foreground">{STAT_LABELS[stat]}</span>
              <span className="w-10 shrink-0 text-right text-lg font-semibold" style={{ color }}>
                {value}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${Math.min(100, (value / STAT_BAR_SCALE_MAX) * 100)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
