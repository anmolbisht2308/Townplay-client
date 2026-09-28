/** Resized, auto-format Cloudinary delivery URL; other URLs pass through unchanged. */
export function imageUrl(url: string, width: number): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  return url.replace(marker, `${marker}f_auto,q_auto,c_fill,w_${width}/`);
}
