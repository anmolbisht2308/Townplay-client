import { formatPaise, type EventCard as Card } from "@townplay/shared";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { eventWhen } from "@/lib/event-time";
import { imageUrl } from "@/lib/images";

export async function EventCard({ event, citySlug }: { event: Card; citySlug: string }) {
  const t = await getTranslations("events");
  const locale = await getLocale();
  return (
    <Link
      href={`/${citySlug}/events/${event.slug}`}
      className="flex gap-3 rounded-lg border p-3 hover:bg-accent"
    >
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-accent">
        {event.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
          <img
            src={imageUrl(event.photo.url, 240)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <h2 className="truncate font-semibold">{event.title}</h2>
        <p className="text-sm">{eventWhen(event.startsAt, locale)}</p>
        <p className="truncate text-sm text-muted-foreground">{event.venueName ?? event.area}</p>
        <p className="text-sm font-medium text-primary">
          {event.soldOut
            ? t("soldOut")
            : event.minPricePaise === 0
              ? t("free")
              : t("from", { price: formatPaise(event.minPricePaise) })}
        </p>
      </div>
    </Link>
  );
}
