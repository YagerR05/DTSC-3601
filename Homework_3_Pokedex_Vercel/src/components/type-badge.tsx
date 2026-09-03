import { Badge } from "@/components/ui/badge";
import { TYPE_COLORS } from "@/lib/chart-theme";
import { cn } from "@/lib/utils";

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const color = TYPE_COLORS[type] ?? "#888888";
  return (
    <Badge
      className={cn("border-0 text-white capitalize", className)}
      style={{ backgroundColor: color }}
    >
      {type}
    </Badge>
  );
}
