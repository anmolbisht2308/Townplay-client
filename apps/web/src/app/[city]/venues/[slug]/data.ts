import { publicVenueSchema } from "@townplay/shared";
import { cache } from "react";
import { serverGet } from "@/lib/server-api";

/** One fetch per request, shared by the page, its metadata and the OG image. */
export const getVenue = cache((city: string, slug: string) =>
  serverGet(`/venues/by-slug/${city}/${slug}`, publicVenueSchema),
);
