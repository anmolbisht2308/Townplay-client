import {
  EVENT_TYPES,
  EVENT_WHEN,
  cityResponseSchema,
  eventListQuerySchema,
  eventListResponseSchema,
} from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EventCard } from "@/components/events/event-card";
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
  const t = await getTranslations("events");
  return {
    title: t("title", { city: city.name }),
    description: t("metaDescription", { city: city.name }),
    alternates: { canonical: `/${city.slug}/events` },
  };
}

export default async function EventsPage({ params, searchParams }: Props) {
  const city = await getCity((await params).city);
  const raw = await searchParams;
  const one = (k: string) => (typeof raw[k] === "string" && raw[k] !== "" ? raw[k] : undefined);
  const parsed = eventListQuerySchema.safeParse({
    when: one("when"),
    type: one("type"),
    cursor: one("cursor"),
  });
  const query = parsed.success ? parsed.data : eventListQuerySchema.parse({});
  const qs = new URLSearchParams({
    when: query.when,
    ...(query.type ? { type: query.type } : {}),
    ...(query.cursor ? { cursor: query.cursor } : {}),
  });
  const list = await serverGet(
    `/cities/${city.slug}/events?${qs.toString()}`,
    eventListResponseSchema,
  );
  const t = await getTranslations();
  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams({
      when: query.when,
      ...(query.type ? { type: query.type } : {}),
    });
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    return `/${city.slug}/events?${p.toString()}`;
  };
  return (
    <section data-wide className="space-y-6 pt-6">
      <PageHeading eyebrow={t("events.eyebrow")} title={t("events.title", { city: city.name })} />
      <CityTabs citySlug={city.slug} active="events" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          label={t("events.whenLabel")}
          items={EVENT_WHEN.map((w) => ({
            href: href({ when: w, cursor: undefined }),
            label: t(`events.when.${w}`),
            active: query.when === w,
          }))}
        />
        <ChipRow
          label={t("events.typeLabel")}
          items={[
            {
              href: href({ type: undefined, cursor: undefined }),
              label: t("events.allTypes"),
              active: !query.type,
            },
            ...EVENT_TYPES.map((type) => ({
              href: href({ type, cursor: undefined }),
              label: t(`events.types.${type}`),
              active: query.type === type,
            })),
          ]}
        />
      </div>
      {list.items.length === 0 && (
        <EmptyState emoji="🎉" title={t("events.emptyTitle")} text={t("events.empty")} />
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((e, i) => (
          <li
            key={e.id}
            className="animate-fade-up"
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <EventCard event={e} citySlug={city.slug} />
          </li>
        ))}
      </ul>
      {list.nextCursor && (
        <div className="flex justify-center">
          <Link
            href={href({ cursor: list.nextCursor })}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("events.more")}
          </Link>
        </div>
      )}
    </section>
  );
}
