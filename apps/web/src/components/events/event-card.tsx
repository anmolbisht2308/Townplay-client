import { formatPaise, type EventCard as Card } from "@townplay/shared";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ClockIcon, PinIcon } from "@/components/icons";
import { SportArt } from "@/components/sport-art";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

function dateParts(iso: string, locale: string) {
  const d = new Date(iso);
  const opts = { timeZone: "Asia/Kolkata" } as const;
  return {
    day: d.toLocaleString(locale, { ...opts, day: "numeric" }),
    month: d.toLocaleString(locale, { ...opts, month: "short" }),
    time: d.toLocaleString(locale, {
      ...opts,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export async function EventCard({
  event,
  citySlug,
  className,
}: {
  event: Card;
  citySlug: string;
  className?: string;
}) {
  const t = await getTranslations("events");
  const locale = await getLocale();
  const when = dateParts(event.startsAt, locale);
  return (
    <Link
      href={`/${citySlug}/events/${event.slug}`}
      className={cn(
        "lift group block overflow-hidden rounded-2xl border bg-card shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {event.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes
          <img
            src={imageUrl(event.photo.url, 640)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <SportArt
            sport={event.type === "club_session" ? "club" : "event"}
            className="h-full w-full"
          />
        )}
        <span className="absolute top-3 left-3 grid min-w-12 place-items-center rounded-xl bg-background/95 px-2 py-1 text-center leading-none shadow-card">
          <span className="font-display text-xl font-extrabold">{when.day}</span>
          <span className="text-[11px] font-semibold text-primary-strong uppercase">
            {when.month}
          </span>
        </span>
        <span
          className={cn(
            "absolute right-3 bottom-3 rounded-full px-3 py-1 text-xs font-bold shadow-card",
            event.soldOut ? "bg-foreground text-background" : "bg-energy text-energy-foreground",
          )}
        >
          {event.soldOut
            ? t("soldOut")
            : event.minPricePaise === 0
              ? t("free")
              : t("from", { price: formatPaise(event.minPricePaise) })}
        </span>
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-lg leading-tight font-bold">{event.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <ClockIcon size={15} className="shrink-0" />
          {when.time}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <PinIcon size={15} className="shrink-0" />
          {event.venueName ?? event.area}
        </p>
      </div>
    </Link>
  );
}
