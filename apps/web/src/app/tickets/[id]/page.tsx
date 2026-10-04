"use client";

import { formatPaise, ticketOrderSchema } from "@townplay/shared";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { PayPanel } from "@/components/booking/pay-panel";
import { AddToCalendar } from "@/components/events/add-to-calendar";
import { OrderStatusBadge } from "@/components/events/order-status";
import { QrImage } from "@/components/events/qr-image";
import { buttonVariants } from "@/components/ui/button";
import { clientEnv } from "@/env";
import { api } from "@/lib/api";
import { eventWhen } from "@/lib/event-time";
import { googleMapsUrl } from "@/lib/maps";

function useMinutesLeft(until: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((Date.parse(until) - now) / 60_000)) : null;
}

function Order({ id }: { id: string }) {
  const t = useTranslations("tickets");
  const te = useTranslations("events");
  const tc = useTranslations("common");
  const locale = useLocale();
  const order = useQuery({
    queryKey: ["ticket-order", id],
    queryFn: () => api.get(`/ticket-orders/${id}`, ticketOrderSchema),
    refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 5000 : false),
  });
  const minutesLeft = useMinutesLeft(order.data?.holdExpiresAt ?? null);
  if (order.isPending) return <p className="text-muted-foreground">{tc("loading")}</p>;
  if (order.isError) return <p className="text-destructive">{tc("error")}</p>;
  const o = order.data;
  const amount = o.totalPaise + o.convenienceFeePaise;

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{o.event.title}</h1>
          <OrderStatusBadge status={o.status} />
        </div>
        <p>{o.event.startsAt && eventWhen(o.event.startsAt, locale)}</p>
        <p className="text-sm text-muted-foreground">{o.event.address}</p>
        <p className="text-sm text-muted-foreground">{t("order", { code: o.code })}</p>
      </header>

      <ul className="space-y-1 text-sm">
        {o.items.map((i) => (
          <li key={i.tierId} className="flex justify-between">
            <span>
              {i.qty} × {i.tierName}
            </span>
            <span>{i.pricePaise === 0 ? te("free") : formatPaise(i.qty * i.pricePaise)}</span>
          </li>
        ))}
        {o.convenienceFeePaise > 0 && (
          <li className="flex justify-between text-muted-foreground">
            <span>{te("fee")}</span>
            <span>{formatPaise(o.convenienceFeePaise)}</span>
          </li>
        )}
      </ul>

      {o.status === "pending_payment" && (
        <div className="space-y-2 rounded-lg border border-amber-300 p-3">
          {minutesLeft === 0 ? (
            <p className="text-sm text-destructive">{t("holdExpired")}</p>
          ) : (
            <>
              <p className="text-sm font-medium">{t("payBy", { minutes: minutesLeft ?? 10 })}</p>
              <PayPanel
                target={{ ticketOrderId: o.id }}
                amountPaise={amount}
                description={`${o.event.title} · ${o.code}`}
                phone={o.buyer.phone}
                onPaid={() => void order.refetch()}
              />
            </>
          )}
        </div>
      )}

      {o.status === "refunded" && (
        <p className="text-sm">{t("refunded", { amount: formatPaise(o.refundPaise) })}</p>
      )}

      {o.tickets.length > 0 && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("showAtEntry")}</p>
          {o.tickets.map((ticket, i) => (
            <div
              key={ticket.id}
              className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center"
            >
              <p className="text-sm font-medium">
                {ticket.tierName} · {t("ticketOf", { n: i + 1, total: o.tickets.length })}
              </p>
              {ticket.qrToken && ticket.status === "valid" && !ticket.checkedInAt ? (
                <QrImage value={ticket.qrToken} label={`${ticket.tierName} ${i + 1}`} />
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  {ticket.status === "void" ? t("void") : t("checkedIn")}
                </p>
              )}
              <p className="text-sm">{ticket.holderName}</p>
            </div>
          ))}
        </section>
      )}

      {o.event.startsAt && (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={googleMapsUrl(o.event.location)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            {te("directions")}
          </a>
          <AddToCalendar
            id={o.event.id}
            title={o.event.title}
            startsAt={o.event.startsAt}
            endsAt={o.event.endsAt}
            address={o.event.address}
            url={`${clientEnv.NEXT_PUBLIC_SITE_URL}/${o.event.citySlug}/events/${o.event.slug}`}
          />
        </div>
      )}
    </article>
  );
}

export default function TicketOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Order id={id} />}</AuthGate>;
}
