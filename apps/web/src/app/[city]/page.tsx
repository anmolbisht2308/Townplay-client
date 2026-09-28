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
import { buttonVariants } from "@/components/ui/button";
import { VenueCard } from "@/components/venue-card";
import { serverGet } from "@/lib/server-api";
import { cn } from "@/lib/utils";
import { NearMeButton } from "./near-me-button";

type Props = {
  params: Promise<{ city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS = [...VENUE_CATEGORIES, "events"] as const;

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
  const tab = TABS.find((c) => c === one("category")) ?? "sports";
  const parsed = venueListQuerySchema.safeParse({
    category: tab === "events" ? undefined : tab,
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
  const [list, areas] =
    tab === "events"
      ? [null, [] as string[]]
      : await Promise.all([
          serverGet(`/cities/${city.slug}/venues?${qs.toString()}`, venueListResponseSchema),
          serverGet(`/cities/${city.slug}/areas`, z.array(z.string()), 300),
        ]);

  const tabHref = (c: string) => `/${city.slug}?category=${c}`;
  const moreHref = () => {
    const next = new URLSearchParams(qs);
    next.set("cursor", list?.nextCursor ?? "");
    return `/${city.slug}?${next.toString()}`;
  };

  return (
    <section className="space-y-4 pt-4">
      <h1 className="text-2xl font-bold">{t("city.title", { city: city.name })}</h1>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4" aria-label={t("common.appName")}>
        {TABS.map((c) => (
          <Link
            key={c}
            href={tabHref(c)}
            aria-current={tab === c ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm",
              tab === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {t(`categories.${c}`)}
          </Link>
        ))}
      </nav>

      {tab === "events" ? (
        // TODO(phase 4): event listing.
        <p className="text-muted-foreground">{t("city.eventsSoon")}</p>
      ) : (
        <>
          {/* A plain GET form: filters work before (or without) JavaScript on slow phones. */}
          <form className="grid grid-cols-2 gap-2" action={`/${city.slug}`}>
            <input type="hidden" name="category" value={tab} />
            {query.near && <input type="hidden" name="near" value={query.near} />}
            <input
              name="q"
              defaultValue={query.q}
              placeholder={t("city.search")}
              aria-label={t("city.search")}
              className="col-span-2 h-11 rounded-md border bg-background px-3"
            />
            <select
              name="sport"
              defaultValue={query.sport ?? ""}
              aria-label={t("venue.sports")}
              className="h-11 rounded-md border bg-background px-2"
            >
              <option value="">{t("city.allSports")}</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {t(`sports.${s}`)}
                </option>
              ))}
            </select>
            <select
              name="area"
              defaultValue={query.area ?? ""}
              aria-label={t("venueForm.area")}
              className="h-11 rounded-md border bg-background px-2"
            >
              <option value="">{t("city.allAreas")}</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button type="submit" className={cn(buttonVariants({ size: "sm" }), "col-span-2")}>
              {t("city.searchButton")}
            </button>
          </form>
          <NearMeButton />

          {list && list.items.length === 0 && (
            <p className="text-muted-foreground">{t("city.empty")}</p>
          )}
          <ul className="space-y-3">
            {list?.items.map((v) => (
              <li key={v.id}>
                <VenueCard venue={v} citySlug={city.slug} />
              </li>
            ))}
          </ul>
          {list?.nextCursor && (
            <Link href={moreHref()} className={buttonVariants({ variant: "outline" })}>
              {t("city.loadMore")}
            </Link>
          )}
        </>
      )}
    </section>
  );
}
