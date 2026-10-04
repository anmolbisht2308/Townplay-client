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
        <span className={chip(true)} aria-current="page">
          {t("categories.events")}
        </span>
      </nav>
      <h1 className="text-2xl font-bold">{t("events.title", { city: city.name })}</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {EVENT_WHEN.map((w) => (
          <Link
            key={w}
            href={href({ when: w, cursor: undefined })}
            className={chip(query.when === w)}
          >
            {t(`events.when.${w}`)}
          </Link>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Link href={href({ type: undefined, cursor: undefined })} className={chip(!query.type)}>
          {t("events.allTypes")}
        </Link>
        {EVENT_TYPES.map((type) => (
          <Link
            key={type}
            href={href({ type, cursor: undefined })}
            className={chip(query.type === type)}
          >
            {t(`events.types.${type}`)}
          </Link>
        ))}
      </div>
      {list.items.length === 0 && <p className="text-muted-foreground">{t("events.empty")}</p>}
      <ul className="space-y-3">
        {list.items.map((e) => (
          <li key={e.id}>
            <EventCard event={e} citySlug={city.slug} />
          </li>
        ))}
      </ul>
      {list.nextCursor && (
        <Link
          href={href({ cursor: list.nextCursor })}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("events.more")}
        </Link>
      )}
    </section>
  );
}
