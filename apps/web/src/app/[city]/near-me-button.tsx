"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PinIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function NearMeButton() {
  const t = useTranslations("city");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<"idle" | "locating" | "denied">("idle");

  function locate() {
    if (!("geolocation" in navigator)) return setState("denied");
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = new URLSearchParams(params);
        next.set("near", `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`);
        next.delete("cursor");
        setState("idle");
        router.push(`${pathname}?${next.toString()}`);
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={locate}
        disabled={state === "locating"}
        className="rounded-full"
      >
        <PinIcon size={15} className={state === "locating" ? "animate-pulse" : ""} />
        {state === "locating" ? t("locating") : t("nearMe")}
      </Button>
      {state === "denied" && (
        <p className="animate-fade-in absolute top-full right-0 z-10 mt-2 w-56 rounded-xl bg-foreground p-3 text-xs text-background shadow-lift">
          {t("locationDenied")}
        </p>
      )}
    </div>
  );
}
