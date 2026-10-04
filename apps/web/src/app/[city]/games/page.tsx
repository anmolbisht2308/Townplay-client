import { SPORTS, cityResponseSchema, gameCardSchema, gameListQuerySchema } from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GameCard } from "@/components/games/game-card";
import { CityTabs } from "@/components/city-tabs";
import { ChipRow, EmptyState, PageHeading, Segmented } from "@/components/filters";
import { buttonVariants } from "@/components/ui/button";
import { serverGet } from "@/lib/server-api";

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getCity(slug: string) {
  const city = (await serverGet("/cities", z.array(cityResponseSchema), 300)).find(
    (c) => c.slug === slug,
  );
  if (!city) notFound();
  return city;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCity((await params).city);
  const t = await getTranslations("games");
  return {
    title: t("title", { city: city.name }),
    description: t("metaDescription", { city: city.name }),
    alternates: { canonical: `/${city.slug}/games` },
  };
}

export default async function GamesPage({ params, searchParams }: Props) {
  const city = await getCity((await params).city);
  const raw = await searchParams;
  const one = (k: string) => (typeof raw[k] === "string" && raw[k] !== "" ? raw[k] : undefined);
  const parsed = gameListQuerySchema.safeParse({ day: one("day"), sport: one("sport") });
  const q = parsed.success ? parsed.data : gameListQuerySchema.parse({});
  const qs = new URLSearchParams({ day: q.day, ...(q.sport ? { sport: q.sport } : {}) });
  // Spots change quickly: short cache.
  const games = await serverGet(
    `/cities/${city.slug}/games?${qs.toString()}`,
    z.array(gameCardSchema),
    15,
  );
  const t = await getTranslations();
  const href = (next: { day?: string; sport?: string | null }) => {
    const p = new URLSearchParams({ day: next.day ?? q.day });
    const sport = next.sport === undefined ? q.sport : next.sport;
    if (sport) p.set("sport", sport);
    return `/${city.slug}/games?${p.toString()}`;
  };

  return (
    <section data-wide className="space-y-6 pt-6">
      <PageHeading eyebrow={t("games.eyebrow")} title={t("games.title", { city: city.name })} />
      <CityTabs citySlug={city.slug} active="games" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          label={t("games.dayLabel")}
          items={(["all", "today", "tomorrow"] as const).map((d) => ({
            href: href({ day: d }),
            label: t(`games.day.${d}`),
            active: q.day === d,
          }))}
        />
        <ChipRow
          label={t("games.allSports")}
          items={[
            { href: href({ sport: null }), label: t("games.allSports"), active: !q.sport },
            ...SPORTS.map((s) => ({
              href: href({ sport: s }),
              label: t(`sports.${s}`),
              active: q.sport === s,
            })),
          ]}
        />
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-energy/40 p-4 text-sm">
        <span className="text-2xl" aria-hidden="true">
          💡
        </span>
        <p>{t("games.howItWorks")}</p>
      </div>
      {games.length === 0 && (
        <EmptyState
          emoji="🤝"
          title={t("games.emptyTitle")}
          text={t("games.empty")}
          action={
            <Link href={`/${city.slug}`} className={buttonVariants({ variant: "outline" })}>
              {t("games.bookToHost")}
            </Link>
          }
        />
      )}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {games.map((g, i) => (
          <li
            key={g.id}
            className="animate-fade-up"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <GameCard game={g} />
          </li>
        ))}
      </ul>
    </section>
  );
}
