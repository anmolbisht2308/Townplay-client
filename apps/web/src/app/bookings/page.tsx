"use client";

import { bookingSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { EmptyStateClient, PageHeading } from "@/components/page-bits";
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
    <section className="space-y-6 pt-6">
      <PageHeading eyebrow={t("eyebrow")} title={t("title")} />
      <div className="inline-flex gap-1 rounded-xl bg-surface p-1" role="tablist">
        {(["upcoming", "past"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => setScope(s)}
            className={cn(
              "pressable rounded-lg px-5 py-2 text-sm font-semibold",
              scope === s ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {t(s)}
          </button>
        ))}
      </div>
      {list.isPending && (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </ul>
      )}
      {list.isError && <p className="text-destructive">{tc("error")}</p>}
      {list.data?.length === 0 && (
        <EmptyStateClient
          emoji={scope === "upcoming" ? "📅" : "🕰️"}
          title={t(scope === "upcoming" ? "emptyTitle" : "emptyPastTitle")}
          text={t("empty")}
          action={
            <Link href="/bareilly" className={buttonVariants()}>
              {t("findVenue")}
            </Link>
          }
        />
      )}
      <ul className="space-y-3" key={scope}>
        {list.data?.map((b, i) => {
          const d = new Date(`${b.date}T00:00:00Z`);
          return (
            <li
              key={b.id}
              className="animate-fade-up"
              style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
            >
              <Link
                href={`/bookings/${b.id}`}
                className="lift flex items-stretch overflow-hidden rounded-2xl border bg-card shadow-card"
              >
                <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-foreground py-3 text-background">
                  <span className="text-[11px] font-semibold uppercase opacity-70">
                    {d.toLocaleString(locale, { timeZone: "UTC", weekday: "short" })}
                  </span>
                  <span className="font-display text-3xl leading-none font-extrabold">
                    {d.toLocaleString(locale, { timeZone: "UTC", day: "numeric" })}
                  </span>
                  <span className="text-[11px] font-semibold text-energy uppercase">
                    {d.toLocaleString(locale, { timeZone: "UTC", month: "short" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-1 p-4">
                  <p className="truncate font-bold">{b.venue.name}</p>
                  <p className="text-sm font-semibold">
                    {b.startTime}–{b.endTime} · {b.resource.name}
                  </p>
                  <BookingStatusBadge status={b.status} />
                  <p className="text-xs text-muted-foreground">
                    {t("code")}{" "}
                    <span className="font-mono font-semibold tracking-wider">{b.code}</span>
                    {" · "}
                    {longDate(b.date, locale)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function MyBookingsPage() {
  return <AuthGate>{() => <List />}</AuthGate>;
}
