import type { LatLng } from "@townplay/shared";

/** Opens Google Maps at the pin (no embedded map). */
export function googleMapsUrl({ lat, lng }: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
