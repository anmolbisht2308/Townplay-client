"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={locate}
        disabled={state === "locating"}
      >
        {state === "locating" ? t("locating") : t("nearMe")}
      </Button>
      {state === "denied" && <p className="text-sm text-destructive">{t("locationDenied")}</p>}
    </div>
  );
}
