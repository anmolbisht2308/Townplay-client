import type { MetadataRoute } from "next";

/** Installable PWA (needed for web push on Android home-screen installs). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Townplay",
    short_name: "Townplay",
    description: "Book turfs, courts and events in your city",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
