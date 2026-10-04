"use client";

import { bookingSchema, formatPaise, type Booking } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { PayPanel } from "@/components/booking/pay-panel";
import { SharingPanel } from "@/components/booking/sharing-panel";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { FormError } from "@/components/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { longDate } from "@/lib/dates";
import { googleMapsUrl } from "@/lib/maps";
import { waLink } from "@/lib/whatsapp";

function useMinutesLeft(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((Date.parse(until) - now) / 60_000)) : null;
}

function Detail({ id }: { id: string }) {
  const t = useTranslations("bookings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const booking = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get(`/bookings/${id}`, bookingSchema),
  });
  const [reason, setReason] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const refresh = (b: Booking) => {
    queryClient.setQueryData(["booking", id], b);
    void queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };
  const cancel = useMutation({
    mutationFn: () =>
      api.send("POST", `/bookings/${id}/cancel`, bookingSchema, reason ? { reason } : {}),
    onSuccess: refresh,
  });
  const minutesLeft = useMinutesLeft(booking.data?.holdExpiresAt ?? null);

  if (booking.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (booking.isError) return <p className="text-destructive">{tc("error")}</p>;
  const b = booking.data;
  const canCancel = b.refundIfCancelledNowPaise !== null;

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{b.venue.name}</h1>
          <BookingStatusBadge status={b.status} />
        </div>
        <p>
          {longDate(b.date, locale)} · {b.startTime}–{b.endTime}
        </p>
        <p className="text-sm text-muted-foreground">{b.resource.name}</p>
      </header>

      <div className="rounded-lg bg-accent p-4 text-center">
        <p className="text-sm text-muted-foreground">{t("code")}</p>
        <p className="font-mono text-3xl font-bold tracking-widest">{b.code}</p>
      </div>

      {b.status === "pending_payment" && (
        <div className="space-y-2 rounded-lg border border-amber-300 p-3">
          {minutesLeft === 0 ? (
            <p className="text-sm text-destructive">{t("holdExpired")}</p>
          ) : (
            <>
              <p className="text-sm font-medium">{t("payBy", { minutes: minutesLeft ?? 10 })}</p>
              <PayPanel
                target={{ bookingId: b.id }}
                amountPaise={b.amount.advancePaise + b.amount.convenienceFeePaise}
                description={`${b.venue.name} · ${b.code}`}
                {...(b.customer ? { phone: b.customer.phone } : {})}
                onPaid={() => void booking.refetch()}
              />
            </>
          )}
        </div>
      )}

      <dl className="space-y-1 text-sm">
        {b.memberDiscountPaise > 0 && (
          <div className="flex justify-between text-primary">
            <dt>{t("memberDiscount")}</dt>
            <dd>−{formatPaise(b.memberDiscountPaise)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>{t("paidAdvance")}</dt>
          <dd>{formatPaise(b.amount.advancePaise)}</dd>
        </div>
        {b.amount.convenienceFeePaise > 0 && (
          <div className="flex justify-between">
            <dt>{t("fee")}</dt>
            <dd>{formatPaise(b.amount.convenienceFeePaise)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>
            {b.balanceCollected.method
              ? t("balancePaid", { method: t(`method.${b.balanceCollected.method}`) })
              : t("balanceDue")}
          </dt>
          <dd>{formatPaise(b.amount.balancePaise)}</dd>
        </div>
        {b.sharesPaidPaise > 0 && (
          <>
            <div className="flex justify-between">
              <dt>{t("sharesPaid")}</dt>
              <dd>{formatPaise(b.sharesPaidPaise)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>{t("balanceDueShares")}</dt>
              <dd>{formatPaise(b.balanceDuePaise)}</dd>
            </div>
          </>
        )}
      </dl>

      {b.cancellation && (
        <div className="space-y-1 rounded-lg border p-3 text-sm">
          <p className="font-medium">{t(`cancelledBy.${b.cancellation.by}`)}</p>
          {b.cancellation.reason && <p>{b.cancellation.reason}</p>}
          <p>{t("refund", { amount: formatPaise(b.cancellation.refundPaise) })}</p>
          {b.cancellation.refundPaise > 0 && (
            <p className="text-muted-foreground">
              {t(`refundStatus.${b.cancellation.refundStatus}`)}
            </p>
          )}
        </div>
      )}

      {(b.status === "confirmed" || b.status === "completed") && (
        <a
          href={waLink(
            b.venue.contactPhone,
            t("waToVenue", {
              court: b.resource.name,
              date: longDate(b.date, locale),
              start: b.startTime,
              end: b.endTime,
              venue: b.venue.name,
              code: b.code,
              name: b.customer?.name ?? "",
            }),
          )}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          {t("sendToVenue")}
        </a>
      )}

      {b.refundIfCancelledNowPaise !== null && <SharingPanel booking={b} />}

      <section className="space-y-2">
        <h2 className="font-semibold">{t("venueContact")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:+91${b.venue.contactPhone}`}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("call")}
          </a>
          <a
            href={googleMapsUrl(b.venue.location)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("openInMaps")}
          </a>
        </div>
      </section>

      {canCancel && (
        <section className="space-y-2 rounded-lg border p-3">
          <p className="text-sm">
            {b.refundIfCancelledNowPaise! > 0
              ? t("refundNow", { amount: formatPaise(b.refundIfCancelledNowPaise!) })
              : t("noRefund")}
          </p>
          {confirmingCancel ? (
            <>
              <Field label={t("reason")}>
                <Input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <p className="text-sm font-medium">{t("cancelConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  {t("cancel")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingCancel(false)}>
                  {tc("close")}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
              {t("cancel")}
            </Button>
          )}
          <FormError error={cancel.error} labels={{}} />
        </section>
      )}
    </article>
  );
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Detail id={id} />}</AuthGate>;
}
