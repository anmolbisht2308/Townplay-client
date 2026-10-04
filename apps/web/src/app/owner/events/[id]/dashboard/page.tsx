"use client";

import { attendeeSchema, eventDashboardSchema, formatPaise } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { use, useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function Dashboard({ id }: { id: string }) {
  const t = useTranslations("ownerEvents");
  const tc = useTranslations("common");
  const [q, setQ] = useState("");
  const dash = useQuery({
    queryKey: ["event-dashboard", id],
    queryFn: () => api.get(`/events/${id}/dashboard`, eventDashboardSchema),
    refetchInterval: 30_000,
  });
  const attendees = useQuery({
    queryKey: ["attendees", id, q],
    queryFn: () =>
      api.get(
        `/events/${id}/attendees${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        z.array(attendeeSchema),
      ),
  });
  if (dash.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (dash.isError) return <p className="text-destructive">{tc("error")}</p>;
  const d = dash.data;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border p-2">
          <p className="text-xs text-muted-foreground">{t("ticketsSold")}</p>
          <p className="text-lg font-bold">{d.ticketsSold}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-muted-foreground">{t("revenue")}</p>
          <p className="text-lg font-bold">{formatPaise(d.revenuePaise)}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-muted-foreground">{t("checkedIn")}</p>
          <p className="text-lg font-bold">{d.checkedIn}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {d.tiers.map((tier) => (
          <li key={tier.tierId} className="rounded-lg border p-3 text-sm">
            <div className="flex justify-between font-medium">
              <span>{tier.name}</span>
              <span>{formatPaise(tier.revenuePaise)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent" aria-hidden>
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, (tier.sold / tier.capacity) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-muted-foreground">
              {t("sold", { sold: tier.sold, capacity: tier.capacity })}
              {tier.held > 0 && ` · ${t("held", { held: tier.held })}`}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <a
          href={`/v1/events/${id}/attendees.csv`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("downloadCsv")}
        </a>
        <Link href={`/owner/events/${id}/checkin`} className={buttonVariants({ size: "sm" })}>
          {t("checkin")}
        </Link>
      </div>
      <h2 className="font-semibold">{t("attendees")}</h2>
      <Input
        placeholder={t("search")}
        aria-label={t("search")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="divide-y text-sm">
        {attendees.data?.map((a) => (
          <li key={a.ticketId} className="flex justify-between gap-2 py-2">
            <span>
              {a.holderName} · {a.tierName}
              <span className="block text-xs text-muted-foreground">
                {a.buyerPhone} · {a.orderCode}
              </span>
            </span>
            <span className="text-xs text-primary">{a.checkedInAt ? "✓" : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Dashboard id={id} />}</AuthGate>;
}
