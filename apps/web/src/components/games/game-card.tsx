import { formatPaise, type GameCard as Card } from "@townplay/shared";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { longDate } from "@/lib/dates";

export async function GameCard({ game }: { game: Card }) {
  const t = await getTranslations();
  const locale = await getLocale();
  return (
    <Link
      href={`/games/${game.id}`}
      className="block space-y-1 rounded-lg border p-3 hover:bg-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          {t(`sports.${game.sport}`)} · {t(`games.skill.${game.skillLevel}`)}
        </h2>
        <span className="text-sm font-medium text-primary">
          {game.spotsLeft > 0 ? t("games.spotsLeft", { count: game.spotsLeft }) : t("games.full")}
        </span>
      </div>
      <p className="text-sm">
        {longDate(game.date, locale)} · {game.startTime}–{game.endTime}
      </p>
      <p className="text-sm text-muted-foreground">
        {game.venueName}, {game.area} · {t("games.hostedBy", { name: game.hostFirstName })}
      </p>
      <p className="text-sm">
        {game.pricePerHeadPaise > 0
          ? t("games.perHead", { price: formatPaise(game.pricePerHeadPaise) })
          : t("games.free")}
      </p>
    </Link>
  );
}
