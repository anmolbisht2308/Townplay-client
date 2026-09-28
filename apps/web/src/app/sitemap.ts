import { cityResponseSchema, sitemapEntrySchema } from "@townplay/shared";
import type { MetadataRoute } from "next";
import { z } from "zod";
import { clientEnv } from "@/env";
import { serverGet } from "@/lib/server-api";

// Rendered per request (data cached for an hour) so builds never need the api.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  const [cities, venues] = await Promise.all([
    serverGet("/cities", z.array(cityResponseSchema), 3600),
    serverGet("/sitemap", z.array(sitemapEntrySchema), 3600),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...cities.map((c) => ({
      url: `${base}/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...venues.map((v) => ({
      url: `${base}/${v.citySlug}/venues/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
