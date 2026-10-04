import { formatPaise, type GameCard as Card } from "@townplay/shared";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ClockIcon, PinIcon } from "@/components/icons";
import { SportArt } from "@/components/sport-art";
import { longDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export async function GameCard({ game, className }: { game: Card; className?: string }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const filled = Math.max(0, game.totalSpots - game.spotsLeft);
  const pct = game.totalSpots > 0 ? Math.round((filled / game.totalSpots) * 100) : 100;
  return (
    <Link
      href={`/games/${game.id}`}
      className={cn("lift flex gap-4 rounded-2xl border bg-card p-3 shadow-card", className)}
    >
      <SportArt sport={game.sport} size="sm" className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate leading-tight font-bold">
            {t(`sports.${game.sport}`)} · {t(`games.skill.${game.skillLevel}`)}
          </h3>
          <span className="shrink-0 rounded-full bg-energy px-2 py-0.5 text-xs font-bold text-energy-foreground">
            {game.pricePerHeadPaise > 0 ? formatPaise(game.pricePerHeadPaise) : t("games.free")}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <ClockIcon size={14} className="shrink-0" />
          {longDate(game.date, locale)} · {game.startTime}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <PinIcon size={14} className="shrink-0" />
          {game.venueName}, {game.area}
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={cn(
              "shrink-0 text-xs font-semibold",
              game.spotsLeft > 0 ? "text-primary-strong" : "text-muted-foreground",
            )}
          >
            {game.spotsLeft > 0 ? t("games.spotsLeft", { count: game.spotsLeft }) : t("games.full")}
          </span>
        </div>
      </div>
    </Link>
  );
}
