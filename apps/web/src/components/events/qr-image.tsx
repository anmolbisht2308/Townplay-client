"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Renders a QR code for the ticket token as an image (generated on the phone, no network). */
export function QrImage({ value, label }: { value: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 512 }).then(
      (url) => {
        if (alive) setSrc(url);
      },
    );
    return () => {
      alive = false;
    };
  }, [value]);
  if (!src)
    return <div className="aspect-square w-full max-w-64 animate-pulse rounded-lg bg-accent" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URL generated in the browser
    <img
      src={src}
      alt={label}
      className="aspect-square w-full max-w-64 rounded-lg border bg-white p-2"
    />
  );
}
