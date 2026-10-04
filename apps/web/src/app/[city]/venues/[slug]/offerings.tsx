import { formatPaise, istDate, venueOfferingsSchema, type VenueOfferings } from "@townplay/shared";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { JoinForm } from "@/components/memberships/join-form";
import { daysLabel } from "@/components/memberships/schedule";
import { longDate } from "@/lib/dates";
import { eventWhen } from "@/lib/event-time";
import { serverGet } from "@/lib/server-api";

async function load(venueId: string): Promise<VenueOfferings | null> {
  try {
    return await serverGet(`/venues/${venueId}/offerings`, venueOfferingsSchema, 30);
  } catch {
    return null; // the venue page still works without this section
  }
}

/** Membership plans, coaching batches and club sessions on the public venue page. */
export async function Offerings({ venueId, citySlug }: { venueId: string; citySlug: string }) {
  const data = await load(venueId);
  if (!data || data.plans.length + data.batches.length + data.sessions.length === 0) return null;
  const t = await getTranslations();
  const locale = await getLocale();
  const tm = (key: string, values?: Record<string, string | number>) =>
    t(`memberships.${key}` as "memberships.join", values);

  return (
    <section className="space-y-4" id="memberships">
      <h2 className="text-lg font-semibold">{tm("sectionTitle")}</h2>

      {data.plans.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">{tm("plans")}</h3>
          <ul className="space-y-3">
            {data.plans.map((p) => (
              <li key={p.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{p.name}</p>
                  <p className="font-semibold">{formatPaise(p.pricePaise)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tm("months", { count: p.durationMonths })}
                  {p.discountPercent > 0 &&
                    ` · ${tm("discount", { percent: p.discountPercent })}, ${
                      p.bookingsPerMonth
                        ? tm("perMonthCap", { count: p.bookingsPerMonth })
                        : tm("everyBooking")
                    }`}
                </p>
                {p.description && <p className="text-sm whitespace-pre-line">{p.description}</p>}
                <JoinForm
                  target={{ planId: p.id }}
                  label={tm("joinFor", { amount: formatPaise(p.pricePaise) })}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.batches.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">{tm("batches")}</h3>
          <ul className="space-y-3">
            {data.batches.map((b) => (
              <li key={b.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold">{b.title}</p>
                  <p className="shrink-0 text-sm font-semibold">
                    {tm("perMonth", { amount: formatPaise(b.monthlyFeePaise) })}
                  </p>
                </div>
                <p className="text-sm">
                  {tm("schedule", {
                    days: daysLabel(b.days, (k) => t(k as "venue.allDays")),
                    start: b.startTime,
                    end: b.endTime,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {b.activity} · {tm("coach", { name: b.coachName })}
                  {b.resourceName ? ` · ${b.resourceName}` : ""}
                </p>
                <p className="text-sm">
                  <span className={b.seatsLeft === 0 ? "text-destructive" : "text-primary"}>
                    {tm("seatsLeft", { count: b.seatsLeft })}
                  </span>
                  {b.startDate > istDate() &&
                    ` · ${tm("startsOn", { date: longDate(b.startDate, locale) })}`}
                </p>
                {b.description && <p className="text-sm whitespace-pre-line">{b.description}</p>}
                <JoinForm
                  target={{ batchId: b.id }}
                  label={tm("joinFor", { amount: formatPaise(b.monthlyFeePaise) })}
                  disabled={b.seatsLeft === 0}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.sessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">{tm("sessions")}</h3>
          <ul className="divide-y rounded-lg border">
            {data.sessions.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/${citySlug}/events/${e.slug}`}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <span>
                    <span className="block font-medium">{e.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {eventWhen(e.startsAt, locale)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm">
                    {e.minPricePaise === 0 ? t("events.free") : formatPaise(e.minPricePaise)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
