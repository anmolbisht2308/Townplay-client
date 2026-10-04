import { formatPaise, type VenueCard as Card } from "@townplay/shared";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PinIcon } from "@/components/icons";
import { SportArt } from "@/components/sport-art";
import { imageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export async function VenueCard({
  venue,
  citySlug,
  className,
  priority,
}: {
  venue: Card;
  citySlug: string;
  className?: string;
  priority?: boolean;
}) {
  const t = await getTranslations();
  return (
    <Link
      href={`/${citySlug}/venues/${venue.slug}`}
      className={cn(
        "lift group block overflow-hidden rounded-2xl border bg-card shadow-card",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {venue.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes; next/image would add a second optimiser hop
          <img
            src={imageUrl(venue.photo.url, 640)}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <SportArt sport={venue.sports[0]} className="h-full w-full" />
        )}
        {venue.minPricePaise !== null && (
          <span className="absolute bottom-3 left-3 rounded-full bg-background/95 px-3 py-1 text-xs font-bold shadow-card backdrop-blur">
            {t("city.from", { price: formatPaise(venue.minPricePaise) })}
          </span>
        )}
        {venue.distanceKm !== null && (
          <span className="absolute top-3 right-3 rounded-full bg-foreground/80 px-2.5 py-1 text-xs font-semibold text-background">
            {t("city.kmAway", { km: venue.distanceKm })}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="truncate text-lg leading-tight font-bold">{venue.name}</h3>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <PinIcon size={15} className="shrink-0" />
          {venue.area}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {venue.sports.slice(0, 3).map((s) => (
            <li
              key={s}
              className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-strong"
            >
              {t(`sports.${s}`)}
            </li>
          ))}
          {venue.sports.length > 3 && (
            <li className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">
              +{venue.sports.length - 3}
            </li>
          )}
        </ul>
      </div>
    </Link>
  );
}
