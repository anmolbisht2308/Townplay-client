"use client";

import { eventIcs } from "@townplay/shared";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";

/** Downloads an .ics file built in the browser (no server round trip). */
export function AddToCalendar(props: {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  address: string;
  url: string;
}) {
  const t = useTranslations("events");
  function download() {
    const blob = new Blob([eventIcs(props)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${props.title.replace(/[^\w-]+/g, "-").slice(0, 40) || "event"}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <button type="button" onClick={download} className={buttonVariants({ variant: "outline" })}>
      {t("addToCalendar")}
    </button>
  );
}
