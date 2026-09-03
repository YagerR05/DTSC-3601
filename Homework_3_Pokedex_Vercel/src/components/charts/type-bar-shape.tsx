import { TYPE_COLORS } from "@/lib/chart-theme";
import { typeIconUrl } from "@/lib/type-icons";

type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { type: string };
};

const TILE = 26;
const ICON = 18;

/** A Recharts Bar `shape` renderer: a color gradient fill with the type's
 * circular Pokemon GO-style icon tiled faintly across the whole bar. */
export function TypeBarShape({ x = 0, y = 0, width = 0, height = 0, payload }: BarShapeProps) {
  const type = payload?.type ?? "";
  const color = TYPE_COLORS[type] ?? "#888888";
  const gradientId = `type-bar-gradient-${type}`;
  const patternId = `type-bar-pattern-${type}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2={width > height ? "1" : "0"} y2={width > height ? "0" : "1"}>
          <stop offset="0%" stopColor={color} stopOpacity={0.75} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width={TILE} height={TILE} patternTransform="rotate(15)">
          <image href={typeIconUrl(type)} x={(TILE - ICON) / 2} y={(TILE - ICON) / 2} width={ICON} height={ICON} opacity={0.55} />
        </pattern>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={`url(#${gradientId})`} rx={2} />
      <rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} rx={2} />
    </g>
  );
}
