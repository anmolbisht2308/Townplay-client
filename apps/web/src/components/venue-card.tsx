import { formatPaise, type VenueCard as Card } from "@townplay/shared";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { imageUrl } from "@/lib/images";

export async function VenueCard({ venue, citySlug }: { venue: Card; citySlug: string }) {
  const t = await getTranslations();
  return (
    <Link
      href={`/${citySlug}/venues/${venue.slug}`}
      className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-accent">
        {venue.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already resizes; next/image would add a second optimiser hop
          <img
            src={imageUrl(venue.photo.url, 240)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <h2 className="truncate font-semibold">{venue.name}</h2>
        <p className="truncate text-sm text-muted-foreground">
          {venue.area}
          {venue.distanceKm !== null && ` · ${t("city.kmAway", { km: venue.distanceKm })}`}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {venue.sports.map((s) => t(`sports.${s}`)).join(", ")}
        </p>
        {venue.minPricePaise !== null && (
          <p className="text-sm font-medium text-primary">
            {t("city.from", { price: formatPaise(venue.minPricePaise) })}
          </p>
        )}
      </div>
    </Link>
  );
}
