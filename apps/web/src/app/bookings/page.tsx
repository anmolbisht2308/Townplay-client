"use client";

import { bookingSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

function List() {
  const t = useTranslations("bookings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const list = useQuery({
    queryKey: ["bookings", scope],
    queryFn: () => api.get(`/bookings/mine?scope=${scope}`, z.array(bookingSchema)),
  });
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="flex gap-2" role="tablist">
        {(["upcoming", "past"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => setScope(s)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              scope === s && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {t(s)}
          </button>
        ))}
      </div>
      {list.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {list.isError && <p className="text-destructive">{tc("error")}</p>}
      {list.data?.length === 0 && (
        <div className="space-y-3">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link href="/bareilly" className={buttonVariants({ variant: "outline" })}>
            {t("findVenue")}
          </Link>
        </div>
      )}
      <ul className="space-y-3">
        {list.data?.map((b) => (
          <li key={b.id}>
            <Link
              href={`/bookings/${b.id}`}
              className="block space-y-1 rounded-lg border p-3 hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{b.venue.name}</p>
                <BookingStatusBadge status={b.status} />
              </div>
              <p className="text-sm">
                {longDate(b.date, locale)} · {b.startTime}–{b.endTime}
              </p>
              <p className="text-sm text-muted-foreground">
                {b.resource.name} · {t("code")} {b.code}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MyBookingsPage() {
  return <AuthGate>{() => <List />}</AuthGate>;
}
