import { SPORTS, cityResponseSchema, gameCardSchema, gameListQuerySchema } from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GameCard } from "@/components/games/game-card";
import { Select } from "@/components/ui/field";
import { buttonVariants } from "@/components/ui/button";
import { serverGet } from "@/lib/server-api";
import { cn } from "@/lib/utils";

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
  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1.5 text-sm",
      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
    );

  return (
    <section className="space-y-4 pt-4">
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {(["sports", "club", "cafe"] as const).map((c) => (
          <Link key={c} href={`/${city.slug}?category=${c}`} className={chip(false)}>
            {t(`categories.${c}`)}
          </Link>
        ))}
        <Link href={`/${city.slug}/events`} className={chip(false)}>
          {t("categories.events")}
        </Link>
        <span className={chip(true)} aria-current="page">
          {t("categories.games")}
        </span>
      </nav>
      <h1 className="text-2xl font-bold">{t("games.title", { city: city.name })}</h1>
      <form className="flex flex-wrap gap-2" action={`/${city.slug}/games`}>
        <div className="flex w-full gap-2">
          {(["all", "today", "tomorrow"] as const).map((d) => (
            <Link
              key={d}
              href={`/${city.slug}/games?day=${d}${q.sport ? `&sport=${q.sport}` : ""}`}
              className={chip(q.day === d)}
            >
              {t(`games.day.${d}`)}
            </Link>
          ))}
        </div>
        <input type="hidden" name="day" value={q.day} />
        <Select
          name="sport"
          defaultValue={q.sport ?? ""}
          aria-label={t("games.allSports")}
          className="h-9 min-w-0 flex-1"
        >
          <option value="">{t("games.allSports")}</option>
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {t(`sports.${s}`)}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonVariants({ size: "sm" })}>
          {t("city.searchButton")}
        </button>
      </form>
      {games.length === 0 && <p className="text-muted-foreground">{t("games.empty")}</p>}
      <ul className="space-y-3">
        {games.map((g) => (
          <li key={g.id}>
            <GameCard game={g} />
          </li>
        ))}
      </ul>
    </section>
  );
}
