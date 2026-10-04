import { formatPaise, type PublicVenue } from "@townplay/shared";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BookingWidget } from "@/components/booking/booking-widget";
import { CheckIcon, ChevronLeftIcon, ClockIcon, PinIcon, ShieldIcon } from "@/components/icons";
import { SportArt } from "@/components/sport-art";
import { buttonVariants } from "@/components/ui/button";
import { clientEnv } from "@/env";
import { imageUrl } from "@/lib/images";
import { googleMapsUrl } from "@/lib/maps";
import { waShareLink } from "@/lib/whatsapp";
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

function todayIndex(): number {
  // Weekday in IST (0 = Sunday), matching openingHours.
  return new Date(Date.now() + 330 * 60_000).getUTCDay();
}

const card = "rounded-2xl border bg-card p-5 shadow-card";

export default async function VenuePage({ params }: Props) {
  const { city, slug } = await params;
  const venue = await getVenue(city, slug);
  const t = await getTranslations();
  const policy = venue.bookingPolicy;
  const today = todayIndex();
  const todayHours = venue.openingHours[today];
  const minPrice = venue.resources
    .flatMap((r) => r.pricingRules.map((p) => p.pricePaise))
    .reduce<number | null>((m, p) => (m === null || p < m ? p : m), null);
  const shareText = `${venue.name}, ${venue.area} · ${clientEnv.NEXT_PUBLIC_SITE_URL}/${venue.citySlug}/venues/${venue.slug}`;

  return (
    <article data-wide className="space-y-6 pt-4 md:pt-6">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(venue)).replace(/</g, "\\u003c") }}
      />

      <Link
        href={`/${venue.citySlug}`}
        className="pressable inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon size={16} />
        {t("venue.back", { city: venue.cityName })}
      </Link>

      {/* ---------- gallery ---------- */}
      {venue.photos.length > 0 ? (
        <div className="scroller -mx-4 gap-2 px-4 md:mx-0 md:grid md:grid-cols-4 md:grid-rows-2 md:gap-2 md:overflow-hidden md:rounded-2xl md:px-0">
          {venue.photos.slice(0, 5).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
            <img
              key={p.publicId}
              src={imageUrl(p.url, i === 0 ? 1200 : 600)}
              alt={`${venue.name} ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className={`animate-fade-in h-56 w-[86%] shrink-0 rounded-2xl object-cover md:h-full md:w-full md:rounded-none ${
                i === 0 ? "md:col-span-2 md:row-span-2 md:h-[26rem]" : ""
              }`}
              style={{ "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
      ) : (
        <SportArt
          sport={venue.sports[0]}
          size="lg"
          className="animate-scale-in -mx-4 h-52 md:mx-0 md:h-72 md:rounded-2xl"
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem] lg:gap-x-8">
        {/* ---------- title ---------- */}
        <header className="animate-fade-up min-w-0 space-y-3 lg:col-start-1">
          <div className="flex flex-wrap gap-1.5">
            {venue.sports.map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-strong"
              >
                {t(`sports.${s}`)}
              </span>
            ))}
          </div>
          <h1 className="text-3xl leading-tight font-extrabold md:text-5xl">{venue.name}</h1>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <PinIcon size={17} className="shrink-0" />
            {venue.area}, {venue.cityName}
          </p>
          <dl className="grid grid-cols-[1fr_1.35fr_1fr] gap-2 pt-1">
            <div className="min-w-0 rounded-xl bg-surface px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{t("venue.statFrom")}</dt>
              <dd className="font-display text-base font-extrabold whitespace-nowrap md:text-lg">
                {minPrice !== null ? formatPaise(minPrice) : "—"}
              </dd>
            </div>
            <div className="min-w-0 rounded-xl bg-surface px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{t("venue.statToday")}</dt>
              <dd className="font-display text-base font-extrabold whitespace-nowrap md:text-lg">
                {todayHours && !todayHours.closed
                  ? `${todayHours.open.replace(/^0/, "")}–${todayHours.close.replace(/^0/, "")}`
                  : t("venue.closed")}
              </dd>
            </div>
            <div className="min-w-0 rounded-xl bg-surface px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{t("venue.statAdvance")}</dt>
              <dd className="font-display text-base font-extrabold whitespace-nowrap md:text-lg">
                {policy.advancePercent}%
              </dd>
            </div>
          </dl>
          <div className="flex gap-2 pt-1">
            <a
              href={`tel:+91${venue.contactPhone}`}
              className={buttonVariants({ variant: "outline", className: "min-w-0 flex-1 px-3" })}
            >
              📞 {t("venue.call")}
            </a>
            <a
              href={googleMapsUrl(venue.location)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", className: "min-w-0 flex-1 px-3" })}
            >
              🧭 {t("venue.directions")}
            </a>
            <a
              href={waShareLink(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("venue.share")}
              className={buttonVariants({
                variant: "outline",
                size: "icon",
                className: "h-11 w-11 shrink-0 rounded-xl",
              })}
            >
              ↗
            </a>
          </div>
        </header>

        {/* One booking widget: right after the header on phones, a sticky side column on desktop. */}
        <div
          id="book"
          className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <BookingWidget venueId={venue.id} advancePercent={policy.advancePercent} />
        </div>

        <div className="min-w-0 space-y-6 lg:col-start-1">
          <Offerings venueId={venue.id} citySlug={venue.citySlug} />

          {venue.description && (
            <section className={`reveal ${card} space-y-2`}>
              <h2 className="text-xl font-bold">{t("venue.about")}</h2>
              <p className="whitespace-pre-line text-muted-foreground">{venue.description}</p>
            </section>
          )}

          <section className="reveal space-y-3">
            <h2 className="text-xl font-bold">{t("venue.courts")}</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {venue.resources.map((r) => (
                <li key={r.id} className={`${card} space-y-3`}>
                  <div className="flex items-center gap-3">
                    <SportArt sport={r.sport} size="sm" className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t(`sports.${r.sport}`)} ·{" "}
                        {t("venue.perSlot", { mins: r.slotDurationMins })} ·{" "}
                        {t("venue.maxPlayers", { count: r.maxPlayers })}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {r.pricingRules.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2"
                      >
                        <span className="text-muted-foreground">
                          {p.days.length === 7
                            ? t("venue.allDays")
                            : p.days
                                .map((d) => t(`weekdaysShort.${d}` as "weekdaysShort.0"))
                                .join(", ")}{" "}
                          · {p.start}–{p.end}
                        </span>
                        <span className="font-bold">{formatPaise(p.pricePaise)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {venue.amenities.length > 0 && (
            <section className={`reveal ${card} space-y-3`}>
              <h2 className="text-xl font-bold">{t("venue.amenities")}</h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {venue.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-strong">
                      <CheckIcon size={13} strokeWidth={3} />
                    </span>
                    {t(`amenities.${a}`)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className={`reveal ${card} space-y-3`}>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ClockIcon size={19} /> {t("venue.hours")}
              </h2>
              <table className="w-full text-sm">
                <tbody>
                  {venue.openingHours.map((d, i) => (
                    <tr key={i} className={i === today ? "font-bold text-primary-strong" : ""}>
                      <td className="py-1">{t(`weekdays.${i}` as "weekdays.0")}</td>
                      <td className="py-1 text-right">
                        {d.closed ? t("venue.closed") : `${d.open}–${d.close}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className={`reveal ${card} space-y-3`}>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ShieldIcon size={19} /> {t("venue.policies")}
              </h2>
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
          </div>

          <section className={`reveal ${card} space-y-2`}>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <PinIcon size={19} /> {t("venue.address")}
            </h2>
            <p className="text-sm text-muted-foreground">{venue.address}</p>
            <a
              href={googleMapsUrl(venue.location)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "soft", size: "sm" })}
            >
              {t("venue.openInMaps")}
            </a>
          </section>
        </div>
      </div>
    </article>
  );
}
