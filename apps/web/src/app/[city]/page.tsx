import {
  SPORTS,
  VENUE_CATEGORIES,
  cityResponseSchema,
  venueListQuerySchema,
  venueListResponseSchema,
} from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CityTabs } from "@/components/city-tabs";
import { SearchIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { VenueCard } from "@/components/venue-card";
import { serverGet } from "@/lib/server-api";
import { cn } from "@/lib/utils";
import { NearMeButton } from "./near-me-button";

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getCity(slug: string) {
  const cities = await serverGet("/cities", z.array(cityResponseSchema), 300);
  const city = cities.find((c) => c.slug === slug);
  if (!city) notFound();
  return city;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCity((await params).city);
  const t = await getTranslations("city");
  return {
    title: t("title", { city: city.name }),
    description: t("metaDescription", { city: city.name }),
    alternates: { canonical: `/${city.slug}` },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const city = await getCity((await params).city);
  const raw = await searchParams;
  const one = (k: string) => (typeof raw[k] === "string" && raw[k] !== "" ? raw[k] : undefined);
  const tab = (VENUE_CATEGORIES as readonly string[]).includes(one("category") ?? "")
    ? (one("category") as (typeof VENUE_CATEGORIES)[number])
    : "sports";
  const parsed = venueListQuerySchema.safeParse({
    category: tab,
    sport: one("sport"),
    area: one("area"),
    q: one("q"),
    near: one("near"),
    cursor: one("cursor"),
  });
  const query = parsed.success ? parsed.data : venueListQuerySchema.parse({ category: "sports" });
  const t = await getTranslations();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (v !== undefined && k !== "limit") qs.set(k, String(v));
  const [list, areas] = await Promise.all([
    serverGet(`/cities/${city.slug}/venues?${qs.toString()}`, venueListResponseSchema),
    serverGet(`/cities/${city.slug}/areas`, z.array(z.string()), 300),
  ]);

  const moreHref = () => {
    const next = new URLSearchParams(qs);
    next.set("cursor", list?.nextCursor ?? "");
    return `/${city.slug}?${next.toString()}`;
  };
  const sportHref = (sport: string | undefined) => {
    const next = new URLSearchParams(qs);
    next.delete("cursor");
    if (sport) next.set("sport", sport);
    else next.delete("sport");
    return `/${city.slug}?${next.toString()}`;
  };
  const count = list?.items.length ?? 0;

  return (
    <section data-wide className="space-y-6 pt-6">
      <header className="animate-fade-up space-y-2">
        <p className="text-sm font-semibold text-primary-strong">{t("city.eyebrow")}</p>
        <h1 className="text-3xl font-extrabold md:text-5xl">
          {t("city.title", { city: city.name })}
        </h1>
      </header>

      <CityTabs citySlug={city.slug} active={tab} />

      {/* A plain GET form: filters work before (or without) JavaScript on slow phones. */}
      <form
        className="animate-fade-up grid gap-2 rounded-2xl border bg-card p-2 shadow-card md:grid-cols-[1fr_14rem_auto]"
        action={`/${city.slug}`}
        role="search"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <input type="hidden" name="category" value={tab} />
        {query.sport && <input type="hidden" name="sport" value={query.sport} />}
        {query.near && <input type="hidden" name="near" value={query.near} />}
        <label className="flex items-center gap-2 rounded-xl px-2">
          <SearchIcon size={19} className="shrink-0 text-muted-foreground" />
          <input
            name="q"
            defaultValue={query.q}
            placeholder={t("city.search")}
            aria-label={t("city.search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="grid grid-cols-[1fr_auto] gap-2 md:contents">
          <select
            name="area"
            defaultValue={query.area ?? ""}
            aria-label={t("venueForm.area")}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium"
          >
            <option value="">{t("city.allAreas")}</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonVariants()}>
            {t("city.searchButton")}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-2">
        <ul className="scroller -mx-4 flex-1 gap-2 px-4 py-1 md:mx-0 md:px-0">
          <li>
            <Link
              href={sportHref(undefined)}
              className={cn(
                "pressable inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
                !query.sport
                  ? "bg-primary-soft text-primary-strong"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("city.allSports")}
            </Link>
          </li>
          {SPORTS.map((s) => (
            <li key={s}>
              <Link
                href={sportHref(s)}
                className={cn(
                  "pressable inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
                  query.sport === s
                    ? "bg-primary-soft text-primary-strong"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`sports.${s}`)}
              </Link>
            </li>
          ))}
        </ul>
        <NearMeButton />
      </div>

      {list && (
        <p className="text-sm text-muted-foreground">
          {t("city.count", {
            count: count + (list.nextCursor ? 1 : 0),
            more: list.nextCursor ? "more" : "exact",
          })}
        </p>
      )}

      {list && list.items.length === 0 && (
        <div className="animate-scale-in rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-5xl">🏟️</p>
          <p className="mt-4 text-lg font-bold">{t("city.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("city.empty")}</p>
          <Link
            href={`/${city.slug}`}
            className={buttonVariants({ variant: "outline", className: "mt-5" })}
          >
            {t("city.clearFilters")}
          </Link>
        </div>
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list?.items.map((v, i) => (
          <li
            key={v.id}
            className="animate-fade-up"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <VenueCard venue={v} citySlug={city.slug} priority={i < 2} />
          </li>
        ))}
      </ul>
      {list?.nextCursor && (
        <div className="flex justify-center">
          <Link href={moreHref()} className={buttonVariants({ variant: "outline", size: "lg" })}>
            {t("city.loadMore")}
          </Link>
        </div>
      )}
    </section>
  );
}
