"use client";

import { addDays, businessSchema, earningsSchema, formatPaise, istDate } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { use, useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { PayoutForm } from "@/components/owner/payout-form";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";

function Tile({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={strong ? "text-lg font-bold text-primary" : "text-lg font-semibold"}>
        {formatPaise(value)}
      </p>
    </div>
  );
}

function Earnings({ id }: { id: string }) {
  const t = useTranslations("earnings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const today = istDate();
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(addDays(today, 0));
  const businesses = useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get("/businesses/mine", z.array(businessSchema)),
  });
  const earnings = useQuery({
    queryKey: ["earnings", id, from, to],
    queryFn: () => api.get(`/businesses/${id}/earnings?from=${from}&to=${to}`, earningsSchema),
    enabled: from <= to,
  });
  const business = businesses.data?.find((b) => b.id === id);
  const e = earnings.data;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">
        {t("title")}
        {business ? ` · ${business.name}` : ""}
      </h1>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t("from")}>
          <Input
            type="date"
            value={from}
            onChange={(ev) => ev.target.value && setFrom(ev.target.value)}
          />
        </Field>
        <Field label={t("to")}>
          <Input
            type="date"
            value={to}
            onChange={(ev) => ev.target.value && setTo(ev.target.value)}
          />
        </Field>
      </div>
      {earnings.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {earnings.isError && <p className="text-destructive">{tc("error")}</p>}
      {e && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Tile label={t("bookedValue")} value={e.bookedValuePaise} />
            <Tile label={t("advanceOnline")} value={e.advanceOnlinePaise} />
            <Tile label={t("balanceCollected")} value={e.balanceCollectedPaise} />
            <Tile label={t("refunds")} value={e.refundsPaise} />
            <Tile label={t("paidOut")} value={e.paidOutPaise} />
            <Tile label={t("payoutDue")} value={e.payoutDuePaise} strong />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("bookings")}: {e.bookings} · {t("platformFees")}: {formatPaise(e.platformFeesPaise)}
            {e.membershipsOnlinePaise > 0 &&
              ` · ${t("memberships")}: ${formatPaise(e.membershipsOnlinePaise)}`}
          </p>
          <h2 className="font-semibold">{t("rows")}</h2>
          {e.rows.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
          <ul className="space-y-2">
            {e.rows.map((r) => (
              <li key={r.bookingId} className="rounded-lg border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {longDate(r.date, locale)} · {r.startTime}
                  </span>
                  <BookingStatusBadge status={r.status as "confirmed"} />
                </div>
                <p className="text-muted-foreground">
                  {r.venueName} · {r.code} · {formatPaise(r.totalPaise)}
                </p>
                <p className="text-xs">
                  {t("advanceOnline")}: {formatPaise(r.advanceOnlinePaise)} ·{" "}
                  {t("balanceCollected")}: {formatPaise(r.balanceCollectedPaise)}
                  {r.refundPaise > 0 && ` · ${t("refunds")}: ${formatPaise(r.refundPaise)}`}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      {business && <PayoutForm business={business} />}
    </section>
  );
}

export default function EarningsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Earnings id={id} />}</AuthGate>;
}
