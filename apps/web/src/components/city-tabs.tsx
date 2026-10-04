import { VENUE_CATEGORIES } from "@townplay/shared";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const CITY_TABS = [...VENUE_CATEGORIES, "events", "games"] as const;
export type CityTab = (typeof CITY_TABS)[number];

const EMOJI: Record<CityTab, string> = {
  sports: "⚽",
  club: "🏃",
  cafe: "☕",
  events: "🎉",
  games: "🤝",
};

/** Category switcher shared by the city listing, events and open games pages. */
export async function CityTabs({ citySlug, active }: { citySlug: string; active: CityTab }) {
  const t = await getTranslations("categories");
  const href = (c: CityTab) =>
    c === "events" || c === "games"
      ? `/${citySlug}/${c}`
      : c === "sports"
        ? `/${citySlug}`
        : `/${citySlug}?category=${c}`;
  return (
    <nav className="scroller -mx-4 gap-2 px-4 py-1" aria-label={t("label")}>
      {CITY_TABS.map((c) => (
        <Link
          key={c}
          href={href(c)}
          aria-current={active === c ? "page" : undefined}
          className={cn(
            "pressable inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold",
            active === c
              ? "border-foreground bg-foreground text-background shadow-card"
              : "bg-card hover:border-primary hover:text-primary-strong",
          )}
        >
          <span aria-hidden="true">{EMOJI[c]}</span>
          {t(c)}
        </Link>
      ))}
    </nav>
  );
}
