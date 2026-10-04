import { formatPaise, publicEventSchema, type PublicEvent } from "@townplay/shared";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { cache } from "react";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { TicketPicker } from "@/components/events/ticket-picker";
import { ChevronLeftIcon, ClockIcon, PinIcon, TicketIcon } from "@/components/icons";
import { SportArt } from "@/components/sport-art";
import { buttonVariants } from "@/components/ui/button";
import { clientEnv } from "@/env";
import { eventWhen } from "@/lib/event-time";
import { imageUrl } from "@/lib/images";
import { googleMapsUrl } from "@/lib/maps";
import { serverGet } from "@/lib/server-api";

type Props = { params: Promise<{ city: string; slug: string }> };

// Remaining ticket counts change quickly: cache only briefly.
const getEvent = cache((city: string, slug: string) =>
  serverGet(`/events/by-slug/${city}/${slug}`, publicEventSchema, 15),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const e = await getEvent(city, slug);
  const description = e.description.slice(0, 160) || `${e.title} · ${e.address}`;
  return {
    title: e.title,
    description,
    alternates: { canonical: `/${city}/events/${slug}` },
    openGraph: {
      title: e.title,
      description,
      type: "website",
      images: e.photos.slice(0, 1).map((p) => imageUrl(p.url, 1200)),
    },
  };
}

/** Sales close when the event starts (the api enforces this too). */
function salesClosed(e: PublicEvent): boolean {
  return e.cancelled || Date.parse(e.startsAt) <= Date.now();
}

function jsonLd(e: PublicEvent, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    url,
    startDate: e.startsAt,
    endDate: e.endsAt,
    eventStatus: e.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.photos.map((p) => imageUrl(p.url, 1200)),
    description: e.description,
    location: {
      "@type": "Place",
      name: e.venueName ?? e.address,
      address: {
        "@type": "PostalAddress",
        streetAddress: e.address,
        addressLocality: e.cityName,
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: e.location.lat, longitude: e.location.lng },
    },
    organizer: { "@type": "Organization", name: e.organiserName },
    offers: e.tiers.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: (t.pricePaise / 100).toFixed(2),
      priceCurrency: "INR",
      availability: t.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url,
    })),
  };
}

export default async function EventPage({ params }: Props) {
  const { city, slug } = await params;
  const e = await getEvent(city, slug);
  const t = await getTranslations("events");
  const locale = await getLocale();
  const url = `${clientEnv.NEXT_PUBLIC_SITE_URL}/${city}/events/${slug}`;
  const closed = salesClosed(e);

  const when = new Date(e.startsAt);
  const day = when.toLocaleString(locale, { timeZone: "Asia/Kolkata", day: "numeric" });
  const month = when.toLocaleString(locale, { timeZone: "Asia/Kolkata", month: "short" });
  const minPrice = Math.min(...e.tiers.map((x) => x.pricePaise));
  const info = "min-w-0 rounded-2xl bg-surface p-4";

  return (
    <article data-wide className="space-y-6 pt-4 md:pt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(e, url)).replace(/</g, "\\u003c"),
        }}
      />
      <Link
        href={`/${city}/events`}
        className="pressable inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon size={16} />
        {t("back", { city: e.cityName })}
      </Link>

      <div className="relative -mx-4 overflow-hidden md:mx-0 md:rounded-2xl">
        {e.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
          <img
            src={imageUrl(e.photos[0].url, 1200)}
            alt={e.title}
            fetchPriority="high"
            className="h-56 w-full object-cover md:h-80"
          />
        ) : (
          <SportArt
            sport={e.type === "club_session" ? "club" : "event"}
            size="lg"
            className="h-56 md:h-80"
          />
        )}
        <span className="animate-pop absolute top-4 left-4 grid min-w-16 place-items-center rounded-2xl bg-background/95 px-3 py-2 text-center leading-none shadow-lift md:left-6">
          <span className="font-display text-3xl font-extrabold">{day}</span>
          <span className="text-xs font-bold text-primary-strong uppercase">{month}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem] lg:gap-x-8">
        <header className="min-w-0 space-y-3 lg:col-start-1">
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-strong">
            {t(`types.${e.type}`)}
          </span>
          <h1 className="text-3xl leading-tight font-extrabold md:text-5xl">{e.title}</h1>
          <p className="text-muted-foreground">{t("by", { organiser: e.organiserName })}</p>
          {e.cancelled && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {t("cancelled")}
            </p>
          )}
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className={info}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ClockIcon size={14} /> {t("date")}
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {eventWhen(e.startsAt, locale)} – {eventWhen(e.endsAt, locale)}
              </dd>
            </div>
            <div className={info}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <PinIcon size={14} /> {t("where")}
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {e.venueName ? `${e.venueName}, ` : ""}
                {e.address}
              </dd>
            </div>
            <div className={info}>
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <TicketIcon size={14} /> {t("tickets")}
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {minPrice === 0 ? t("free") : t("from", { price: formatPaise(minPrice) })}
              </dd>
            </div>
            {e.ageLimit !== null && e.ageLimit > 0 && (
              <div className={info}>
                <dt className="text-xs font-semibold text-muted-foreground">🔞</dt>
                <dd className="mt-1 text-sm font-semibold">{t("ageLimit", { age: e.ageLimit })}</dd>
              </div>
            )}
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={googleMapsUrl(e.location)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              🧭 {t("directions")}
            </a>
            <AddToCalendar
              id={e.id}
              title={e.title}
              startsAt={e.startsAt}
              endsAt={e.endsAt}
              address={e.address}
              url={url}
            />
          </div>
        </header>

        {!e.cancelled && (
          <div
            id="tickets"
            className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
          >
            <TicketPicker eventId={e.id} tiers={e.tiers} closed={closed} />
          </div>
        )}

        <div className="min-w-0 space-y-6 lg:col-start-1">
          {e.description && (
            <section className="reveal space-y-2 rounded-2xl border bg-card p-5 shadow-card">
              <h2 className="text-xl font-bold">{t("about")}</h2>
              <p className="whitespace-pre-line text-muted-foreground">{e.description}</p>
            </section>
          )}
          <section className="reveal flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-card">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-muted-foreground">{t("organiser")}</h2>
              <p className="font-display text-lg font-bold">{e.organiserName}</p>
            </div>
            <a href={`tel:+91${e.contactPhone}`} className={buttonVariants({ variant: "soft" })}>
              📞 {t("call")}
            </a>
          </section>
        </div>
      </div>
    </article>
  );
}
