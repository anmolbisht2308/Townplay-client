import { formatPaise } from "@townplay/shared";
import { ImageResponse } from "next/og";
import { getVenue } from "./data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Venue on Townplay";

export default async function OgImage({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { city, slug } = await params;
  const venue = await getVenue(city, slug);
  const min = Math.min(...venue.resources.flatMap((r) => r.pricingRules.map((p) => p.pricePaise)));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "#15803d",
        color: "white",
        fontSize: 32,
      }}
    >
      <div style={{ display: "flex", fontSize: 36, opacity: 0.85 }}>Townplay</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>{venue.name}</div>
        <div style={{ display: "flex" }}>
          {venue.area}, {venue.cityName}
        </div>
      </div>
      <div style={{ display: "flex" }}>
        {Number.isFinite(min) ? `From ${formatPaise(min)} per slot` : "Book online"}
      </div>
    </div>,
    size,
  );
}
