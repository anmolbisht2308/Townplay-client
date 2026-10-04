import { formatPaise, type PublicVenue } from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BookingWidget } from "@/components/booking/booking-widget";
import { buttonVariants } from "@/components/ui/button";
import { clientEnv } from "@/env";
import { imageUrl } from "@/lib/images";
import { googleMapsUrl } from "@/lib/maps";
import { getVenue } from "./data";
import { Offerings } from "./offerings";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const venue = await getVenue(city, slug);
  const description =
    venue.description.slice(0, 160) || `${venue.name}, ${venue.area}, ${venue.cityName}`;
  return {
    title: `${venue.name}, ${venue.area}`,
    description,
    alternates: { canonical: `/${city}/venues/${slug}` },
    openGraph: { title: venue.name, description, type: "website" },
  };
}

function jsonLd(venue: PublicVenue) {
  const url = `${clientEnv.NEXT_PUBLIC_SITE_URL}/${venue.citySlug}/venues/${venue.slug}`;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    "@context": "https://schema.org",
    "@type": venue.category === "sports" ? "SportsActivityLocation" : "LocalBusiness",
    name: venue.name,
    url,
    telephone: `+91${venue.contactPhone}`,
    image: venue.photos.map((p) => imageUrl(p.url, 1200)),
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: venue.cityName,
      addressRegion: venue.area,
      addressCountry: "IN",
    },
    geo: { "@type": "GeoCoordinates", latitude: venue.location.lat, longitude: venue.location.lng },
    openingHoursSpecification: venue.openingHours
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !d.closed)
      .map(({ d, i }) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days[i],
        opens: d.open,
        closes: d.close === "24:00" ? "23:59" : d.close,
      })),
  };
}

export default async function VenuePage({ params }: Props) {
  const { city, slug } = await params;
  const venue = await getVenue(city, slug);
  const t = await getTranslations();
  const policy = venue.bookingPolicy;

  return (
    <article className="space-y-6 pt-4">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(venue)).replace(/</g, "\\u003c") }}
      />

      {venue.photos.length > 0 && (
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4">
          {venue.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
            <img
              key={p.publicId}
              src={imageUrl(p.url, 720)}
              alt={`${venue.name} ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-52 w-[85%] shrink-0 snap-center rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <p className="text-muted-foreground">
          {venue.area}, {venue.cityName}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:+91${venue.contactPhone}`} className={buttonVariants()}>
          {t("venue.call")}
        </a>
        <a
          href={googleMapsUrl(venue.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("venue.openInMaps")}
        </a>
      </div>
      <BookingWidget venueId={venue.id} advancePercent={venue.bookingPolicy.advancePercent} />
      <Offerings venueId={venue.id} citySlug={venue.citySlug} />

      {venue.description && <p className="whitespace-pre-line">{venue.description}</p>}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("venue.courts")}</h2>
        <ul className="space-y-3">
          {venue.resources.map((r) => (
            <li key={r.id} className="rounded-lg border p-3">
              <p className="font-medium">
                {r.name} · {t(`sports.${r.sport}`)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("venue.perSlot", { mins: r.slotDurationMins })} ·{" "}
                {t("venue.maxPlayers", { count: r.maxPlayers })}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {r.pricingRules.map((p, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {p.days.length === 7
                        ? t("venue.allDays")
                        : p.days
                            .map((d) => t(`weekdaysShort.${d}` as "weekdaysShort.0"))
                            .join(", ")}{" "}
                      {p.start}–{p.end}
                    </span>
                    <span className="font-medium">{formatPaise(p.pricePaise)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {venue.sports.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t("venue.sports")}</h2>
          <p>{venue.sports.map((s) => t(`sports.${s}`)).join(" · ")}</p>
        </section>
      )}

      {venue.amenities.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t("venue.amenities")}</h2>
          <ul className="flex flex-wrap gap-2">
            {venue.amenities.map((a) => (
              <li key={a} className="rounded-full bg-accent px-3 py-1 text-sm">
                {t(`amenities.${a}`)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("venue.hours")}</h2>
        <table className="w-full text-sm">
          <tbody>
            {venue.openingHours.map((d, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-1.5">{t(`weekdays.${i}` as "weekdays.0")}</td>
                <td className="py-1.5 text-right">
                  {d.closed ? t("venue.closed") : `${d.open}–${d.close}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("venue.policies")}</h2>
        <p className="text-sm">
          {policy.advancePercent > 0
            ? t("venue.advance", { percent: policy.advancePercent })
            : t("venue.noAdvance")}
        </p>
        <p className="text-sm">
          {t("venue.cancellation", {
            hours: policy.cancellationCutoffHours,
            percent: policy.refundPercentBeforeCutoff,
          })}
        </p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-semibold">{t("venue.address")}</h2>
        <p className="text-sm">{venue.address}</p>
      </section>
    </article>
  );
}
