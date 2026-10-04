import { publicEventSchema, type PublicEvent } from "@townplay/shared";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { cache } from "react";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { TicketPicker } from "@/components/events/ticket-picker";
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

  return (
    <article className="space-y-5 pt-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(e, url)).replace(/</g, "\\u003c"),
        }}
      />
      {e.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
        <img
          src={imageUrl(e.photos[0].url, 720)}
          alt={e.title}
          className="h-52 w-full rounded-lg object-cover"
        />
      )}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{e.title}</h1>
        <p className="text-sm text-muted-foreground">{t("by", { organiser: e.organiserName })}</p>
      </header>
      {e.cancelled && (
        <p className="rounded-md bg-red-100 p-3 text-sm text-red-900">{t("cancelled")}</p>
      )}
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium">{t("date")}</dt>
          <dd>
            {eventWhen(e.startsAt, locale)} – {eventWhen(e.endsAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{t("where")}</dt>
          <dd>
            {e.venueName ? `${e.venueName}, ` : ""}
            {e.address}
          </dd>
        </div>
        {e.ageLimit !== null && e.ageLimit > 0 && (
          <dd className="font-medium">{t("ageLimit", { age: e.ageLimit })}</dd>
        )}
      </dl>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={googleMapsUrl(e.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("directions")}
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
      {!e.cancelled && <TicketPicker eventId={e.id} tiers={e.tiers} closed={closed} />}
      {e.description && <p className="whitespace-pre-line">{e.description}</p>}
      <section className="space-y-1">
        <h2 className="font-semibold">{t("organiser")}</h2>
        <a href={`tel:+91${e.contactPhone}`} className={buttonVariants({ variant: "outline" })}>
          {t("call")}
        </a>
      </section>
    </article>
  );
}
