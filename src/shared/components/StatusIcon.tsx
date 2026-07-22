import {
  CircleAlert,
  Circle,
  CircleDashed,
  CircleDot,
  CircleMinus,
  CirclePause,
  CirclePlay,
  CirclePlus,
  CirclePower,
  CircleSlash,
  CircleStop,
  CircleUserRound,
  CircleX,
  LucideIcon,
  Star,
} from "lucide-react";

const statusIcons: Record<string, LucideIcon> = {
  "circle-x": CircleX,
  "circle-plus": CirclePlus,
  "circle-user-round": CircleUserRound,
  "circle-play": CirclePlay,
  "circle-stop": CircleStop,
  "circle-alert": CircleAlert,
  "circle-minus": CircleMinus,
  "circle-pause": CirclePause,
  "circle-power": CirclePower,
  "circle-dot": CircleDot,
  "circle-slash": CircleSlash,
  "circle-dashed": CircleDashed,
};

export function StatusIcon({ icon, color, label }: { icon: string; color?: string; label?: string }) {
  if (icon === "circle-star") return <span className="status-icon-composite" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"} style={color ? { color } : undefined}><Circle aria-hidden="true" /><Star aria-hidden="true" /></span>;
  if (icon === "circle-small") return <span className="status-icon-composite status-icon-composite--small" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"} style={color ? { color } : undefined}><Circle aria-hidden="true" /></span>;
  const Icon = statusIcons[icon] ?? CircleDot;
  return <Icon aria-hidden={label ? undefined : "true"} aria-label={label} style={color ? { color } : undefined} />;
}
