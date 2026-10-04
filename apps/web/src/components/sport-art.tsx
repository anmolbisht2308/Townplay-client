import type { Sport } from "@townplay/shared";
import { cn } from "@/lib/utils";

/** Emoji + gradient per sport: a lightweight, colourful stand-in when a listing has no photo. */
const ART: Record<string, { emoji: string; from: string; to: string }> = {
  football: { emoji: "⚽", from: "oklch(0.62 0.17 150)", to: "oklch(0.42 0.12 160)" },
  box_cricket: { emoji: "🏏", from: "oklch(0.7 0.16 70)", to: "oklch(0.52 0.15 45)" },
  cricket_nets: { emoji: "🏏", from: "oklch(0.66 0.15 95)", to: "oklch(0.48 0.13 120)" },
  badminton: { emoji: "🏸", from: "oklch(0.62 0.16 250)", to: "oklch(0.45 0.16 275)" },
  pickleball: { emoji: "🏓", from: "oklch(0.78 0.17 125)", to: "oklch(0.55 0.16 140)" },
  tennis: { emoji: "🎾", from: "oklch(0.8 0.18 115)", to: "oklch(0.58 0.15 135)" },
  table_tennis: { emoji: "🏓", from: "oklch(0.63 0.2 25)", to: "oklch(0.47 0.17 15)" },
  basketball: { emoji: "🏀", from: "oklch(0.7 0.17 50)", to: "oklch(0.52 0.17 35)" },
  volleyball: { emoji: "🏐", from: "oklch(0.72 0.13 230)", to: "oklch(0.52 0.15 250)" },
  swimming: { emoji: "🏊", from: "oklch(0.72 0.12 215)", to: "oklch(0.5 0.13 235)" },
  snooker: { emoji: "🎱", from: "oklch(0.5 0.12 160)", to: "oklch(0.32 0.08 170)" },
  skating: { emoji: "⛸️", from: "oklch(0.7 0.13 300)", to: "oklch(0.5 0.15 290)" },
  event: { emoji: "🎉", from: "oklch(0.66 0.2 340)", to: "oklch(0.5 0.2 300)" },
  club: { emoji: "🏃", from: "oklch(0.7 0.16 60)", to: "oklch(0.55 0.18 30)" },
};

export function SportArt({
  sport,
  className,
  size = "md",
}: {
  sport: Sport | "event" | "club" | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const art = ART[sport ?? "football"] ?? ART.football!;
  return (
    <div
      aria-hidden="true"
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }}
    >
      <span className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />
      <span className="absolute -top-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
      <span
        className={cn(
          "relative drop-shadow-md",
          size === "sm" ? "text-2xl" : size === "lg" ? "text-7xl" : "text-5xl",
        )}
      >
        {art.emoji}
      </span>
    </div>
  );
}
